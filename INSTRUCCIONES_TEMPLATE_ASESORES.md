# 📋 INSTRUCCIONES - Template de Asesores

## Archivo generado
`TEMPLATE_ASESORES.csv`

Abre este archivo en **Excel** o **Google Sheets** para completar los datos.

---

## 📝 Columnas del template

### 1. **nombre** (REQUERIDO)
- Nombre completo del asesor
- Ejemplo: `Juan Pérez García`, `María López Hernández`
- **Importante:** Este es el nombre que aparecerá en el login y en toda la app

### 2. **email** (REQUERIDO, ÚNICO)
- Correo electrónico del asesor
- Debe ser único (no puede repetirse)
- Ejemplo: `juan.perez@crelealtad.com`
- **Sugerencia:** Usa el formato `nombre.apellido@crelealtad.com`

### 3. **pin** (REQUERIDO)
- PIN de 4 dígitos para login en la app móvil
- Solo números, exactamente 4 dígitos
- Ejemplo: `1234`, `5678`, `9999`
- **Importante:** Cada asesor debe tener un PIN único y fácil de recordar

### 4. **rol** (REQUERIDO)
- Rol del usuario en el sistema
- Valores permitidos:
  - `ASESOR` → Asesor de campo (captura expedientes)
  - `COORDINADOR` → Coordinador de sucursal (supervisa asesores)
  - `ADMINISTRADOR` → Administrador del sistema (acceso total)
- **Por defecto usa:** `ASESOR` (para la mayoría)

### 5. **sucursal** (REQUERIDO)
- Sucursal a la que pertenece
- Valores permitidos actualmente:
  - `MATRIZ` → Oficina principal
- **Nota:** Si tienes más sucursales, dímelo y las creo primero

### 6. **estado** (REQUERIDO)
- Estado del usuario
- Valores permitidos:
  - `ACTIVO` → Usuario activo, puede iniciar sesión
  - `INACTIVO` → Usuario dado de baja, NO puede iniciar sesión
  - `SUSPENDIDO` → Usuario suspendido temporalmente
- **Por defecto usa:** `ACTIVO`

### 7. **notas** (OPCIONAL)
- Campo libre para tus notas internas
- No se guarda en la base de datos, solo para tu referencia
- Ejemplo: `Asesor de zona norte`, `Coordinador desde 2024`

---

## ✅ Validaciones importantes

1. **Email único:** No puede haber dos asesores con el mismo email
2. **PIN de 4 dígitos:** Exactamente 4 números (0000-9999)
3. **Valores exactos:** En las columnas `rol`, `sucursal`, `estado` usa EXACTAMENTE los valores listados arriba (en MAYÚSCULAS)

---

## 📌 Ejemplo de llenado

| nombre | email | pin | rol | sucursal | estado | notas |
|--------|-------|-----|-----|----------|--------|-------|
| Ricardo Elizondo | ricardo.elizondo@crelealtad.com | 1111 | ADMINISTRADOR | MATRIZ | ACTIVO | Director general |
| Laura Sánchez | laura.sanchez@crelealtad.com | 2222 | COORDINADOR | MATRIZ | ACTIVO | Coordinadora zona norte |
| Pedro Gómez | pedro.gomez@crelealtad.com | 3333 | ASESOR | MATRIZ | ACTIVO | Asesor senior |
| Carmen Ruiz | carmen.ruiz@crelealtad.com | 4444 | ASESOR | MATRIZ | ACTIVO | Asesor junior |
| Luis Torres | luis.torres@crelealtad.com | 5555 | ASESOR | MATRIZ | INACTIVO | Renunció en junio 2025 |

---

## 🚀 Siguiente paso

1. **Completa el archivo** con todos tus asesores reales
2. **Guarda el archivo** (mantén el formato CSV o guárdalo como Excel)
3. **Avísame** cuando esté listo
4. **Yo ejecuto** el script de importación a PostgreSQL

---

## 💡 Preguntas frecuentes

### ¿Cuántos asesores puedo importar?
- Sin límite. Puedes importar 5, 50 o 500 asesores.

### ¿Qué pasa si me equivoco en un dato?
- No hay problema. Después de importar puedo generar un script de corrección.

### ¿Necesito crear más sucursales antes?
- Si tienes asesores en diferentes sucursales, dime los nombres y las creo primero.

### ¿Puedo cambiar los PINs después?
- Sí, puedo generar un script para actualizar PINs cuando quieras.

### ¿Debo incluir al usuario "Administrador" que ya existe?
- NO. El usuario admin@crelealtad.com (PIN 1234) ya existe. Solo agrega usuarios nuevos.

---

## 📞 ¿Tienes más sucursales?

Si tienes más sucursales además de MATRIZ, dime:
- Nombre de cada sucursal
- Dirección (opcional, puede ser general)
- Teléfono (opcional)

Y las creo antes de importar los asesores.
