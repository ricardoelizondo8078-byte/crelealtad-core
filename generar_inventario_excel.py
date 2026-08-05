import json
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Border, Side, Alignment
from openpyxl.utils import get_column_letter

# Leer el JSON generado
with open('apps/api/esquema.json', 'r', encoding='utf-8') as f:
    datos = json.load(f)

columnas = datos['columnas']
pks = {(row['table_name'], row['column_name']): True for row in datos['pks']}
conteos = {row['relname']: row['n_live_tup'] for row in datos['conteos']}

# Clasificación de módulos
clasificacion_modulos = {
    'audit_log': '8. AUDITORIA',
    'backup_tesoreras_20260802': '8. AUDITORIA',
    'caja_movimientos': '7. CAJA',
    'calendario_pagos': '5. CREDITOS',
    'ciclos': '1. CATALOGOS',
    'codigos_postales': '1. CATALOGOS',
    'creditos': '5. CREDITOS',
    'empleados': '2. PERSONAS',
    'empleados_contacto': '2. PERSONAS',
    'empleados_datos_laborales': '2. PERSONAS',
    'empleados_documentos': '2. PERSONAS',
    'empleados_domicilios': '2. PERSONAS',
    'expedientes': '4. EXPEDIENTES Y SOLICITUDES',
    'grupos': '3. GRUPOS',
    'integrantes': '3. GRUPOS',
    'mora': '6. COBRANZA',
    'pagos': '6. COBRANZA',
    'personas': '2. PERSONAS',
    'productos_credito': '1. CATALOGOS',
    'reestructuras': '5. CREDITOS',
    'roles': '1. CATALOGOS',
    'solicitudes': '4. EXPEDIENTES Y SOLICITUDES',
    'solicitudes_beneficiarios': '4. EXPEDIENTES Y SOLICITUDES',
    'solicitudes_datos_personales': '4. EXPEDIENTES Y SOLICITUDES',
    'solicitudes_documentos': '4. EXPEDIENTES Y SOLICITUDES',
    'solicitudes_domicilios': '4. EXPEDIENTES Y SOLICITUDES',
    'solicitudes_negocios': '4. EXPEDIENTES Y SOLICITUDES',
    'solicitudes_referencias': '4. EXPEDIENTES Y SOLICITUDES',
    'solicitudes_validaciones': '4. EXPEDIENTES Y SOLICITUDES',
    'sucursales': '1. CATALOGOS',
    'usuarios': '1. CATALOGOS',
    'zonas': '1. CATALOGOS',
}

# Crear workbook
wb = Workbook()
ws = wb.active
ws.title = 'INVENTARIO_TABLAS'

# Encabezados
encabezados = [
    '#', 'TABLA', 'COLUMNA', 'TIPO_DATO', 'NULLABLE', 'DEFAULT',
    'RELACION_FK', 'REGISTROS_EN_TABLA', 'MODULO', 'ORIGEN_BASE_VIEJA', 'NOTAS_MIGRACION'
]

# Escribir encabezados
for col_idx, header in enumerate(encabezados, 1):
    cell = ws.cell(row=1, column=col_idx)
    cell.value = header
    cell.font = Font(name='Arial', size=10, bold=True, color='FFFFFF')
    cell.fill = PatternFill(start_color='7B1E2B', end_color='7B1E2B', fill_type='solid')
    cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)

# Altura de fila de encabezado
ws.row_dimensions[1].height = 30

# Anchos de columna
anchos = [5, 30, 30, 27, 10, 20, 30, 13, 30, 32, 38]
for col_idx, ancho in enumerate(anchos, 1):
    ws.column_dimensions[get_column_letter(col_idx)].width = ancho

# Escribir datos
fila_actual = 2
tabla_anterior = None
usar_gris = False

# Ordenar columnas por tabla
columnas_ordenadas = sorted(columnas, key=lambda x: (x['tabla'], x['posicion']))

