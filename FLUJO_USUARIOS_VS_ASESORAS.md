# 🔄 FLUJO: USUARIOS vs ASESORAS

## 📊 ARQUITECTURA ACTUAL

```
┌─────────────────────────────────────────────────────────────────┐
│                    MODELO DE 2 TABLAS                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐         ┌──────────────────────────────┐
│   USUARIOS              │         │   ASESORAS                   │
│  (Autenticación/Login)  │◄────────│   (Datos Personales)         │
└─────────────────────────┘   1:1   └──────────────────────────────┘
                             FK: usuario_id
```

---

## 🔑 TABLA `usuarios` (11 columnas)

### Propósito:
**Autenticación y control de acceso al sistema**

### Contiene:
```sql
usuarios:
  ✅ id                 -- UUID único
  ✅ nombre             -- Nombre para mostrar en login
  ✅ email              -- Credencial de login (ÚNICO)
  ✅ password_hash      -- PIN hasheado con bcrypt
  ✅ rol_id             -- FK → roles (ADMINISTRADOR, ASESOR, COORDINADOR)
  ✅ sucursal_id        -- FK → sucursales (MATRIZ, etc.)
  ✅ estado             -- ACTIVO, INACTIVO, SUSPENDIDO
  ✅ folio              -- Código de empleado (opcional)
  ✅ ultimo_login       -- Timestamp último acceso
  ✅ created_at         -- Cuándo se creó
  ✅ updated_at         -- Última modificación
```

### Responsabilidades:
- ✅ Login (email + PIN)
- ✅ Permisos (rol)
- ✅ Asignación a sucursal
- ✅ Control de sesión
- ✅ Auditoría de accesos

### Usuarios que NO son asesores:
- ADMINISTRADOR del sistema
- CONTADOR
- GERENTE que no sale a campo
- SUPERVISOR de sucursal

---

## 👤 TABLA `asesoras` (45 columnas)

### Propósito:
**Perfil completo del asesor de campo con TODOS sus datos personales, laborales y geolocalización**

### Contiene:
```sql
asesoras:
  ┌─────────────────────────────────────────────────┐
  │ VÍNCULO CON USUARIO                             │
  └─────────────────────────────────────────────────┘
  ✅ usuario_id         -- FK → usuarios (1:1)

  ┌─────────────────────────────────────────────────┐
  │ DATOS PERSONALES (7)                            │
  └─────────────────────────────────────────────────┘
  ✅ nombre, apellido_paterno, apellido_materno
  ✅ fecha_nacimiento, genero
  ✅ curp, rfc

  ┌─────────────────────────────────────────────────┐
  │ CONTACTO (8)                                    │
  └─────────────────────────────────────────────────┘
  ✅ email, telefono_celular, telefono_casa
  ✅ telefono_emergencia
  ✅ contacto_emergencia_nombre
  ✅ contacto_emergencia_parentesco

  ┌─────────────────────────────────────────────────┐
  │ DOMICILIO (8)                                   │
  └─────────────────────────────────────────────────┘
  ✅ dom_calle, dom_numero_ext, dom_numero_int
  ✅ dom_colonia, dom_municipio, dom_estado
  ✅ dom_codigo_postal, dom_referencias

  ┌─────────────────────────────────────────────────┐
  │ GEOLOCALIZACIÓN (3)                             │
  └─────────────────────────────────────────────────┘
  ✅ dom_latitud, dom_longitud
  ✅ dom_geolocalizacion_fecha

  ┌─────────────────────────────────────────────────┐
  │ FOTOGRAFÍAS Y DOCUMENTOS (4)                    │
  └─────────────────────────────────────────────────┘
  ✅ foto_perfil_ruta
  ✅ foto_ine_frente_ruta
  ✅ foto_ine_reverso_ruta
  ✅ foto_comprobante_domicilio_ruta

  ┌─────────────────────────────────────────────────┐
  │ DATOS LABORALES (9)                             │
  └─────────────────────────────────────────────────┘
  ✅ fecha_ingreso
  ✅ sucursal_id, zona_id
  ✅ jefe_inmediato_id (FK → usuarios)
  ✅ tipo_contrato (PLANTA, HONORARIOS, COMISION)
  ✅ nivel (JUNIOR, SENIOR, COORDINADOR)
  ✅ meta_mensual_grupos
  ✅ meta_mensual_monto

  ┌─────────────────────────────────────────────────┐
  │ CONTROL (5)                                     │
  └─────────────────────────────────────────────────┘
  ✅ folio, estado, activo
  ✅ observaciones
  ✅ created_at, updated_at
```

### Responsabilidades:
- ✅ Expediente laboral completo
- ✅ Datos para nómina/IMSS
- ✅ Contacto de emergencia
- ✅ Geolocalización de domicilio
- ✅ Fotografías y documentos legales
- ✅ Metas y evaluación de desempeño
- ✅ Jerarquía (jefe inmediato)

---

## 🔄 FLUJO COMPLETO

### 1️⃣ CREACIÓN DE ASESOR

