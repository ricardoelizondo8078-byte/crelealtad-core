# 🔐 CÓMO FUNCIONA EL LOGIN AHORA

## 📋 RESUMEN EJECUTIVO

El sistema de autenticación fue **completamente reconstruido** en una sesión de seguridad anterior. El PIN hardcodeado `1234` fue **eliminado** y reemplazado por un sistema **JWT + bcrypt** que usa **email + contraseña**.

---

## 1. ¿CÓMO SE VALIDAN LAS CREDENCIALES ACTUALMENTE?

### Sistema Actual: Email + Contraseña

El login ya NO usa PIN. El flujo es:

1. **Usuario ingresa:**
   - Email (ej: `admin@crelealtad.com`)
   - Contraseña (ej: `Admin1234`)

2. **Backend valida:**
   - Busca el usuario por email en la tabla `usuarios`
   - Compara la contraseña ingresada con el hash almacenado usando **bcrypt**
   - Verifica que el usuario esté en estado `ACTIVO`

3. **Si es válido:**
   - Genera un **JWT token** firmado
   - Actualiza el campo `ultimo_login`
   - Devuelve el token y los datos del usuario

4. **Si es inválido:**
   - Responde con `401 Unauthorized` y mensaje `"Credenciales inválidas"`

### Archivo Responsable:

`apps/api/src/auth/auth.service.ts` (líneas 42-89)

```typescript
async login(dto: LoginDto): Promise<LoginResponse> {
  // Buscar usuario por email
  const usuario = await this.usuariosRepo.findOne({
    where: { email: dto.email },
  });

  if (!usuario) {
    throw new UnauthorizedException('Credenciales inválidas');
  }

  // Verificar contraseña con bcrypt
  const passwordValida = await bcrypt.compare(dto.password, usuario.password_hash);

  if (!passwordValida) {
    throw new UnauthorizedException('Credenciales inválidas');
  }

  // Verificar que esté activo
  if (usuario.estado !== 'ACTIVO') {
    throw new UnauthorizedException('Usuario inactivo o suspendido');
  }

  // Generar JWT token
  const payload = {
    sub: usuario.id,
    email: usuario.email,
    rol: usuario.rol_id,
  };

  const token = this.jwtService.sign(payload);

  return {
    usuario: { ... },
    token,
  };
}
```

---

## 2. ¿EL PIN 1234 ERA HARDCODEADO? ¿QUÉ PASÓ CON ÉL?

### SÍ, el PIN 1234 fue eliminado

En la sesión de seguridad anterior:
- Se quitó cualquier lógica de autenticación con PIN hardcodeado
- Se implementó autenticación real con **email + contraseña**
- Las contraseñas se almacenan hasheadas con **bcrypt (10 rounds)**

### ¿Por qué no funciona el PIN 1234 ahora?

Porque **ya no existe ese flujo**. El sistema ahora:
- Requiere un **email válido** registrado en la tabla `usuarios`
- Requiere la **contraseña correcta** para ese email
- No hay ningún PIN de acceso rápido

---

## 3. USUARIOS EXISTENTES Y SUS CREDENCIALES

### Usuarios en la Base de Datos:

```
┌─────────────────────────────────────┬───────────────────────────────────┬──────────┐
│ NOMBRE                              │ EMAIL                             │ ESTADO   │
├─────────────────────────────────────┼───────────────────────────────────┼──────────┤
│ ADMINISTRADOR                       │ admin@crelealtad.com              │ ACTIVO   │
│ ANA MARTÍNEZ                        │ ana.martinez@crelealtad.com       │ ACTIVO   │
│ CARLOS RAMÍREZ                      │ carlos.ramirez@crelealtad.com     │ ACTIVO   │
│ JUAN PÉREZ                          │ juan.perez@crelealtad.com         │ ACTIVO   │
│ LUIS TORRES                         │ luis.torres@crelealtad.com        │ ACTIVO   │
│ MARÍA LÓPEZ                         │ maria.lopez@crelealtad.com        │ ACTIVO   │
└─────────────────────────────────────┴───────────────────────────────────┴──────────┘
```

