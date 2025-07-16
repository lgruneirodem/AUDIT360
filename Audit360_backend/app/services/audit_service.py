from django.db import connection
import logging


class AuditService:
    @staticmethod
    def crear_auditoria_automatica(tablas):
        try:
            print(f"🚀 Iniciando auditoría para: {tablas}")
            
            # Convertir a string si es lista
            if isinstance(tablas, list):
                tablas_string = ','.join(tablas)
            else:
                tablas_string = tablas
            
            # 1. Obtener esquema actual
            esquema = AuditService.obtener_esquema()
            print(f"📋 Esquema: {esquema}")
            
            # 2. Llamar al procedimiento
            script = AuditService.llamar_procedimiento(esquema, tablas_string)
            
            if not script:
                return {
                    'success': False,
                    'error': 'El procedimiento no devolvió script'
                }
            
            print(f"📄 Script obtenido: {len(script)} caracteres")
            
            # 3. Ejecutar triggers
            triggers = AuditService.ejecutar_triggers(script)
            
            # 4. Resultado exitoso
            return {
                'success': True,
                'tablas': tablas,
                'triggers_ejecutados': triggers,
                'total_triggers': len(triggers),
                'script_longitud': len(script)
            }
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'tablas': tablas
            }

    @staticmethod
    def obtener_esquema():
        """Obtener nombre de la base de datos actual"""
        with connection.cursor() as cursor:
            cursor.execute("SELECT DATABASE()")
            return cursor.fetchone()[0]
    
    @staticmethod
    def llamar_procedimiento(esquema, tablas_string):
        """Llamar al procedimiento crea_tabla_audit_grupal"""
        with connection.cursor() as cursor:
            
            print(f"🔧 Llamando: crea_tabla_audit_grupal('{esquema}', '{tablas_string}')")
            
            # Llamar al procedimiento
            cursor.callproc('crea_tabla_audit_grupal', [esquema, tablas_string])
            
            # Obtener el script devuelto
            script = None
            
            # Método 1: stored_results
            try:
                for result in cursor.stored_results():
                    rows = result.fetchall()
                    if rows and rows[0][0]:
                        script = rows[0][0]
                        break
            except:
                pass
            
            # Método 2: fetchall directo
            if not script:
                try:
                    rows = cursor.fetchall()
                    if rows and rows[0][0]:
                        script = rows[0][0]
                except:
                    pass
            
            return script
    
    @staticmethod
    def ejecutar_triggers(script):
        """Ejecutar todos los triggers del script"""
        if not script:
            return []
        
        # Dividir por '//' como hace tu procedimiento
        comandos = script.split('//')
        triggers_ejecutados = []
        
        with connection.cursor() as cursor:
            
            for i, comando in enumerate(comandos):
                comando = comando.strip()
                
                if not comando:
                    continue
                
                print(f"⚡ Ejecutando comando {i+1}: {comando[:50]}...")
                
                try:
                    cursor.execute(comando)
                    
                    # Identificar tipo de comando
                    if 'CREATE TRIGGER' in comando.upper():
                        # Extraer nombre del trigger
                        import re
                        match = re.search(r'CREATE\s+TRIGGER\s+`?(\w+)`?', comando, re.IGNORECASE)
                        nombre = match.group(1) if match else f"trigger_{i}"
                        triggers_ejecutados.append(f"✅ CREADO: {nombre}")
                        print(f"✅ Trigger creado: {nombre}")
                    
                    elif 'DROP TRIGGER' in comando.upper():
                        triggers_ejecutados.append(f"🗑️ ELIMINADO")
                        print(f"🗑️ Trigger eliminado")
                    
                except Exception as e:
                    error_msg = str(e)
                    if "doesn't exist" in error_msg.lower():
                        print(f"ℹ️ Trigger no existía (normal)")
                    else:
                        print(f"❌ Error: {error_msg}")
                        triggers_ejecutados.append(f"❌ ERROR: {error_msg[:30]}")
        
        return triggers_ejecutados