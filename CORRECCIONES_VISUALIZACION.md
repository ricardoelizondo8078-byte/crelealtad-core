# ✅ CORRECCIONES DE VISUALIZACIÓN - DATOS INTEGRANTE

## 📊 PROBLEMAS IDENTIFICADOS

### PROBLEMA 1: SolicitudFormScreen.tsx carga mal los datos del integrante
**Archivo:** `apps/mobile/src/features/solicitudes/SolicitudFormScreen.tsx`
**Líneas:** 416-436

El código intenta parsear el nombre completo AUNQUE el backend YA envía los nombres separados.

**Backend devuelve (correcto):**
```json
{
  "nombres": "MARÍA DEL SOCORRO",
  "apellido_pat": "GARCÍA",
  "apellido_mat": "LÓPEZ",
  "nombre": "MARÍA DEL SOCORRO GARCÍA LÓPEZ",
  "telefono": "1234567890",
  "telefonoSecundario": null,
  "montoSolicitado": 5000
}
```

**El código actual (INCORRECTO):**
```typescript
// LÍNEA 416-436
let nombres = integranteData.nombres || '';
let apellido_pat = integranteData.apellido_pat || '';
let apellido_mat = integranteData.apellido_mat || '';

// Fallback: si no hay nombres separados, intentar extraer del nombre completo
if (!nombres && !apellido_pat && !apellido_mat && integranteData.nombre) {
  // ... parsea el nombre completo
}
```

**El problema:** El código SÍ lee `integranteData.nombres`, `integranteData.apellido_pat`, `integranteData.apellido_mat`, pero como usa `||`, si son cadenas vacías `''` las ignora y intenta parsear el nombre completo.

**Esto FALLA cuando:**
- Los campos existen pero están vacíos en el backend (aunque no deberían estarlo)

### PROBLEMA 2: Recuadro superior NO muestra teléfono ni monto
**Archivo:** `apps/mobile/src/features/solicitudes/SolicitudFormScreen.tsx`
**Líneas:** 1566-1607

El componente `IntegranteCard` solo muestra:
- Nombre del integrante
- Posición (X/Y)

**Falta mostrar:**
- Teléfono
- Botón de llamada
- Monto solicitado

---

## 🔧 SOLUCIÓN

### CORRECCIÓN 1: Simplificar carga de datos del integrante

**apps/mobile/src/features/solicitudes/SolicitudFormScreen.tsx (líneas 416-447)**

**Cambiar de:**
```typescript
// Pre-cargar datos iniciales del integrante en el formulario
// Si no tiene nombres separados, intentar parsear del nombre completo
let nombres = integranteData.nombres || '';
let apellido_pat = integranteData.apellido_pat || '';
let apellido_mat = integranteData.apellido_mat || '';

// Fallback: si no hay nombres separados, intentar extraer del nombre completo
if (!nombres && !apellido_pat && !apellido_mat && integranteData.nombre) {
  const parts = integranteData.nombre.trim().split(/\s+/);
  if (parts.length >= 3) {
    // Asumir formato: Nombre(s) apellido_pat apellido_mat
    apellido_mat = parts.pop() || '';
    apellido_pat = parts.pop() || '';
    nombres = parts.join(' ');
  } else if (parts.length === 2) {
    // Solo tiene 2 partes: Nombre apellido_pat
    apellido_pat = parts[1] || '';
    nombres = parts[0] || '';
  } else if (parts.length === 1) {
    // Solo tiene nombre
    nombres = parts[0] || '';
  }
}

setForm((current) => ({
  ...current,
  nombres: nombres,
  apellido_pat: apellido_pat,
  apellido_mat: apellido_mat,
  telefonoInicial: integranteData.telefono || '',
  telefonoSecundario: integranteData.telefonoSecundario || '',
  montoSolicitado: String(integranteData.montoSolicitado || ''),
}));
```

**Cambiar a:**
```typescript
// Pre-cargar datos iniciales del integrante en el formulario
// El backend YA envía nombres separados, usarlos directamente
setForm((current) => ({
  ...current,
  nombres: integranteData.nombres || '',
  apellido_pat: integranteData.apellido_pat || '',
  apellido_mat: integranteData.apellido_mat || '',
  telefonoInicial: integranteData.telefono || '',
  telefonoSecundario: integranteData.telefonoSecundario || '',
  montoSolicitado: String(integranteData.montoSolicitado || ''),
}));
```

**Explicación:**
- El backend YA devuelve `nombres`, `apellido_pat`, `apellido_mat` correctamente
- No hace falta parsear el nombre completo
- Si los campos no existen, quedan vacíos (caso normal al crear un integrante nuevo)

---

### CORRECCIÓN 2: Mostrar teléfono y monto en el recuadro superior

**apps/mobile/src/features/solicitudes/SolicitudFormScreen.tsx (líneas 1566-1607)**

**El recuadro actual solo muestra:**
```tsx
<View style={styles.integranteHeader}>
  {/* Nombre a la izquierda - Actualización inmediata */}
  <Text allowFontScaling={false} style={styles.integranteName}>
    {integrante?.nombre || integranteNombre || 'Sin nombre'}
  </Text>

  {/* Número a la derecha */}
  {integrantePosition && integrantesTotal && (
    <Text allowFontScaling={false} style={styles.positionText}>
      {integrantePosition}/{integrantesTotal}
    </Text>
  )}
</View>

{/* Teléfono y Monto */}
{integrante && (
  <View style={styles.contactInfoRow}>
    {/* AQUÍ FALTA EL CÓDIGO */}
  </View>
)}
```