```
PASO 1: Crear usuario para login
┌─────────────────────────────────────────────────┐
INSERT INTO usuarios (                            │
  nombre: "Juan Pérez García"                     │
  email: "juan.perez@crelealtad.com"              │
  password_hash: bcrypt("1234")  ◄─── PIN hasheado│
  rol_id: UUID_ROL_ASESOR                         │
  sucursal_id: UUID_MATRIZ                        │
  estado: "ACTIVO"                                │
)                                                 │
└─────────────────────────────────────────────────┘
         │
         │ Retorna: usuario_id = "abc-123-def"
         ▼
PASO 2: Crear perfil completo del asesor
┌─────────────────────────────────────────────────┐
INSERT INTO asesoras (                            │
  usuario_id: "abc-123-def"  ◄─── VINCULA         │
  nombre: "Juan"                                  │
  apellido_paterno: "Pérez"                       │
  apellido_materno: "García"                      │
  fecha_nacimiento: "1985-05-15"                  │
  curp: "PEGJ850515HNLRNS01"                      │
  telefono_celular: "8112345678"                  │
  dom_calle: "Av. Revolución"                     │
  dom_latitud: 25.6866142                         │
  dom_longitud: -100.3161126                      │
  fecha_ingreso: "2020-01-15"                     │
  tipo_contrato: "PLANTA"                         │
  nivel: "SENIOR"                                 │
  meta_mensual_grupos: 15                         │
  ... (todos los demás campos)                    │
)                                                 │
└─────────────────────────────────────────────────┘
```

---

### 2️⃣ LOGIN EN APP MÓVIL

```
Usuario abre app → LoginScreen

1. Selecciona su nombre del dropdown
   ↓
   GET /auth/login-list
   ↓
   Retorna lista de usuarios ACTIVOS:
   [
     { id: "abc-123", nombre: "Juan Pérez García", email: "juan.perez@..." }
   ]

2. Ingresa PIN: 1234
   ↓
   POST /auth/login
   {
     email: "juan.perez@crelealtad.com",
     password: process.env.DB_PASSWORD || process.env.DB_PASS
   }
   ↓
   Backend compara bcrypt(1234) vs password_hash
   ↓
   ✅ Si coincide:
   {
     usuario: { id, nombre, email, rol_id, sucursal_id },
     token: "token-jwt-o-uuid"
   }

3. App guarda sesión en memoria (AuthContext)
   ↓
   Usuario entra a "Mis Expedientes"
```

---

### 3️⃣ CONSULTA DE DATOS COMPLETOS

```
Usuario logueado: "Juan Pérez García"

Necesito ver su perfil completo:
┌─────────────────────────────────────────────────┐
SELECT                                            │
  u.*,                  ◄─── Datos de login       │
  a.*                   ◄─── Datos personales     │
FROM usuarios u                                   │
LEFT JOIN asesoras a ON a.usuario_id = u.id       │
WHERE u.id = 'abc-123-def'                        │
└─────────────────────────────────────────────────┘

Retorna:
  - Nombre para mostrar
  - Email de login
  - Rol y permisos
  - CURP, RFC, fecha nacimiento
  - Teléfonos completos
  - Domicilio completo
  - Geolocalización
  - Fotografías
  - Metas y evaluación
  - Jefe inmediato
```

---

### 4️⃣ ¿QUÉ PASA CON USUARIOS QUE NO SON ASESORES?

```
Ejemplo: Usuario ADMINISTRADOR

┌────────────────────────────────────┐
│ USUARIOS                           │
│  id: xyz-789                       │
│  nombre: "Administrador"           │
│  email: "admin@crelealtad.com"     │
│  rol_id: UUID_ADMINISTRADOR        │
│  estado: "ACTIVO"                  │
└────────────────────────────────────┘
         │
         │ NO tiene registro en asesoras
         ▼
┌────────────────────────────────────┐
│ ASESORAS                           │
│  (vacío para este usuario)         │
└────────────────────────────────────┘

Query:
  SELECT u.*, a.*
  FROM usuarios u
  LEFT JOIN asesoras a ON a.usuario_id = u.id
  WHERE u.id = 'xyz-789'

Retorna:
  - u.* lleno (datos de usuario)
  - a.* NULL (no es asesor)
```

---

## ✅ VENTAJAS DE ESTA ARQUITECTURA

### 1. **Separación de responsabilidades**
- `usuarios` → solo login/permisos (ligera, rápida)
- `asesoras` → perfil completo (solo cuando se necesita)

### 2. **Flexibilidad**
- Puedes tener usuarios que NO son asesores
- Administradores, contadores, gerentes sin perfil de asesor

### 3. **Performance**
- Login rápido (tabla usuarios pequeña: 11 columnas)
- Solo cargas datos de asesor cuando lo necesitas

### 4. **Seguridad**
- Password hash separado de datos personales
- Puedes desactivar usuario sin borrar su perfil

### 5. **Auditoría**
- `ultimo_login` en usuarios
- Historial completo en asesoras

---

## 🚨 PROBLEMAS CON ESTA ARQUITECTURA