for col_data in columnas_ordenadas:
    tabla = col_data['tabla']

    # Cambiar sombreado cuando cambia de tabla
    if tabla != tabla_anterior:
        usar_gris = not usar_gris
        contador_columna = 1
        tabla_anterior = tabla

    # Determinar si es PK
    es_pk = (tabla, col_data['columna']) in pks
    relacion = 'PK' if es_pk else (col_data['relacion_fk'] or '')

    # Obtener conteo de registros
    num_registros = conteos.get(tabla, 0)

    # Obtener módulo
    modulo = clasificacion_modulos.get(tabla, 'POR CLASIFICAR')

    # Escribir datos
    datos_fila = [
        contador_columna,
        tabla,
        col_data['columna'],
        col_data['tipo_dato'],
        col_data['nullable'],
        col_data['default_valor'] or '',
        relacion,
        num_registros,
        modulo,
        '',  # ORIGEN_BASE_VIEJA (vacío)
        ''   # NOTAS_MIGRACION (vacío)
    ]

    for col_idx, valor in enumerate(datos_fila, 1):
        cell = ws.cell(row=fila_actual, column=col_idx)
        cell.value = valor
        cell.font = Font(name='Arial', size=10)

        # Sombreado alternado por tabla
        if usar_gris:
            cell.fill = PatternFill(start_color='F2F2F2', end_color='F2F2F2', fill_type='solid')

        # Columnas 10 y 11 en amarillo
        if col_idx in [10, 11]:
            cell.fill = PatternFill(start_color='FFF2CC', end_color='FFF2CC', fill_type='solid')

        # Bordes
        thin_border = Border(
            left=Side(style='thin', color='D9D9D9'),
            right=Side(style='thin', color='D9D9D9'),
            top=Side(style='thin', color='D9D9D9'),
            bottom=Side(style='thin', color='D9D9D9')
        )
        cell.border = thin_border

    contador_columna += 1
    fila_actual += 1

# Freeze panes en C2
ws.freeze_panes = 'C2'

# Auto-filtro
ws.auto_filter.ref = f'A1:K{fila_actual - 1}'

# ============================================
# HOJA 2: RESUMEN
# ============================================
ws_resumen = wb.create_sheet('RESUMEN')

# Encabezados de resumen
encabezados_resumen = ['MODULO', 'TABLA', 'No. COLUMNAS', 'REGISTROS']
for col_idx, header in enumerate(encabezados_resumen, 1):
    cell = ws_resumen.cell(row=1, column=col_idx)
    cell.value = header
    cell.font = Font(name='Arial', size=10, bold=True, color='FFFFFF')
    cell.fill = PatternFill(start_color='7B1E2B', end_color='7B1E2B', fill_type='solid')
    cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)

ws_resumen.row_dimensions[1].height = 30

# Anchos de columna para resumen
anchos_resumen = [30, 30, 15, 15]
for col_idx, ancho in enumerate(anchos_resumen, 1):
    ws_resumen.column_dimensions[get_column_letter(col_idx)].width = ancho

# Obtener lista única de tablas
tablas_unicas = sorted(set(col['tabla'] for col in columnas))

fila_resumen = 2
for tabla in tablas_unicas:
    modulo = clasificacion_modulos.get(tabla, 'POR CLASIFICAR')
    num_registros = conteos.get(tabla, 0)

    # Fórmula COUNTIF para contar columnas
    formula_columnas = f'=COUNTIF(INVENTARIO_TABLAS!$B:$B,"{tabla}")'

    datos_resumen = [
        modulo,
        tabla,
        formula_columnas,
        num_registros
    ]

    for col_idx, valor in enumerate(datos_resumen, 1):
        cell = ws_resumen.cell(row=fila_resumen, column=col_idx)
        if col_idx == 3:  # Fórmula
            cell.value = valor
        else:
            cell.value = valor
        cell.font = Font(name='Arial', size=10)

        thin_border = Border(
            left=Side(style='thin', color='D9D9D9'),
            right=Side(style='thin', color='D9D9D9'),
            top=Side(style='thin', color='D9D9D9'),
            bottom=Side(style='thin', color='D9D9D9')
        )
        cell.border = thin_border

    fila_resumen += 1

# Fila TOTAL
cell = ws_resumen.cell(row=fila_resumen, column=1)
cell.value = 'TOTAL'
cell.font = Font(name='Arial', size=10, bold=True)

cell = ws_resumen.cell(row=fila_resumen, column=2)
cell.value = ''

# Fórmula SUM para total de columnas
cell = ws_resumen.cell(row=fila_resumen, column=3)
cell.value = f'=SUM(C2:C{fila_resumen - 1})'
cell.font = Font(name='Arial', size=10, bold=True)

# Total de registros
cell = ws_resumen.cell(row=fila_resumen, column=4)
cell.value = f'=SUM(D2:D{fila_resumen - 1})'
cell.font = Font(name='Arial', size=10, bold=True)

# Guardar
output_path = 'INVENTARIO_32_TABLAS_CRELEALTAD.xlsx'
wb.save(output_path)

print(f"\n✓ Archivo generado: {output_path}")
print(f"✓ Total de tablas: {len(tablas_unicas)}")
print(f"✓ Total de columnas: {len(columnas)}")

# Verificar el total calculado
wb_check = load_workbook(output_path, data_only=True)
ws_check = wb_check['RESUMEN']
total_calculado = ws_check[f'C{fila_resumen}'].value
print(f"✓ Total verificado en fórmula: {total_calculado}")
wb_check.close()

from openpyxl import load_workbook
# Recalcular y guardar de nuevo
wb_final = load_workbook(output_path)
wb_final.save(output_path)
print(f"✓ Archivo recalculado y guardado")
