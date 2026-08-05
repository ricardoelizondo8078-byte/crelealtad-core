#!/bin/bash
# =====================================================
# EJECUTAR MIGRACIONES HASTA PAUSA
# =====================================================

set -e  # Detener en caso de error

echo "=========================================="
echo "REFACTORIZACIÓN DE NOMBRES"
echo "Fases 1A, 1B, 2A, 2B, 3"
echo "=========================================="
echo ""

# Detectar conexión a PostgreSQL
if docker ps | grep -q postgres; then
    echo "✓ PostgreSQL detectado en Docker"
    CONTAINER=$(docker ps | grep postgres | awk '{print $1}')
    PSQL="docker exec -i $CONTAINER psql -U postgres -d crelealtad"
else
    echo "✓ Usando PostgreSQL local"
    PSQL="psql -U postgres -d crelealtad"
fi

echo ""
echo "=========================================="
echo "PASO 0: BACKUP"
echo "=========================================="
bash 00_backup_tablas.sh

if [ $? -ne 0 ]; then
    echo "❌ ERROR: Backup falló. Abortando."
    exit 1
fi

echo ""
read -p "¿Continuar con las migraciones? (s/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Abortado por el usuario."
    exit 0
fi

echo ""
echo "=========================================="
echo "FASE 1A: personas - Agregar nombres"
echo "=========================================="
$PSQL -f 01_personas_fase_A_agregar_nombres.sql

echo ""
echo "=========================================="
echo "FASE 1B: personas - Columna nombre_completo"
echo "=========================================="
$PSQL -f 02_personas_fase_B_nombre_completo.sql

echo ""
echo "=========================================="
echo "FASE 2A: solicitudes_datos_personales - Agregar nombres"
echo "=========================================="
$PSQL -f 03_solicitudes_datos_personales_fase_A_agregar_nombres.sql

echo ""
echo "=========================================="
echo "FASE 2B: solicitudes_datos_personales - Columna nombre_completo"
echo "=========================================="
$PSQL -f 04_solicitudes_datos_personales_fase_B_nombre_completo.sql

echo ""
echo "=========================================="
echo "FASE 3: Redefinir vista solicitudes_completo"
echo "=========================================="
$PSQL -f 05_redefinir_vista_solicitudes_completo.sql

echo ""
echo "=========================================="
echo "✅ MIGRACIONES EJECUTADAS HASTA PAUSA"
echo "=========================================="
echo ""
echo "⏸️  PAUSA - NO SE HAN ELIMINADO COLUMNAS VIEJAS"
echo ""
echo "Siguiente paso: Revisar datos migrados antes de eliminar"
echo "primer_nombre y segundo_nombre"
echo ""
