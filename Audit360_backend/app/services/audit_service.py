from django.db import connection
import logging
import re


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
            cursor.callproc('audit_crea_tabla_grupal', [esquema, tablas_string])
            
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

                # 🔍 DEBUG: Mostrar comando original
                print(f"🔍 Comando original {i+1}: '{comando[:100]}...'")
                
                # 🚨 FILTRAR DELIMITER - Esta es la solución clave
                if comando.upper().startswith('DELIMITER'):
                    print(f"⚠️ Comando {i+1}: DELIMITER ignorado (no compatible con Python)")
                    triggers_ejecutados.append(f"⚠️ DELIMITER ignorado")
                    continue
                
                # Limpiar comentarios de línea que pueden causar problemas
                comando_limpio = AuditService.limpiar_comando_sql(comando)

                # 🚨 SEGUNDO FILTRO DELIMITER después de limpiar
                if 'DELIMITER' in comando_limpio.upper():
                    print(f"⚠️ Comando {i+1}: DELIMITER ignorado después de limpieza")
                    triggers_ejecutados.append(f"⚠️ DELIMITER ignorado")
                    continue
                
                if not comando_limpio:
                    continue
                
                print(f"⚡ Ejecutando comando {i+1}: {comando_limpio[:50]}...")
                
                try:
                    cursor.execute(comando_limpio)
                    
                    # Identificar tipo de comando
                    if 'CREATE TRIGGER' in comando_limpio.upper():
                        # Extraer nombre del trigger
                        nombre = AuditService.extraer_nombre_trigger(comando_limpio)
                        triggers_ejecutados.append(f"✅ CREADO: {nombre}")
                        print(f"✅ Trigger creado: {nombre}")
                    
                    elif 'DROP TRIGGER' in comando_limpio.upper():
                        nombre = AuditService.extraer_nombre_trigger_drop(comando_limpio)
                        triggers_ejecutados.append(f"🗑️ ELIMINADO: {nombre}")
                        print(f"🗑️ Trigger eliminado: {nombre}")
                    
                    else:
                        triggers_ejecutados.append(f"⚡ EJECUTADO: {comando_limpio[:30]}...")
                        print(f"⚡ Comando ejecutado exitosamente")
                    
                except Exception as e:
                    error_msg = str(e)
                    if "doesn't exist" in error_msg.lower():
                        triggers_ejecutados.append(f"ℹ️ Trigger no existía (normal)")
                        print(f"ℹ️ Trigger no existía (normal)")
                    else:
                        print(f"❌ Error en comando {i+1}: {error_msg}")
                        triggers_ejecutados.append(f"❌ ERROR: {error_msg[:50]}...")
        
        return triggers_ejecutados
    
    @staticmethod
    def limpiar_comando_sql(comando):
        """Limpiar comando SQL de elementos problemáticos"""
        # Eliminar comentarios de línea
        lineas = comando.split('\n')
        lineas_limpias = []
        
        for linea in lineas:
            linea = linea.strip()
            if 'DELIMITER' in linea.upper():
                continue
            # Ignorar líneas de comentario
            if linea.startswith('--') or linea.startswith('#'):
                continue
            # Eliminar comentarios inline
            if '--' in linea:
                linea = linea.split('--')[0].strip()
            if linea:
                lineas_limpias.append(linea)
        
        return '\n'.join(lineas_limpias)
    
    @staticmethod
    def extraer_nombre_trigger(comando):
        """Extraer nombre del trigger de un comando CREATE TRIGGER"""
        match = re.search(r'CREATE\s+(?:DEFINER\s*=\s*\S+\s+)?TRIGGER\s+`?(\w+)`?', comando, re.IGNORECASE)
        return match.group(1) if match else "trigger_desconocido"
    
    @staticmethod
    def extraer_nombre_trigger_drop(comando):
        """Extraer nombre del trigger de un comando DROP TRIGGER"""
        match = re.search(r'DROP\s+TRIGGER\s+(?:IF\s+EXISTS\s+)?`?(\w+)`?', comando, re.IGNORECASE)
        return match.group(1) if match else "trigger_desconocido"