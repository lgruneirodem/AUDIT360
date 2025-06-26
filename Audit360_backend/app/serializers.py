from rest_framework import serializers
from .models import AuditAuxTxLog
from .models import TablaAuditada
from .models import InformeAuditoria
from .models import Usuario, SystemLog


class AuditAuxTxLogSerializer(serializers.ModelSerializer):
    estado = serializers.SerializerMethodField()
    operacion = serializers.SerializerMethodField()

    class Meta:
        model = AuditAuxTxLog
        fields = ['created_on', 'id_transaccion', 'nom_tabla', 'audit_type', 'id_audit', 'rollbacked', 'estado', 'operacion']
    
    def get_estado(self, obj):
        if obj.rollbacked:
            return "danger"
        elif obj.audit_type == "D":
            return "warning"
        return "success"

    def get_operacion(self, obj):
        return {
            'I': 'Insert',
            'U': 'Update',
            'D': 'Delete',
            'R': 'Rollback'
        }.get(obj.audit_type, 'Otro')

class SystemLogSerializer(serializers.ModelSerializer):
    acciones = serializers.SerializerMethodField()

    class Meta:
        model = SystemLog
        fields = '__all__'

    def get_acciones(self, obj):
        if obj.nivel == "CRITICO":
            return ["Ver Error", "Reintentar"]
        elif obj.nivel == "INFO":
            return ["Revisar"]
        return ["Ver Detalles"]

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = '__all__'
    
class TablaAuditadaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TablaAuditada
        fields = [
            'nombre', 'columnas', 'audit_activa',
            'trigger_insert', 'trigger_update', 'trigger_delete',
        ]

class OperacionSerializer(serializers.Serializer):
    fecha = serializers.CharField()
    usuario = serializers.CharField()
    operacion = serializers.CharField()
    campos = serializers.ListField(child=serializers.CharField())

class InformeRequestSerializer(serializers.Serializer):
    tabla = serializers.CharField()
    periodo = serializers.CharField()
    tipo = serializers.ChoiceField(choices=["resumen", "detallado", "anomalías", "tendencias"])
    datos = serializers.ListField(child=OperacionSerializer())

class InformeSerializer(serializers.ModelSerializer):
    class Meta:
        model = InformeAuditoria
        fields = ['id', 'tabla', 'periodo', 'generado_por', 'fecha_generacion']