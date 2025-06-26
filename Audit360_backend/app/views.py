
from rest_framework import viewsets
from rest_framework import status
from rest_framework.generics import ListAPIView,RetrieveUpdateAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from django.db.models import Count,Max
from datetime import datetime,timedelta
from django.db import connection
from django.utils.timezone import now
from django.conf import settings
from django.template.loader import render_to_string
from .serializers import AuditAuxTxLogSerializer, TablaAuditadaSerializer, InformeRequestSerializer, InformeSerializer,UsuarioSerializer,SystemLogSerializer
from .models import AuditAuxTxLog, TablaAuditada, InformeAuditoria, Usuario,SystemLog
from xhtml2pdf import pisa
from openai import OpenAI
import json


#
class UsuarioDetalleAPIView(RetrieveUpdateAPIView):
    permission_classes = [AllowAny]
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

class DashboardResumenView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        resumen = AuditAuxTxLog.objects.values('audit_type').annotate(total=Count('id_audit_aux_tx_log'))
        rollback = AuditAuxTxLog.objects.filter(rollbacked=True).count()

        # Conteo general
        resultado = {
            'Insert': 0,
            'Update': 0,
            'Delete': 0,
            'Rollback': rollback,
            'Errores': 0  
        }

        for item in resumen:
            tipo = item['audit_type']
            if tipo == 'I':
                resultado['Insert'] = item['total']
            elif tipo == 'U':
                resultado['Update'] = item['total']
            elif tipo == 'D':
                resultado['Delete'] = item['total']
            elif tipo == 'R':
                resultado['Rollback'] += item['total']

        # Operaciones recientes (últimos 24h)
        recientes = AuditAuxTxLog.objects.filter(
            created_on__gte=now() - timedelta(days=1)
        ).count()

        resultado['Recientes'] = recientes

        return Response(resultado)

class DashboardTablaView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        filtro_tabla = request.query_params.get('tabla')
        filtro_operacion = request.query_params.get('operacion')

        queryset = AuditAuxTxLog.objects.all()

        if filtro_tabla:
            queryset = queryset.filter(nom_tabla__icontains=filtro_tabla)
        if filtro_operacion:
            queryset = queryset.filter(audit_type=filtro_operacion[0])  # ej: Insert → I

        # Agrupar por tabla
        resumen = []
        tablas = queryset.values('nom_tabla').annotate(
            rows=Count('id_audit_aux_tx_log'),
            lastOp=Max('created_on')
        )

        for tabla in tablas:
            nombre = tabla['nom_tabla']
            ult_op = queryset.filter(nom_tabla=nombre).order_by('-created_on').first()

            resumen.append({
                'name': nombre,
                'rows': tabla['rows'],
                'audited': get_estado_auditoria(ult_op),
                'lastOp': map_operacion(ult_op.audit_type) if ult_op else '—'
            })

        return Response(resumen)

class SystemLogAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user

        # Si el usuario pertenece al grupo 'Auditor', solo ve logs relevantes para auditores
        if user.groups.filter(name='Auditor').exists():
            logs = SystemLog.objects.filter(visible_para='auditor')
        else:
            # Admin o cualquier otro rol ve todos los logs
            logs = SystemLog.objects.all()

        logs = logs.order_by('-timestamp')[:100]  # puedes paginar si necesitas
        serializer = SystemLogSerializer(logs, many=True)
        return Response(serializer.data)

class CrearAuditoriaView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        tabla = request.data.get('tabla')
        if not tabla:
            return Response({'error': 'Falta el nombre de la tabla'}, status=400)

        esquema = connection.settings_dict['NAME']
        try:
            with connection.cursor() as cursor:
                cursor.execute("CALL start_transaction_audit();")
                cursor.execute(f"CALL crea_tabla_audit_grupal('{esquema}', '{tabla}');")
                cursor.execute("CALL end_transaction_audit();")
                cursor.execute(f"CALL crea_vista_auditoria('{esquema}', '{tabla}');")
            return Response({'mensaje': f'Auditoría creada para tabla "{tabla}"'}, status=200)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

def get_estado_auditoria(obj):
    if obj.rollbacked:
        return 'fail'
    elif obj.audit_type == 'D':
        return 'neutral'
    return 'ok'


def map_operacion(code):
    return {
        'I': 'Insert',
        'U': 'Update',
        'D': 'Delete',
        'R': 'Rollback'
    }.get(code, 'Otro')

class TablaAuditadaListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        tablas = TablaAuditada.objects.all()

        # Filtros opcionales desde query params
        audit_activa = request.query_params.get('audit_activa')
        if audit_activa is not None:
            tablas = tablas.filter(audit_activa=audit_activa.lower() == 'true')

        trigger_insert = request.query_params.get('trigger_insert')
        if trigger_insert is not None:
            tablas = tablas.filter(trigger_insert=trigger_insert.lower() == 'true')

        trigger_update = request.query_params.get('trigger_update')
        if trigger_update is not None:
            tablas = tablas.filter(trigger_update=trigger_update.lower() == 'true')

        trigger_delete = request.query_params.get('trigger_delete')
        if trigger_delete is not None:
            tablas = tablas.filter(trigger_delete=trigger_delete.lower() == 'true')

        serializer = TablaAuditadaSerializer(tablas, many=True)
        return Response(serializer.data)


class HistorialViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    """
    ViewSet para listar el historial de auditoría.
    Solo permite lectura (GET).
    """
    queryset = AuditAuxTxLog.objects.all().order_by('-created_on')
    serializer_class = AuditAuxTxLogSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    
    # Campos por los que puedes filtrar desde el frontend
    filterset_fields = {
        'nom_tabla': ['exact', 'icontains'],
        'audit_type': ['exact'],
        'rollbacked': ['exact'],
        'created_on': ['gte', 'lte'],  # para filtros por rango de fechas
    }

    ordering_fields = ['created_on']

class ActividadPorPeriodoView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        agrupado_por = request.GET.get('agrupar', 'dia')  # opciones: dia, semana, mes
        fecha_inicio = request.GET.get('fecha_inicio')
        fecha_fin = request.GET.get('fecha_fin')

        # Rango de fechas
        queryset = AuditAuxTxLog.objects.all()
        if fecha_inicio and fecha_fin:
            try:
                inicio = datetime.fromisoformat(fecha_inicio)
                fin = datetime.fromisoformat(fecha_fin)
                queryset = queryset.filter(created_on__date__range=(inicio.date(), fin.date()))
            except Exception:
                return Response({'error': 'Fechas mal formateadas. Usa YYYY-MM-DD'}, status=400)

        # Agrupación según el parámetro
        if agrupado_por == 'semana':
            agrupador = TruncWeek('created_on')
        elif agrupado_por == 'mes':
            agrupador = TruncMonth('created_on')
        else:
            agrupador = TruncDate('created_on')

        data = (
            queryset
            .annotate(periodo=agrupador)
            .values('periodo')
            .annotate(total=Count('id_audit_aux_tx_log'))
            .order_by('periodo')
        )

        return Response(data)


# Diccionario de plantillas de prompt según el tipo de análisis
TIPO_ANALISIS_PROMPT = {
    "resumen": (
        "Resume las operaciones detectadas en la tabla '{tabla}' durante el periodo {periodo}. "
        "Identifica patrones clave, usuarios frecuentes y cualquier observación general relevante."
    ),
    "detallado": (
        "Realiza un análisis detallado de cada operación realizada en la tabla '{tabla}' durante el periodo {periodo}. "
        "Incluye contexto por operación: usuario, hora, campos afectados, y cualquier observación específica."
    ),
    "anomalías": (
        "Analiza las operaciones en la tabla '{tabla}' durante el periodo {periodo} para detectar anomalías. "
        "Céntrate en horarios fuera de lo normal, usuarios inusuales o campos críticos modificados inesperadamente."
    ),
    "tendencias": (
        "Analiza las tendencias de las operaciones en la tabla '{tabla}' durante el periodo {periodo}. "
        "Identifica campos más modificados, usuarios con mayor frecuencia de cambio, y evolución en el tiempo."
    )
}
class DatosInformeAPIView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        tabla = request.data.get('tabla')
        fecha_inicio = request.data.get('fecha_inicio')
        fecha_fin = request.data.get('fecha_fin')

        if not tabla or not fecha_inicio or not fecha_fin:
            return Response({'error': 'Faltan parámetros'}, status=400)

        try:
            query = f"""
                SELECT fecha, usuario, operacion, campos
                FROM {tabla}_log
                WHERE fecha BETWEEN %s AND %s
                ORDER BY fecha ASC
            """
            with connection.cursor() as cursor:
                cursor.execute(query, [fecha_inicio, fecha_fin])
                rows = cursor.fetchall()
        except Exception as e:
            return Response({'error': f'Error de consulta: {str(e)}'}, status=500)

        datos = [
            {
                'fecha': str(r[0]),
                'usuario': r[1],
                'operacion': r[2],
                'campos': r[3].split(',') if r[3] else []
            }
            for r in rows
        ]

        return Response(datos)
    