### Cómo Están Guardadas las Credenciales:

```sql
SELECT
  nombre,
  email,
  LENGTH(password_hash) as hash_length,
  estado
FROM usuarios
WHERE email = 'admin@crelealtad.com';

-- Resultado:
-- nombre: ADMINISTRADOR
-- email: admin@crelealtad.com
-- hash_length: 60  ← Hash de bcrypt (10 rounds)
-- estado: ACTIVO
```

**Ejemplo de hash bcrypt:**
```
$2b$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123
```

Las contraseñas NO se almacenan en texto plano. Solo el hash bcrypt está en la columna `password_hash`.

---

## 4. PASOS EXACTOS PARA ENTRAR A LA APP

### ✅ OPCIÓN 1: Usuario ADMINISTRADOR (RECOMENDADO)

Acabamos de resetear la contraseña del administrador:

```
Email:      admin@crelealtad.com
Contraseña: Admin1234
```

### Pasos para entrar:

1. **Abre la app móvil**
2. **En la pantalla de login:**
   - Campo "Email": `admin@crelealtad.com`
   - Campo "Contraseña": `Admin1234`
3. **Presiona "Iniciar sesión"**
4. **Deberías entrar correctamente**

---

### ✅ OPCIÓN 2: Otros usuarios existentes

Los otros 5 usuarios tienen contraseñas hasheadas, pero **NO sabemos cuáles son** porque fueron generadas en el pasado.

**SI QUIERES USAR OTRO USUARIO:**

1. Ejecuta este script para resetear su contraseña:

```javascript
// reset_user_password.js
const { Client } = require('./apps/api/node_modules/pg');
const bcrypt = require('./apps/api/node_modules/bcrypt');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: 'crelealtad'
});

async function resetPassword(email, newPassword) {
  await client.connect();
  const hash = await bcrypt.hash(newPassword, 10);
  await client.query(
    'UPDATE usuarios SET password_hash = $1 WHERE email = $2',
    [hash, email]
  );
  console.log(`✅ Contraseña actualizada para ${email}: ${newPassword}`);
  await client.end();
}

resetPassword('juan.perez@crelealtad.com', 'Juan1234');
```

2. Luego usa ese email y contraseña en la app

---

## 🔧 SCRIPTS ÚTILES

### Ver todos los usuarios:

```bash
node check_users.js
```

### Resetear contraseña del admin:

```bash
node reset_admin_password.js
```

---

## ⚠️ IMPORTANTE: NO BORRES COLUMNAS DE LA BD TODAVÍA

Recuerda que el refactor de nombres está en pausa esperando tus pruebas. No toques:
- `primer_nombre`
- `segundo_nombre`

Solo prueba el login y el flujo de nombres con el usuario ADMINISTRADOR.

---

## 📝 SIGUIENTE PASO

1. **Usa estas credenciales:**
   ```
   Email: admin@crelealtad.com
   Contraseña: Admin1234
   ```

2. **Entra a la app**

3. **Prueba el refactor de nombres** según las instrucciones en:
   ```
   REFACTOR_NOMBRES_COMPLETADO.md
   ```

4. **Reporta si funciona o si hay errores**

---

## 🎯 RESUMEN DE LAS 4 PREGUNTAS

| # | Pregunta | Respuesta |
|---|----------|-----------|
| 1 | ¿Cómo se validan las credenciales actualmente? | **Email + contraseña con bcrypt + JWT** (no PIN) |
| 2 | ¿El PIN 1234 era hardcodeado? | **SÍ, fue eliminado** en sesión de seguridad anterior |
| 3 | ¿Qué usuarios existen? | **6 usuarios ACTIVOS**, contraseñas en hash bcrypt (60 caracteres) |
| 4 | Pasos exactos para entrar | **Email:** `admin@crelealtad.com` **Contraseña:** `Admin1234` |

---

**¿Listo para probar el login?** 🚀
