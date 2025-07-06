from django.utils import timezone
from django.db import models
from django.contrib.auth.models import User, AbstractUser, BaseUserManager

class AuditAuxTxLog(models.Model):
    id_audit_aux_tx_log = models.AutoField(primary_key=True)
    id_transaccion = models.IntegerField(null=True, blank=True)
    nom_tabla = models.CharField(max_length=64, null=True, blank=True)
    audit_type = models.CharField(max_length=1, null=True, blank=True)  # I, U, D
    id_audit = models.IntegerField(null=True, blank=True)
    rollbacked = models.BooleanField(default=False)
    created_on = models.DateTimeField(auto_now_add=True)
    modified_on = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'audit_aux_tx_log'
        ordering = ['-created_on']
        managed = False

class SystemLog(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    tipo = models.CharField(max_length=64)  # Ej: "Trigger Error", "Integration"
    tabla = models.CharField(max_length=64, null=True, blank=True)
    mensaje = models.TextField()
    nivel = models.CharField(max_length=16)  # Ej: "CRITICO", "INFO", "ÉXITO"
    detalles = models.JSONField(null=True, blank=True)

    visible_para = models.CharField(
        max_length=16,
        choices=[('auditor', 'Auditor'), ('admin', 'Administrador')],
        default='admin'
    )

    def __str__(self):
        return f"[{self.nivel}] {self.tipo} - {self.tabla}"

# Custom Manager for User model
class UserManager(BaseUserManager):
    def create_user(self, email, nombre, apellido, password=None, **extra_fields):
        if not email:
            raise ValueError("El usuario debe tener un correo electrónico")
        
        email = self.normalize_email(email)
        extra_fields.setdefault("is_active", True)
        
        user = self.model(email=email, nombre=nombre, apellido=apellido, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, nombre, apellido, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if not extra_fields.get("is_staff") or not extra_fields.get("is_superuser"):
            raise ValueError("El superusuario debe tener is_staff=True y is_superuser=True")

        return self.create_user(email, nombre, apellido, password, **extra_fields)

# Custom User model extending AbstractUser
class User(AbstractUser):
    ROLE_CHOICES = [
        ('ADMIN', 'Administrador'),
        ('AUDITOR', 'Auditor'),
        ('LECTOR', 'Lector'),
    ]

    email = models.EmailField(unique=True)
    nombre = models.CharField(max_length=50)
    apellido = models.CharField(max_length=50)
    telefono = models.CharField(max_length=20, blank=True)
    rol = models.CharField(max_length=10, choices=ROLE_CHOICES, default='LECTOR')

    username = None  # Remove username field
    USERNAME_FIELD = 'email'  # Use email as the unique identifier
    REQUIRED_FIELDS = ['nombre', 'apellido']  # Required when creating superusers

    objects = UserManager()

    def __str__(self):
        return f"{self.email} ({self.get_rol_display()})"
    
class RollbackRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pendiente'),
        ('APPROVED', 'Aprobado'),
        ('REJECTED', 'Rechazado'),
        ('EXECUTED', 'Ejecutado')
    ]
    
    transaction_id = models.CharField(max_length=255)
    table_name = models.CharField(max_length=255)
    user_request = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rollback_requests')
    motivo = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(default=timezone.now)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_rollbacks')
    approved_at = models.DateTimeField(null=True, blank=True)
    executed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'rollback_requests'
        ordering = ['-created_at']

class RollbackExecuted(models.Model):
    request = models.ForeignKey(RollbackRequest, on_delete=models.CASCADE)
    transaction_id = models.CharField(max_length=255)
    table_name = models.CharField(max_length=255)
    executed_by = models.ForeignKey(User, on_delete=models.CASCADE)
    executed_at = models.DateTimeField(default=timezone.now)
    success = models.BooleanField(default=True)
    error_message = models.TextField(null=True, blank=True)
    
    class Meta:
        db_table = 'rollback_executed'

class TablaAuditada(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    columnas = models.IntegerField(default=0)
    audit_activa = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    trigger_insert = models.BooleanField(default=False)
    trigger_update = models.BooleanField(default=False)
    trigger_delete = models.BooleanField(default=False)
  

    class Meta:
        verbose_name = "Tabla auditada"
        verbose_name_plural = "Tablas auditadas"

    def __str__(self):
        return f"{self.nombre} ({'OK' if self.audit_activa else '❌'})"
    

class InformeAuditoria(models.Model):
    tabla = models.CharField(max_length=100)
    periodo = models.CharField(max_length=50)
    generado_por = models.CharField(max_length=100)
    fecha_generacion = models.DateTimeField(auto_now_add=True)
    resumen = models.TextField()
    datos = models.JSONField()

    def __str__(self):
        return f"{self.tabla} ({self.periodo})"

