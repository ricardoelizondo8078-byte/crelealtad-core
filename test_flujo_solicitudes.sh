#!/bin/bash
# test_flujo_solicitudes.sh
# Flujo completo de 7 pasos del wizard de solicitudes

set -e

API_URL="http://localhost:3000"
# Ejecutar con: bash test_flujo_solicitudes.sh o pwsh -c "bash test_flujo_solicitudes.sh"

echo "=== FLUJO SOLICITUDES - 7 PASOS ==="
echo ""

# 1. Crear grupo
echo "1. Creando grupo..."
GRUPO=$(curl -s -X POST "$API_URL/grupos" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Grupo Prueba Wizard",
    "tesorera_id": "00000000-0000-0000-0000-000000000001"
  }')
GRUPO_ID=$(echo "$GRUPO" | jq -r '.id')
echo "Grupo creado: $GRUPO_ID"
echo "$GRUPO" | jq .
echo ""

# 2. Crear expediente
echo "2. Creando expediente..."
EXPEDIENTE=$(curl -s -X POST "$API_URL/expedientes" \
  -H "Content-Type: application/json" \
  -d "{
    \"grupo_id\": \"$GRUPO_ID\",
    \"numero_expediente\": \"EXP-WIZARD-$(date +%s)\"
  }")
EXPEDIENTE_ID=$(echo "$EXPEDIENTE" | jq -r '.id')
echo "Expediente creado: $EXPEDIENTE_ID"
echo "$EXPEDIENTE" | jq .
echo ""

# 3. Crear persona
echo "3. Creando persona..."
PERSONA=$(curl -s -X POST "$API_URL/personas" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "María",
    "apellido_paterno": "González",
    "apellido_materno": "López"
  }')
PERSONA_ID=$(echo "$PERSONA" | jq -r '.id')
echo "Persona creada: $PERSONA_ID"
echo "$PERSONA" | jq .
echo ""

# 4. Crear integrante
echo "4. Creando integrante..."
INTEGRANTE=$(curl -s -X POST "$API_URL/integrantes" \
  -H "Content-Type: application/json" \
  -d "{
    \"expediente_id\": \"$EXPEDIENTE_ID\",
    \"persona_id\": \"$PERSONA_ID\"
  }")
INTEGRANTE_ID=$(echo "$INTEGRANTE" | jq -r '.id')
echo "Integrante creado: $INTEGRANTE_ID"
echo "$INTEGRANTE" | jq .
echo ""

# 5. PATCH Paso 1: datos personales
echo "5. PATCH Paso 1 - Datos personales..."
PASO1=$(curl -s -X PATCH "$API_URL/solicitudes/$INTEGRANTE_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "curp": "GOLO901201MDFNPR08",
    "fecha_nac": "1990-12-01",
    "genero": "FEMENINO"
  }')
echo "$PASO1" | jq .
echo ""

# 6. PATCH Paso 2: domicilio
echo "6. PATCH Paso 2 - Domicilio..."
PASO2=$(curl -s -X PATCH "$API_URL/solicitudes/$INTEGRANTE_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "dom_calle": "Av. Juárez",
    "dom_colonia": "Centro",
    "dom_municipio": "Monterrey"
  }')
echo "$PASO2" | jq .
echo ""

# 7. PATCH Paso 3: referencias
echo "7. PATCH Paso 3 - Referencias..."
PASO3=$(curl -s -X PATCH "$API_URL/solicitudes/$INTEGRANTE_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "ref1_nombre": "Juan Pérez",
    "ref2_nombre": "Ana Martínez"
  }')
echo "$PASO3" | jq .
echo ""

# 8. PATCH Paso 4: negocio
echo "8. PATCH Paso 4 - Negocio..."
PASO4=$(curl -s -X PATCH "$API_URL/solicitudes/$INTEGRANTE_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "negocio_giro": "COMERCIO",
    "negocio_ingreso_semanal": 2500
  }')
echo "$PASO4" | jq .
echo ""

# 9. PATCH Paso 5: beneficiario
echo "9. PATCH Paso 5 - Beneficiario..."
PASO5=$(curl -s -X PATCH "$API_URL/solicitudes/$INTEGRANTE_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiario_nombre": "Pedro González",
    "beneficiario_parentesco": "HIJO"
  }')
echo "$PASO5" | jq .
echo ""

# 10. PATCH Paso 6: validaciones
echo "10. PATCH Paso 6 - Validaciones..."
PASO6=$(curl -s -X PATCH "$API_URL/solicitudes/$INTEGRANTE_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "tiene_medidor_luz": true,
    "vive_max_5km_tesorera": true
  }')
echo "$PASO6" | jq .
echo ""

# 11. PATCH Paso 7: documentos
echo "11. PATCH Paso 7 - Documentos..."
PASO7=$(curl -s -X PATCH "$API_URL/solicitudes/$INTEGRANTE_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "doc_ine_ruta": "/uploads/ine_123.jpg",
    "doc_comprobante_ruta": "/uploads/comp_123.pdf",
    "doc_ine_beneficiario_ruta": "/uploads/ine_ben_123.jpg",
    "doc_solicitud_firmada_ruta": "/uploads/sol_123.pdf"
  }')
echo "$PASO7" | jq .
echo ""

# 12. GET final
echo "12. GET solicitud completa..."
FINAL=$(curl -s "$API_URL/solicitudes/$INTEGRANTE_ID")
echo "$FINAL" | jq .
echo ""

echo "=== VERIFICACIÓN EN BASE DE DATOS ==="
echo "Conteos de filas en tablas hijas:"
echo ""
