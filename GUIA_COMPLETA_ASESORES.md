# 📋 GUÍA COMPLETA - Importación de Asesores

## ✅ Tabla ampliada exitosamente

La tabla `asesoras` ya fue ampliada con **44 columnas** que incluyen:
- ✅ Datos personales completos
- ✅ Información de contacto
- ✅ Domicilio completo
- ✅ Geolocalización
- ✅ Fotografías y documentos
- ✅ Datos laborales y metas

---

## 📄 Archivo generado

**TEMPLATE_ASESORES_COMPLETO.csv**

Ábrelo en **Excel** o **Google Sheets** y completa con tus datos reales.

---

## 📋 COLUMNAS DEL TEMPLATE (34 campos)

### 🔹 1. IDENTIFICACIÓN Y FOLIO

#### **folio** (Opcional)
- Número de empleado o folio interno
- Ejemplo: `A001`, `ASE-2024-001`, `MTY-005`
- Puede dejarse en blanco si no lo usas

---

### 🔹 2. DATOS PERSONALES (7 campos)

#### **nombre** (REQUERIDO)
- Nombre(s) del asesor
- Ejemplo: `Juan`, `María Elena`

#### **apellido_paterno** (REQUERIDO)
- Apellido paterno
- Ejemplo: `Pérez`, `López`

#### **apellido_materno** (REQUERIDO)
- Apellido materno
- Ejemplo: `García`, `Hernández`

#### **fecha_nacimiento** (REQUERIDO)
- Formato: `YYYY-MM-DD` (año-mes-día)
- Ejemplo: `1985-05-15`, `1990-12-25`

#### **genero** (REQUERIDO)
- Valores: `MASCULINO` o `FEMENINO`

#### **curp** (Recomendado)
- CURP de 18 caracteres
- Ejemplo: `PEGJ850515HNLRNS01`

#### **rfc** (Recomendado)
- RFC de 13 caracteres
- Ejemplo: `PEGJ850515ABC`

---

### 🔹 3. CONTACTO (8 campos)

#### **email** (REQUERIDO, ÚNICO)
- Correo electrónico corporativo
- Ejemplo: `juan.perez@crelealtad.com`
- **Debe ser único** (no puede repetirse)

#### **telefono_celular** (REQUERIDO)
- Teléfono celular a 10 dígitos
- Ejemplo: `8112345678`

#### **telefono_casa** (Opcional)
- Teléfono fijo
- Ejemplo: `8187654321`

#### **telefono_emergencia** (Recomendado)
- Teléfono de contacto de emergencia
- Ejemplo: `8199887766`

#### **contacto_emergencia_nombre** (Recomendado)
- Nombre del contacto de emergencia
- Ejemplo: `María Pérez`, `Carlos López`

#### **contacto_emergencia_parentesco** (Recomendado)
- Parentesco
- Ejemplo: `Hermana`, `Esposo`, `Madre`, `Padre`

---

### 🔹 4. DOMICILIO (8 campos)

#### **dom_calle** (REQUERIDO)
- Nombre de la calle
- Ejemplo: `Av. Revolución`, `Calle Hidalgo`

#### **dom_numero_ext** (REQUERIDO)
- Número exterior
- Ejemplo: `123`, `456`

#### **dom_numero_int** (Opcional)
- Número interior, departamento, local
- Ejemplo: `2A`, `5B`, `Depto 301`

#### **dom_colonia** (REQUERIDO)
- Colonia o fraccionamiento
- Ejemplo: `Centro`, `Obispado`, `San Pedro`

#### **dom_municipio** (REQUERIDO)
- Municipio o delegación
- Ejemplo: `Monterrey`, `San Pedro`, `Guadalupe`

#### **dom_estado** (REQUERIDO)
- Estado
- Ejemplo: `Nuevo León`, `México`, `Jalisco`

#### **dom_codigo_postal** (REQUERIDO)
- Código postal de 5 dígitos
- Ejemplo: `64000`, `66230`

#### **dom_referencias** (Opcional)
- Referencias para localizar el domicilio
- Ejemplo: `Edificio azul frente al parque`, `Casa blanca con portón negro`

---

### 🔹 5. GEOLOCALIZACIÓN (2 campos)

#### **dom_latitud** (Opcional, pero RECOMENDADO)
- Latitud del domicilio
- Formato decimal: `-25.12345678`
- Ejemplo: `25.6866142` (Monterrey centro)
- 💡 Usa Google Maps: clic derecho → coordenadas (primer número)

#### **dom_longitud** (Opcional, pero RECOMENDADO)
- Longitud del domicilio
- Formato decimal: `-100.12345678`
- Ejemplo: `-100.3161126`
- 💡 Usa Google Maps: clic derecho → coordenadas (segundo número)

---

### 🔹 6. DATOS LABORALES (7 campos)

#### **fecha_ingreso** (REQUERIDO)
- Fecha de ingreso a la empresa
- Formato: `YYYY-MM-DD`
- Ejemplo: `2020-01-15`, `2021-06-01`

#### **sucursal** (REQUERIDO)
- Sucursal a la que pertenece
- Valor actual: `MATRIZ`
- 💡 Si tienes más sucursales, dime para crearlas

#### **zona** (Opcional)
- Zona o región que atiende
- Ejemplo: `ZONA_NORTE`, `ZONA_SUR`, `ZONA_CENTRO`
- 💡 Si usas zonas, dime cuáles para crearlas

#### **tipo_contrato** (REQUERIDO)
- Tipo de contrato
- Valores permitidos:
  - `PLANTA` → Empleado de planta
  - `HONORARIOS` → Por honorarios
  - `COMISION` → Solo comisiones

