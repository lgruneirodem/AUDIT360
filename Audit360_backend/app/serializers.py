from rest_framework import serializers
from .models import AuditAuxTxLog
from .models import TablaAuditada
from .models import InformeAuditoria
from .models import User, SystemLog,RollbackRequest
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
import secrets
import string

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['rol'] = user.rol
        token['nombre'] = user.nombre
        return token

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
        model = User
        fields = '__all__'

class UsuarioCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'nombre', 'apellido', 'telefono', 'rol', 'password']

    def create(self, validated_data):
        password = self.generate_secure_password()
        user = User.objects.create_user(
            email=validated_data['email'],
            nombre=validated_data['nombre'],
            apellido=validated_data['apellido'],
            telefono=validated_data.get('telefono', ''),
            rol=validated_data['rol'],
            password=password
        )
        user.generated_password = password
        return user

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['password'] = getattr(instance, 'generated_password', '********')
        return rep

    def generate_secure_password(self, length=12):
        chars = string.ascii_letters + string.digits + "!@#$%^&*()"
        return ''.join(secrets.choice(chars) for _ in range(length))


class RollbackRequestListSerializer(serializers.ModelSerializer):
    user_request = serializers.StringRelatedField()
    approved_by = serializers.StringRelatedField()

    class Meta:
        model = RollbackRequest
        fields = '__all__'

class RollbackRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = RollbackRequest
        fields = ['transaction_id', 'table_name', 'motivo']
    
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