**El código correcto (LÍNEAS 1584-1604) YA EXISTE pero está MAL ALINEADO:**

El código correcto **SÍ está presente** en las líneas 1584-1604:

```tsx
{/* Teléfono y Monto */}
{integrante && (
  <View style={styles.contactInfoRow}>
    {/* Teléfono - Ícono fuera del recuadro celeste */}
    <View style={styles.phoneRowContainer}>
      <TouchableOpacity
        style={styles.phoneIconButton}
        onPress={() => handleLlamarIntegrante(integrante.telefono, integrante.nombre)}
      >
        <Text allowFontScaling={false} style={styles.phoneIcon}>📞</Text>
      </TouchableOpacity>
      <View style={styles.phoneDisplayContainer}>
        <Text allowFontScaling={false} style={styles.phoneText}>{formatPhone(integrante.telefono ?? '')}</Text>
      </View>
    </View>

    {/* Monto */}
    <View style={styles.montoContainer}>
      <Text allowFontScaling={false} style={styles.montoIcon}>💰</Text>
      <Text allowFontScaling={false} style={styles.montoText}>{formatCurrency(integrante.montoSolicitado)}</Text>
    </View>
  </View>
)}
```

**Verificar que existan los estilos (líneas ~2300+):**
```typescript
phoneRowContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
phoneIconButton: {
  backgroundColor: colors.actionBackground,
  padding: 10,
  borderRadius: 8,
},
phoneIcon: {
  fontSize: 20,
},
phoneDisplayContainer: {
  backgroundColor: colors.actionBackground,
  padding: 10,
  borderRadius: 8,
},
phoneText: {
  ...typography.body,
  color: colors.textPrimary,
},
montoContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  backgroundColor: colors.surfaceSecondary,
  padding: 10,
  borderRadius: 8,
},
montoIcon: {
  fontSize: 20,
},
montoText: {
  ...typography.body,
  fontWeight: 'bold',
  color: colors.textPrimary,
},
contactInfoRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: spacing.sm,
  gap: spacing.sm,
},
```

**SI LOS ESTILOS NO EXISTEN, agregarlos.**

---

### CORRECCIÓN 3: Verificar que el estado `integrante` se actualiza correctamente

**apps/mobile/src/features/solicitudes/SolicitudFormScreen.tsx (líneas 411-447)**

Verificar que el estado `integrante` se llena correctamente:

```typescript
// LÍNEA 411
const integranteResponse = await fetch(apiUrl(`/integrantes/${integranteId}`));
if (integranteResponse.ok) {
  integranteData = await integranteResponse.json();
  setIntegrante(integranteData);  // ← AQUÍ SE ESTABLECE EL ESTADO

  // Pre-cargar datos iniciales del integrante en el formulario
  setForm((current) => ({
    ...current,
    nombres: integranteData.nombres || '',
    apellido_pat: integranteData.apellido_pat || '',
    apellido_mat: integranteData.apellido_mat || '',
    telefonoInicial: integranteData.telefono || '',
    telefonoSecundario: integranteData.telefonoSecundario || '',
    montoSolicitado: String(integranteData.montoSolicitado || ''),
  }));
}
```

**Verificar que:**
1. El `fetch` usa `api.get()` con token (YA CORREGIDO en sesión anterior)
2. El `setIntegrante(integranteData)` se ejecuta

---

## 🧪 PRUEBA INMEDIATA

**Después de aplicar las correcciones:**

1. **Reinicia la app móvil**
2. **Entra al PASO 1 de la solicitud de un integrante que YA creaste**
3. **Verifica:**
   - ✅ Campo "Nombres" pre-cargado con "MARÍA DEL SOCORRO"
   - ✅ Campo "Apellido Paterno" pre-cargado con "GARCÍA"
   - ✅ Campo "Apellido Materno" pre-cargado con "LÓPEZ"
   - ✅ Campo "Teléfono" pre-cargado con "1234567890"
   - ✅ Recuadro superior muestra:
     - Nombre: "MARÍA DEL SOCORRO GARCÍA LÓPEZ"
     - Teléfono: "12 3456 7890" con botón de llamada 📞
     - Monto: "$5,000" con ícono 💰

---

## 📋 RESUMEN DE ARCHIVOS A MODIFICAR

1. ✅ **`apps/mobile/src/features/solicitudes/SolicitudFormScreen.tsx`**
   - Simplificar líneas 416-447 (carga de datos)
   - Verificar que líneas 1584-1604 existan y estén correctas (recuadro superior)
   - Verificar que estilos existan (~línea 2300+)

---

## ⚠️ NOTA IMPORTANTE

**NO borres columnas de la base todavía.**

Solo cuando hayas confirmado que:
1. ✅ Los datos se cargan correctamente en PASO 1
2. ✅ El recuadro superior muestra todo
3. ✅ Puedes crear integrantes sin error
4. ✅ Puedes completar TODO el flujo de captura

**SOLO ENTONCES** eliminamos las columnas legacy `primer_nombre` y `segundo_nombre`.