#### **nivel** (REQUERIDO)
- Nivel o categoría del asesor
- Valores sugeridos:
  - `JUNIOR` → Asesor nuevo
  - `SENIOR` → Asesor experimentado
  - `COORDINADOR` → Coordinador de equipo
  - `GERENTE` → Gerente de sucursal

#### **meta_mensual_grupos** (Opcional)
- Número de grupos meta por mes
- Ejemplo: `15`, `10`, `20`

#### **meta_mensual_monto** (Opcional)
- Monto total meta por mes (sin comas ni símbolos)
- Ejemplo: `500000`, `350000`, `800000`

---

### 🔹 7. LOGIN Y ESTADO (2 campos)

#### **pin** (REQUERIDO)
- PIN de 4 dígitos para login en app móvil
- Ejemplo: `1234`, `5678`, `9999`
- **Debe ser único por asesor**

#### **estado** (REQUERIDO)
- Estado del asesor
- Valores permitidos:
  - `ACTIVO` → Asesor activo, puede usar la app
  - `INACTIVO` → Asesor dado de baja
  - `SUSPENDIDO` → Suspendido temporalmente

---

### 🔹 8. OBSERVACIONES (1 campo)

#### **observaciones** (Opcional)
- Notas internas sobre el asesor
- Ejemplo: `Asesor con mejor desempeño 2024`, `Nueva en el equipo`

---

## 📸 FOTOGRAFÍAS Y DOCUMENTOS

**IMPORTANTE:** Las fotografías NO se cargan en el Excel.

Las columnas de fotografías se llenarán después mediante:
1. **Captura desde la app móvil** (cada asesor sube sus propias fotos)
2. **Panel administrativo web** (próximamente)
3. **Script de importación masiva** (si tienes las fotos en una carpeta)

Fotografías incluidas:
- `foto_perfil_ruta` → Foto de perfil del asesor
- `foto_ine_frente_ruta` → INE frente
- `foto_ine_reverso_ruta` → INE reverso
- `foto_comprobante_domicilio_ruta` → Comprobante de domicilio

---

## ✅ CAMPOS OBLIGATORIOS (Mínimo para importar)

1. ✅ nombre
2. ✅ apellido_paterno
3. ✅ apellido_materno
4. ✅ fecha_nacimiento
5. ✅ genero
6. ✅ email (ÚNICO)
7. ✅ telefono_celular
8. ✅ dom_calle
9. ✅ dom_numero_ext
10. ✅ dom_colonia
11. ✅ dom_municipio
12. ✅ dom_estado
13. ✅ dom_codigo_postal
14. ✅ fecha_ingreso
15. ✅ sucursal
16. ✅ tipo_contrato
17. ✅ nivel
18. ✅ pin (4 dígitos, ÚNICO)
19. ✅ estado

---

## 🎯 CÓMO OBTENER COORDENADAS GPS

### Opción 1: Google Maps (Recomendado)
1. Abre **Google Maps** → https://maps.google.com
2. Busca la dirección exacta del asesor
3. Clic derecho sobre el pin
4. Selecciona el primer elemento (coordenadas)
5. Se copian automáticamente: `25.6866142, -100.3161126`
6. Pega en Excel:
   - **dom_latitud**: `25.6866142` (primer número)
   - **dom_longitud**: `-100.3161126` (segundo número)

### Opción 2: Dejar en blanco
- Si no tienes las coordenadas, déjalas vacías
- Se pueden agregar después

---

## 📊 EJEMPLO DE LLENADO

Ver las 5 filas de ejemplo en el archivo CSV para referencia completa.

---

## 🚀 SIGUIENTE PASO

### 1️⃣ Completa el Excel
- Llena todos los datos de tus asesores reales
- Asegúrate de que los **emails** sean únicos
- Asegúrate de que los **PINs** sean únicos
- Verifica que las fechas estén en formato `YYYY-MM-DD`

### 2️⃣ Guarda el archivo
- Puedes guardar como CSV o como Excel (.xlsx)
- Nombre sugerido: `asesores_crelealtad_2025.csv`

### 3️⃣ Avísame cuando esté listo
- Yo genero el script SQL de importación
- Lo ejecuto en PostgreSQL
- Verifico que todo se importó correctamente
- Creo los usuarios correspondientes en la tabla `usuarios`

---

## ❓ PREGUNTAS FRECUENTES

### ¿Debo incluir al usuario admin que ya existe?
**NO.** El usuario `admin@crelealtad.com` ya existe. Solo agrega asesores nuevos.

### ¿Qué pasa con la tabla `usuarios`?
Por cada asesor en `asesoras`, se crea automáticamente:
- Un registro en `usuarios` con su email y PIN hasheado
- Se vincula con `usuario_id`

### ¿Cuántos asesores puedo importar?
Sin límite. 5, 50, 500... los que necesites.

### ¿Necesito crear sucursales/zonas primero?
- **Sucursales:** Sí, si tienes más allá de MATRIZ, dime para crearlas
- **Zonas:** Opcional, si las usas dime cuáles son

### ¿Puedo dejar campos opcionales vacíos?
Sí, pero mientras más completo mejor. Los campos REQUERIDOS SÍ debes llenarlos.

### ¿Cómo corrijo errores después de importar?
Te genero scripts de actualización o puedes hacerlo desde pgAdmin.

---

## 💬 ¿NECESITAS MÁS SUCURSALES O ZONAS?

Si tienes más sucursales o zonas geográficas, dime:

**Sucursales:**
- Nombre
- Dirección
- Teléfono

**Zonas:**
- Nombre de cada zona
- Descripción (opcional)

Y las creo antes de que llenes el Excel.