class DatosInformeAPIView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        tabla = request.data.get('tabla')
        fecha_inicio = request.data.get('fecha_inicio')
        fecha_fin = request.data.get('fecha_fin')

        if not tabla or not fecha_inicio or not fecha_fin:
            return Response({'error': 'Faltan parámetros'}, status=400)

        try:
            fecha_inicio_dt = datetime.strptime(fecha_inicio, "%Y-%m-%d")
            fecha_fin_dt = datetime.strptime(fecha_fin, "%Y-%m-%d")
        except ValueError:
            return Response({'error': 'Formato de fecha incorrecto. Usa YYYY-MM-DD'}, status=400)

        registros = AuditAuxTxLog.objects.filter(
            nom_tabla=tabla,
            created_on__range=(fecha_inicio_dt, fecha_fin_dt)
        ).order_by('created_on')

        resultado = []
        for r in registros:
            resultado.append({
                'fecha': r.created_on.strftime("%d/%m/%Y %H:%M"),
                'usuario': 'desconocido',  # lo puedes cambiar si tienes tracking de usuarios
                'operacion': {
                    'I': 'Insert',
                    'U': 'Update',
                    'D': 'Delete'
                }.get(r.audit_type, 'Desconocida'),
                'campos': []  # puedes rellenar si más adelante incluyes tracking de campos
            })

        return Response(resultado)

class GuardarInformeAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        try:
            InformeAuditoria.objects.create(
                tabla=data.get('tabla'),
                periodo=data.get('periodo'),
                resumen=data.get('resumen'),
                datos=data.get('datos'),
                generado_por=request.user.username if request.user.is_authenticated else 'ionic_app'
            )
            return Response({'mensaje': 'Informe guardado correctamente'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class GenerarInformeIaAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = InformeRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        tabla = serializer.validated_data['tabla']
        periodo = serializer.validated_data['periodo']
        tipo = serializer.validated_data['tipo']
        datos = serializer.validated_data['datos']

        prompt_base = TIPO_ANALISIS_PROMPT[tipo].format(tabla=tabla, periodo=periodo)
        prompt = f"""
            {prompt_base}
            
            Datos:
            {json.dumps(datos, indent=2)}

            Genera un informe profesional y estructurado que incluya:

            1. Un resumen ejecutivo claro del comportamiento observado durante el periodo {periodo}.
            2. Un recuento total por tipo de operación (Insert, Update, Delete).
            3. Un listado resumido por fecha (máx. 5 líneas) indicando tipo de operación, usuario y número de acciones.
            4. Un apartado de observaciones relevantes o anomalías si las hubiera.

            4. **Observaciones relevantes** o anomalías si las hubiera.

                🔹 Usa Markdown o símbolos como `-` para listas.  
                🔹 Separa claramente cada sección con títulos o negritas (`**TÍTULO**`).  
                🔹 No repitas datos innecesarios.


            Informe generado:"

        """

        print("📤 Prompt enviado a OpenAI:")
        print(prompt)


        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            resumen = response.choices[0].message.content
            InformeAuditoria.objects.create(
                tabla=tabla,
                periodo=periodo,
                generado_por=request.user.username if request.user.is_authenticated else "anónimo",
                resumen=resumen,
                datos=datos
            )

            return Response({'resumen': resumen}, status=status.HTTP_200_OK)
            

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class InformePDFAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            informe = InformeAuditoria.objects.get(pk=pk)
        except InformeAuditoria.DoesNotExist:
            return Response({'error': 'Informe no encontrado'}, status=404)

        html = render_to_string("template_informe.html", {"informe": informe})
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="informe_{pk}.pdf"'

        pisa_status = pisa.CreatePDF(html, dest=response)
        if pisa_status.err:
            return Response({'error': 'Error al generar PDF'}, status=500)

        return response



class InformeRecienteAPIView(ListAPIView):
    permission_classes = [AllowAny]

    queryset = InformeAuditoria.objects.order_by('-fecha_generacion')[:10]
    serializer_class = InformeSerializer

        