### 1. **Duplicación de datos** 🔴
```
usuarios.nombre = "Juan Pérez García"
asesoras.nombre = "Juan"
asesoras.apellido_paterno = "Pérez"
asesoras.apellido_materno = "García"
```
❌ Problema: ¿Cuál es la verdad?
✅ Solución: usuarios.nombre se genera automáticamente de asesoras

### 2. **Email duplicado** 🔴
```
usuarios.email = "juan.perez@crelealtad.com"
asesoras.email = "juan.perez@crelealtad.com"
```
❌ Problema: Dos fuentes de verdad
✅ Solución: asesoras.email puede ser NULL (usar siempre usuarios.email)

### 3. **Estado duplicado** 🔴
```
usuarios.estado = "ACTIVO"
asesoras.estado = "ACTIVA"
asesoras.activo = true
```
❌ Problema: ¿Cuál controla si está activo?
✅ Solución: Usar SOLO usuarios.estado

---

## 💡 RECOMENDACIÓN DE MEJORA

### Opción 1: LIMPIAR DUPLICADOS (Recomendado)

```sql
-- ELIMINAR de asesoras:
ALTER TABLE asesoras DROP COLUMN email;     -- Usar usuarios.email
ALTER TABLE asesoras DROP COLUMN estado;    -- Usar usuarios.estado
ALTER TABLE asesoras DROP COLUMN activo;    -- Usar usuarios.estado
```

**Resultado:**
- `usuarios.email` → fuente única de verdad para email
- `usuarios.estado` → fuente única de verdad para activo/inactivo
- `asesoras` → solo datos que NO están en usuarios

### Opción 2: NORMALIZAR NOMBRE (Opcional)

```sql
-- Agregar trigger para sincronizar
CREATE TRIGGER sync_usuario_nombre
AFTER INSERT OR UPDATE ON asesoras
FOR EACH ROW
EXECUTE FUNCTION update_usuario_nombre();

-- Función que actualiza usuarios.nombre
CREATE FUNCTION update_usuario_nombre()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE usuarios
  SET nombre = NEW.nombre || ' ' || NEW.apellido_paterno || ' ' || COALESCE(NEW.apellido_materno, '')
  WHERE id = NEW.usuario_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🎯 FLUJO RECOMENDADO PARA IMPORTACIÓN

### Al importar asesores desde Excel:

```javascript
// Por cada fila del Excel:
const asesor = {
  // Del Excel
  nombre: "Juan",
  apellido_paterno: "Pérez",
  apellido_materno: "García",
  email: "juan.perez@crelealtad.com",
  pin: "1234",
  ...todoLosDemas
};

// PASO 1: Crear usuario
const usuario = await db.usuarios.create({
  nombre: `${asesor.nombre} ${asesor.apellido_paterno} ${asesor.apellido_materno}`,
  email: asesor.email,                    // ◄── Fuente única
  password_hash: await bcrypt.hash(asesor.pin, 10),
  rol_id: ROL_ASESOR_ID,
  sucursal_id: SUCURSAL_ID,
  estado: asesor.estado,                  // ◄── Fuente única
});

// PASO 2: Crear perfil asesor (SIN duplicados)
await db.asesoras.create({
  usuario_id: usuario.id,                 // ◄── VÍNCULO
  nombre: asesor.nombre,
  apellido_paterno: asesor.apellido_paterno,
  apellido_materno: asesor.apellido_materno,
  // email: NO (usar usuarios.email)
  // estado: NO (usar usuarios.estado)
  fecha_nacimiento: asesor.fecha_nacimiento,
  curp: asesor.curp,
  telefono_celular: asesor.telefono_celular,
  dom_calle: asesor.dom_calle,
  dom_latitud: asesor.dom_latitud,
  ...todoLosDemas
});
```

---

## 📋 RESUMEN EJECUTIVO

| ASPECTO | USUARIOS | ASESORAS |
|---------|----------|----------|
| **Propósito** | Login/Autenticación | Perfil completo |
| **Columnas** | 11 (ligera) | 45 (detallada) |
| **Obligatoria** | ✅ Sí (todos) | ⚠️ Solo asesores |
| **Contiene** | Email, PIN, Rol | CURP, domicilio, fotos, metas |
| **Relación** | 1 usuario → 0 o 1 asesor | |
| **Se usa en** | Login, permisos | Expediente laboral, geolocalización |

---

## ❓ PREGUNTAS PARA TI

1. **¿Quieres limpiar los campos duplicados?**
   - Eliminar: asesoras.email, asesoras.estado, asesoras.activo
   - Usar solo: usuarios.email, usuarios.estado

2. **¿Todos los usuarios del sistema son asesores?**
   - Si SÍ → podríamos simplificar a 1 tabla
   - Si NO → arquitectura actual es correcta

3. **¿Necesitas el campo `asesoras.nombre` separado?**
   - O usar siempre usuarios.nombre (generado automáticamente)

---

**¿Qué prefieres hacer:**
A) Limpiar duplicados (recomendado antes de importar)
B) Dejar como está e importar asesores
C) Revisar otra tabla primero
