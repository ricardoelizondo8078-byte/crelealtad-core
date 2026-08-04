import sqlite3
import shutil
import os
from datetime import datetime

# Rutas
db_path = r"C:\Users\Admin\AppData\Roaming\pgAdmin\pgadmin4.db"
backup_path = f"{db_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

print("\n" + "="*60)
print("  MODIFICANDO CONFIGURACIÓN DE PGADMIN")
print("="*60 + "\n")

# Hacer backup
print("📦 Creando backup...")
shutil.copy2(db_path, backup_path)
print(f"✅ Backup creado: {backup_path}\n")

# Conectar a la base de datos
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Ver configuración actual
print("📊 Configuración actual:")
print("-" * 60)
cursor.execute("SELECT name, value FROM setting WHERE name LIKE '%count%' OR name LIKE '%max%' OR name LIKE '%limit%' OR name LIKE '%rows%'")
current_settings = cursor.fetchall()
if current_settings:
    for name, value in current_settings:
        print(f"  {name}: {value}")
else:
    print("  (Sin configuraciones encontradas)")

print("\n🔧 Actualizando configuración...")
print("-" * 60)

# Configuraciones a establecer
settings = [
    ('query_tool_max_rows', '10000'),
    ('rows_to_show', '10000'),
    ('max_query_hist_stored', '10000'),
    ('auto_expand_sole_children', 'true'),
]

for name, value in settings:
    cursor.execute("""
        INSERT OR REPLACE INTO setting (name, value)
        VALUES (?, ?)
    """, (name, value))
    print(f"✅ {name} = {value}")

# Confirmar cambios
conn.commit()

# Mostrar nueva configuración
print("\n📊 Configuración actualizada:")
print("-" * 60)
cursor.execute("SELECT name, value FROM setting WHERE name LIKE '%count%' OR name LIKE '%max%' OR name LIKE '%limit%' OR name LIKE '%rows%'")
new_settings = cursor.fetchall()
for name, value in new_settings:
    print(f"  {name}: {value}")

# Cerrar conexión
conn.close()

print("\n" + "="*60)
print("✅ CONFIGURACIÓN MODIFICADA EXITOSAMENTE")
print("="*60)
print("\n⚠️  IMPORTANTE: Debes REINICIAR pgAdmin para que los cambios surtan efecto\n")
print("Pasos para reiniciar:")
print("  1. Cerrar completamente pgAdmin")
print("  2. Abrir pgAdmin nuevamente")
print("  3. Ir a: File → Preferences → Query Tool → Results grid")
print("  4. Verificar que 'Max rows to show' esté en 10000")
print()
