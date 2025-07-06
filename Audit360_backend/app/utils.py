from django.db import connection


def activar_auditoria(tablas):
    """
    Activa auditoría para las tablas especificadas
    
    Uso:
        activar_auditoria('usuarios,productos,pedidos')
        activar_auditoria('mi_tabla')
    """
    print(f"🚀 Activando auditoría para: {tablas}")
    
    with connection.cursor() as cursor:
        cursor.execute("SELECT DATABASE()")
        db_name = cursor.fetchone()[0]
        
        cursor.callproc('crea_tabla_audit_grupal', [db_name, tablas])
        
        script = None
        for result in cursor.stored_results():
            rows = result.fetchall()
            if rows and rows[0][0]:
                script = rows[0][0]
                break
        
        if script:
            print("✅ Tablas de auditoría creadas")
            print("⚡ Ejecutando triggers...")
            
            parts = script.split('//')
            count = 0
            
            for part in parts:
                part = part.strip()
                if part and ('CREATE TRIGGER' in part or 'DROP TRIGGER' in part):
                    try:
                        cursor.execute(part)
                        count += 1
                    except:
                        pass  # Ignorar errores de DROP
            
            print(f"🎉 ¡Listo! {count} triggers ejecutados")
            return True
        else:
            print("❌ Error obteniendo script")
            return False


def activar_auditoria_modelos(*modelos):
    """
    Activa auditoría para modelos Django
    
    Uso:
        from myapp.models import Usuario, Producto
        activar_auditoria_modelos(Usuario, Producto)
    """
    tablas = []
    for modelo in modelos:
        tablas.append(modelo._meta.db_table)
    
    return activar_auditoria(','.join(tablas))
