# 🔐 CÓMO ENTRAR A LA APP AHORA (TEMPORAL - DESARROLLO)

## ⚠️ IMPORTANTE

Este método es **TEMPORAL** y **SOLO para desarrollo**. El PIN 1234 es un bypass que debe ser removido antes de producción.

Ver detalles completos en: `SECURITY_PENDING.md`

---

## ✅ PASOS PARA ENTRAR

### 1. Asegúrate de que la API esté corriendo

```bash
cd apps/api
npm run start:dev
```

Verifica que esté en modo desarrollo:
- Debe aparecer el mensaje: `⚠️ [DEV] Autenticación con PIN temporal 1234` cuando entres

---

### 2. Abre la app móvil

```bash
cd apps/mobile
npx expo start
```

---

### 3. En la pantalla de login

**Opción A: Usuario ADMINISTRADOR**
```
Email: admin@crelealtad.com
PIN:   1234
```

**Opción B: Cualquier otro usuario**
```
Email: juan.perez@crelealtad.com
PIN:   1234
```

**Opción C: Cualquier usuario válido**
```
Email: maria.lopez@crelealtad.com
PIN:   1234
```

---

## 🎯 CÓMO FUNCIONA

### Backend

El archivo `apps/api/src/auth/auth.service.ts` ahora tiene:

```typescript
const isDevelopment = process.env.NODE_ENV !== 'production';
const DEV_PIN = '1234';

if (isDevelopment && dto.password === DEV_PIN) {
  console.warn('⚠️ [DEV] Autenticación con PIN temporal 1234');
  passwordValida = true; // ← BYPASS
} else {
  passwordValida = await bcrypt.compare(dto.password, usuario.password_hash);
}
```

**En desarrollo (`NODE_ENV=development`):**
- ✅ Acepta PIN `1234` para **cualquier usuario**
- ✅ También acepta la contraseña real del usuario (si la sabes)

**En producción (`NODE_ENV=production`):**
- ❌ El bypass NO aplica
- ✅ Solo acepta la contraseña real con bcrypt

---

## 📋 USUARIOS DISPONIBLES

Todos estos usuarios aceptan el PIN `1234` en desarrollo:

| Nombre | Email |
|--------|-------|
| ADMINISTRADOR | admin@crelealtad.com |
| JUAN PÉREZ | juan.perez@crelealtad.com |
| MARÍA LÓPEZ | maria.lopez@crelealtad.com |
| ANA MARTÍNEZ | ana.martinez@crelealtad.com |
| CARLOS RAMÍREZ | carlos.ramirez@crelealtad.com |
| LUIS TORRES | luis.torres@crelealtad.com |

---

## 🚨 ADVERTENCIAS DE SEGURIDAD

### ❌ NO hacer:

1. **NO** desplegar esto a producción sin remover el bypass
2. **NO** cambiar `NODE_ENV=production` en desarrollo (bloquearía el PIN)
3. **NO** usar este PIN para datos reales de usuarios

### ✅ SÍ hacer:

1. Usar esto **SOLO para desarrollo local**
2. Revisar `SECURITY_PENDING.md` para el plan de corrección
3. Probar el refactor de nombres con este acceso temporal

---

## 🔧 SI NO FUNCIONA

### Problema: "Credenciales inválidas" con PIN 1234

**Solución:**

1. Verifica que `NODE_ENV=development` en `apps/api/.env`
2. Reinicia la API:
   ```bash
   cd apps/api
   npm run start:dev
   ```
3. Verifica que aparezca el mensaje de desarrollo en consola al entrar

---

### Problema: El teclado no me deja escribir el email

**Solución:**

El frontend debería tener dos campos:
1. Campo de email (teclado email)
2. Campo de PIN/contraseña (teclado numérico)

Si solo tienes un campo, verifica la implementación del formulario de login.

---

## 📝 SIGUIENTE PASO

Una vez que entres con el PIN 1234:

1. **Prueba el refactor de nombres** según:
   ```
   REFACTOR_NOMBRES_COMPLETADO.md
   ```

2. **Reporta si funciona correctamente**

3. **NO elimines columnas de la BD todavía** hasta que confirmes que todo funciona

---

## 🎯 PLAN DE CORRECCIÓN PERMANENTE

Ver `SECURITY_PENDING.md` para opciones:
- **Opción 1:** PIN numérico individual por usuario (encriptado con bcrypt) ← RECOMENDADO
- **Opción 2:** Cambiar teclado móvil a alfanumérico y usar contraseñas

---

**¡Listo para entrar y probar!** 🚀

Recuerda: Este PIN es **TEMPORAL** y debe ser corregido antes de producción.
