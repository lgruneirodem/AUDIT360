from django.db import models

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

class Usuario(models.Model):
    nombre = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    telefono = models.CharField(max_length=20, blank=True)
    rol = models.TextField(blank=True)

    def __str__(self):
        return f"{self.nombre} {self.apellidos}"

class TablaAuditada(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    columnas = models.IntegerField(default=0)
    audit_activa = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    trigger_insert = models.BooleanField(default=False)
    trigger_update = models.BooleanField(default=False)
    trigger_delete = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

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

