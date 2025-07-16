
from rest_framework import viewsets
from rest_framework import status
from rest_framework.generics import ListAPIView,RetrieveUpdateAPIView,ListCreateAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.filters import OrderingFilter
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from django.http import HttpResponse, JsonResponse
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from django.db.models import Count,Max
from datetime import datetime,timedelta
from django.db import connection
from django.utils.timezone import now
from django.utils import timezone
from django.conf import settings
from django.contrib.auth import get_user_model
from django.template.loader import render_to_string
from .serializers import AuditAuxTxLogSerializer, CustomTokenObtainPairSerializer, TablaAuditadaSerializer, InformeRequestSerializer, InformeSerializer, UsuarioCreateSerializer,UsuarioSerializer,SystemLogSerializer,RollbackRequestListSerializer,RollbackRequestSerializer
from .models import AuditAuxTxLog, RollbackExecuted, TablaAuditada, InformeAuditoria, User,SystemLog,RollbackRequest
from xhtml2pdf import pisa
from openai import OpenAI
import json
from app.services.audit_service import AuditService

User = get_user_model()

class UsuarioDetalleAPIView(RetrieveUpdateAPIView):
    permission_classes = [AllowAny]
    queryset = User.objects.all()
    serializer_class = UsuarioSerializer

class CreateUserView(ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UsuarioCreateSerializer
    permission_classes = [IsAdminUser]

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

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
class GestionAuditoriaAPIView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = DATABASE()
                AND table_name LIKE '%_audit';
                AND table_name NOT LIKE 'aud_%'
                AND table_name NOT LIKE 'v_aud_%'
                AND table_name NOT LIKE 'django_%';
            """)
            tablas_sistema = [row[0] for row in cursor.fetchall()]

        resultado = []

        for tabla in tablas_sistema:
            info = TablaAuditada.objects.filter(nombre=tabla).first()

            # Total registros
            with connection.cursor() as cursor:
                try:
                    cursor.execute(f"SELECT COUNT(*) FROM `{tabla}`;")
                    total = cursor.fetchone()[0]
                except Exception:
                    total = None  # Tabla vacía o error

            # Última operación desde tabla espejo
            tabla_espejo = f"aud_{tabla}"
            ultima_op = None
            try:
                with connection.cursor() as cursor:
                    cursor.execute(f"SELECT MAX(created_on) FROM `{tabla_espejo}`;")
                    row = cursor.fetchone()
                    ultima_op = row[0] if row and row[0] else None
            except Exception:
                pass

            # Calcular estado
            if info:
                if info.audit_activa:
                    estado = "ACTIVA"
                elif info.trigger_insert or info.trigger_update or info.trigger_delete:
                    estado = "CONFIGURANDO"
                else:
                    estado = "INACTIVA"
            else:
                estado = "INACTIVA"

            # Alerta simulada: si última op fue muy reciente
            alerta = None
            if ultima_op:
                delta = datetime.now() - ultima_op
                if delta < timedelta(minutes=2):
                    alerta = "Alta actividad"
                elif delta < timedelta(minutes=5):
                    alerta = "Actividad sospechosa"

            resultado.append({
                "tabla": tabla,
                "registros": total,
                "estado_auditoria": estado,
                "ultima_operacion": ultima_op,
                "alerta": alerta,
                "acciones": {
                    "configurable": estado != "INACTIVA",
                    "historial": estado == "ACTIVA",
                    "desactivable": estado == "ACTIVA",
                    "activable": estado == "INACTIVA"
                }
            })

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

class ExecuteRollbackAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, request_id):
        if request.user.rol != 'ADMIN':
            return Response({'detail': 'Acceso denegado'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            rollback_request = RollbackRequest.objects.get(id=request_id)
        except RollbackRequest.DoesNotExist:
            return Response({'error': 'Solicitud no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        
        if rollback_request.status != 'APPROVED':
            return Response({'error': 'La solicitud debe estar aprobada para ejecutarse'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Ejecutar el rollback usando la función existente
            with connection.cursor() as cursor:
                cursor.execute(f"CALL audit_rollback_transaction({rollback_request.transaction_id});")
            
            # Actualizar el estado de la solicitud
            rollback_request.status = 'EXECUTED'
            rollback_request.executed_at = timezone.now()
            rollback_request.save()
            
            # Crear registro de ejecución
            RollbackExecuted.objects.create(
                request=rollback_request,
                transaction_id=rollback_request.transaction_id,
                table_name=rollback_request.table_name,
                executed_by=request.user,
                success=True
            )
            
            return Response({'success': True, 'message': 'Rollback ejecutado exitosamente'})
            
        except Exception as e:
            # Registrar el error en la ejecución
            RollbackExecuted.objects.create(
                request=rollback_request,
                transaction_id=rollback_request.transaction_id,
                table_name=rollback_request.table_name,
                executed_by=request.user,
                success=False,
                error_message=str(e)
            )
            
            return Response({'error': f'Error al ejecutar rollback: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CreateRollbackRequestAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        
        if not request.user.is_authenticated:
            # Crear o obtener un usuario de prueba
            test_user, created = User.objects.get_or_create(
                email='test@example.com',
                defaults={ 
                    'nombre': 'Usuario Test',
                    'apellido': 'Prueba',
                    'rol': 'ADMIN' 
                }
            )
            user_for_request = test_user
        else:
            user_for_request = request.user
    
        serializer = RollbackRequestSerializer(data=request.data)
        if serializer.is_valid():
            rollback_request = serializer.save(user_request=user_for_request)
            return Response({
                'success': True,
                'message': 'Solicitud de rollback creada exitosamente',
                'request_id': rollback_request.id
            }, status=status.HTTP_201_CREATED)
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class ListRollbackRequestsAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        #if request.user.rol != 'ADMIN':
        #    return Response({'detail': 'Acceso denegado'}, status=status.HTTP_403_FORBIDDEN)

        solicitudes = RollbackRequest.objects.select_related('user_request', 'approved_by').order_by('-created_at')
        data = RollbackRequestListSerializer(solicitudes, many=True).data
        return Response({'success': True, 'data': data})

class ApproveRollbackAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, request_id):
        #if request.user.rol != 'ADMIN':
        #    return Response({'detail': 'Acceso denegado'}, status=status.HTTP_403_FORBIDDEN)
  
    
        try:
            rollback_request = RollbackRequest.objects.get(id=request_id)
        except RollbackRequest.DoesNotExist:
            return Response({'error': 'Solicitud no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        if rollback_request.status != 'PENDING':
            return Response({'error': 'La solicitud ya fue procesada'}, status=status.HTTP_400_BAD_REQUEST)
        
        if request.user.is_authenticated:
            approved_by_user = request.user
        else:
            # Crear o obtener un usuario admin de prueba
            from django.contrib.auth import get_user_model
            User = get_user_model()
            approved_by_user, created = User.objects.get_or_create(
                email='admin@test.com',
                defaults={
                    'nombre': 'Admin',
                    'apellido': 'Test', 
                    'rol': 'ADMIN'
                }
            )

        rollback_request.status = 'APPROVED'
        rollback_request.approved_by = approved_by_user  
        rollback_request.approved_at = timezone.now()
        rollback_request.save()

        return Response({'success': True, 'message': 'Solicitud aprobada'})

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

            INSTRUCCIONES ESPECÍFICAS:

                Redacta un informe profesional en FORMATO NARRATIVO (párrafos corridos, no listas). 
                El informe debe ser fluido, bien redactado y fácil de leer, como un informe ejecutivo real.

                ESTRUCTURA REQUERIDA:

                **ANÁLISIS DE ACTIVIDAD - TABLA '{tabla.upper()}'**
                Periodo: {periodo}

                [Escribe un párrafo introductorio que establezca el contexto del análisis, el periodo evaluado y un resumen general de los hallazgos. añadir salto de linea al final]

                **RESUMEN DE OPERACIONES**
                [En un párrafo corrido, presenta las métricas principales (Insert/Update/Delete) de forma natural, sin usar listas. Incluye el total y cualquier patrón relevante. añadir salto de linea al final]

                **COMPORTAMIENTO TEMPORAL Y DE USUARIOS**  
                [Combina en párrafos el análisis temporal y de usuarios. Si hay actividad, describe patrones, horarios pico, usuarios más activos. Si no hay actividad, explica las implicaciones. añadir salto de linea al final]

                **CONCLUSIONES Y RECOMENDACIONES**
                [Párrafo final con observaciones clave, posibles causas de los patrones observados, y recomendaciones específicas y accionables. añadir salto de linea al final]
                

                REGLAS DE REDACCIÓN:
                - NO uses listas con guiones (-) ni viñetas
                - añadir salto de linea al final de cada seccion 
                - NO uses formato de puntos numerados
                - Redacta en párrafos corridos y profesionales
                - Usa conectores y transiciones entre ideas
                - Si no hay datos, enfócate en el análisis contextual y recomendaciones
                - Mantén un tono profesional pero accesible
                - Incluye números y métricas de forma natural en el texto
                - Cada sección debe tener al menos 2-3 oraciones completas



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


class CrearAuditoriaAutomaticaAPIView(APIView):
    """Vista súper simple para crear auditoría automática"""
    permission_classes = [AllowAny]  # Cambiar por IsAuthenticated si quieres autenticación
    
    def post(self, request):
        """
        Crear auditoría automática
        
        POST /app/auditoria/crear/
        {
            "tablas": ["usuarios", "productos"]
        }
        """
        
        # Obtener tablas del request
        tablas = request.data.get('tablas', [])
        
        if not tablas:
            return Response({
                'success': False,
                'error': 'Debe especificar tablas'
            }, status=400)
        
        # Llamar al servicio
        resultado = AuditService.crear_auditoria_automatica(tablas)
        
        # Devolver resultado
        if resultado['success']:
            return Response({
                'success': True,
                'mensaje': f"✅ Auditoría creada exitosamente!",
                'estadisticas': {
                    'tablas_procesadas': resultado['tablas'],
                    'triggers_ejecutados': resultado['total_triggers'],
                    'detalles': resultado['triggers_ejecutados']
                }
            })
        else:
            return Response({
                'success': False,
                'error': resultado['error']
            }, status=400)
        
class ProbarAuditoriaAPIView(APIView):
    """Vista para probar rápidamente"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        """
        Prueba rápida con tabla de ejemplo
        GET /app/auditoria/probar/
        """
        
        # Probar con una tabla de ejemplo
        resultado = AuditService.crear_auditoria_automatica("test_table")
        
        return Response({
            'mensaje': 'Prueba de auditoría automática',
            'resultado': resultado
        })
        