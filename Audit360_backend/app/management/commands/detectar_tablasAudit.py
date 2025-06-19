from django.core.management.base import BaseCommand
from django.db import connection
from app.models import TablaAuditada

class Command(BaseCommand):
    help = "Detecta tablas auditadas con triggers usando SQL compatible"

    def handle(self, *args, **kwargs):
        self.stdout.write("Ejecutando consulta para detectar tablas auditadas con triggers...")

        query = """
        SELECT
            t.table_name AS nombre_tabla,
            COUNT(c.column_name) AS columnas,
            CASE WHEN a.table_name IS NOT NULL THEN 1 ELSE 0 END AS audit_activa,
            EXISTS (
                SELECT 1 FROM information_schema.triggers trg
                WHERE trg.event_object_table = t.table_name AND trg.event_manipulation = 'INSERT'
            ) AS trigger_insert,
            EXISTS (
                SELECT 1 FROM information_schema.triggers trg
                WHERE trg.event_object_table = t.table_name AND trg.event_manipulation = 'UPDATE'
            ) AS trigger_update,
            EXISTS (
                SELECT 1 FROM information_schema.triggers trg
                WHERE trg.event_object_table = t.table_name AND trg.event_manipulation = 'DELETE'
            ) AS trigger_delete
        FROM information_schema.tables t
        LEFT JOIN information_schema.columns c
            ON t.table_schema = c.table_schema AND t.table_name = c.table_name
        LEFT JOIN information_schema.tables a
            ON a.table_schema = t.table_schema AND a.table_name = CONCAT(t.table_name, '_audit')
        WHERE t.table_schema = DATABASE()
          AND t.table_type = 'BASE TABLE'
          AND t.table_name NOT LIKE 'django_%'
          AND t.table_name NOT LIKE 'auth_%'
          AND t.table_name NOT LIKE '%_audit'
        GROUP BY t.table_name, a.table_name;
        """

        try:
            with connection.cursor() as cursor:
                cursor.execute(query)
                resultados = cursor.fetchall()

            for row in resultados:
                nombre, columnas, audit_activa, trig_insert, trig_update, trig_delete = row

                obj, creado = TablaAuditada.objects.update_or_create(
                    nombre=nombre,
                    defaults={
                        'audit_activa': bool(audit_activa),
                        'columnas': columnas,
                        'trigger_insert': bool(trig_insert),
                        'trigger_update': bool(trig_update),
                        'trigger_delete': bool(trig_delete),
                    }
                )

                estado = "Creada" if creado else "Actualizada"
                self.stdout.write(
                    f"{estado}: {nombre} | Auditoría: {'Sí' if audit_activa else 'No'} | "
                    f"Triggers -> INSERT: {'Sí' if trig_insert else 'No'}, "
                    f"UPDATE: {'Sí' if trig_update else 'No'}, "
                    f"DELETE: {'Sí' if trig_delete else 'No'}"
                )

        except Exception as e:
            self.stderr.write(f"Error en la ejecución: {str(e)}")
