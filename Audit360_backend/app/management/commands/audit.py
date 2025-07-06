from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Activa auditoría automáticamente'

    def add_arguments(self, parser):
        parser.add_argument('tablas', help='Tablas separadas por comas')

    def handle(self, *args, **options):
        tablas = options['tablas']
        
        print(f"🚀 Activando auditoría para: {tablas}")
        
        with connection.cursor() as cursor:
            # Llamar a tu procedimiento existente
            cursor.execute("SELECT DATABASE()")
            db_name = cursor.fetchone()[0]
            
            cursor.callproc('crea_tabla_audit_grupal', [db_name, tablas])
            
            # Obtener el script generado
            script = None
            for result in cursor.stored_results():
                rows = result.fetchall()
                if rows and rows[0][0]:
                    script = rows[0][0]
                    break
            
            if script:
                print("Tablas de auditoría creadas")
                print("Ejecutando triggers...")
                
                # Ejecutar cada parte del script
                parts = script.split('//')
                count = 0
                
                for part in parts:
                    part = part.strip()
                    if part and ('CREATE TRIGGER' in part or 'DROP TRIGGER' in part):
                        try:
                            cursor.execute(part)
                            count += 1
                        except Exception as e:
                            if "doesn't exist" not in str(e).lower():
                                print(f"Error: {e}")
                
                print(f" ¡Listo! {count} triggers ejecutados")
            else:
                print("No se obtuvo script del procedimiento")