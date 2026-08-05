#!/bin/bash
# =====================================================
# BACKUP DE TABLAS ANTES DE REFACTORIZAR NOMBRES
# =====================================================

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_refactor_nombres_${TIMESTAMP}.sql"

echo "=========================================="
echo "CREANDO BACKUP DE TABLAS"
echo "=========================================="
echo "Archivo: $BACKUP_FILE"
echo ""

# Detectar si PostgreSQL está en Docker o local
if docker ps | grep -q postgres; then
    echo "PostgreSQL detectado en Docker"
    CONTAINER=$(docker ps | grep postgres | awk '{print $1}')

    docker exec -i $CONTAINER pg_dump \
      --username=postgres \
      --dbname=crelealtad \
      --table=public.personas \
      --table=public.solicitudes_datos_personales \
      --format=plain \
      --no-owner \
      --no-acl \
      > "$BACKUP_FILE"
else
    echo "Usando PostgreSQL local"

    pg_dump \
      --host=localhost \
      --port=5432 \
      --username=postgres \
      --dbname=crelealtad \
      --table=public.personas \
      --table=public.solicitudes_datos_personales \
      --format=plain \
      --no-owner \
      --no-acl \
      --file="$BACKUP_FILE"
fi

# Verificar que el backup se creó
if [ -f "$BACKUP_FILE" ]; then
    FILESIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    LINES=$(wc -l < "$BACKUP_FILE")
    INSERTS=$(grep -c "INSERT INTO" "$BACKUP_FILE" || echo "0")

    echo ""
    echo "=========================================="
    echo "✅ BACKUP CREADO EXITOSAMENTE"
    echo "=========================================="
    echo "Archivo: $BACKUP_FILE"
    echo "Tamaño: $FILESIZE"
    echo "Líneas: $LINES"
    echo "INSERT statements: $INSERTS"
    echo "Ubicación: $(pwd)/$BACKUP_FILE"
    echo ""
else
    echo ""
    echo "=========================================="
    echo "❌ ERROR: No se pudo crear el backup"
    echo "=========================================="
    exit 1
fi
