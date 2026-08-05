# ⚠️ PENDIENTES DE SEGURIDAD - CRÍTICO

## 🚨 BYPASS TEMPORAL DE AUTENTICACIÓN (SOLO DESARROLLO)

### Estado Actual: TEMPORAL - NO PRODUCCIÓN

**Archivos Modificados:**
- `apps/api/src/auth/auth.service.ts` (líneas 42-72)
- `apps/api/src/auth/dto/login.dto.ts` (línea 7)

### Descripción del Bypass:

Se implementó un **bypass temporal** que permite autenticación con PIN numérico `1234` en entorno de desarrollo:

```typescript
// En auth.service.ts
const isDevelopment = process.env.NODE_ENV !== 'production';
const DEV_PIN = '1234';

if (isDevelopment && dto.password === DEV_PIN) {
  console.warn('⚠️ [DEV] Autenticación con PIN temporal 1234');
  passwordValida = true;
} else {
  passwordValida = await bcrypt.compare(dto.password, usuario.password_hash);
}
```

### ¿Por qué existe esto?

**Contexto:**
1. La pantalla de login móvil tiene un teclado numérico hardcodeado
2. El sistema de autenticación seguro usa contraseñas alfanuméricas (ej: `Admin1234`)
3. **CONFLICTO:** No se pueden escribir letras con el teclado numérico

**Solución temporal:**
- Permitir PIN `1234` para cualquier usuario **SOLO en desarrollo**
- Esto permite probar el refactor de nombres sin bloquear el flujo
- En producción (`NODE_ENV=production`), el bypass NO aplica

---

## 🎯 PLAN DE CORRECCIÓN PERMANENTE

### Opción 1: PIN Numérico Individual por Usuario (RECOMENDADO)

**Implementación:**

1. **Agregar columna a la tabla `usuarios`:**
   ```sql
   ALTER TABLE usuarios ADD COLUMN pin_hash VARCHAR(60);
   ```

2. **Hashear PINs con bcrypt:**
   ```typescript
   // Generar PIN para usuario
   const pin = '1234'; // 4-6 dígitos
   const pin_hash = await bcrypt.hash(pin, 10);
   await this.usuariosRepo.update(userId, { pin_hash });
   ```

3. **Validar en el login:**
   ```typescript
   // Si el input es numérico y tiene 4-6 dígitos, validar contra pin_hash
   if (/^\d{4,6}$/.test(dto.password)) {
     passwordValida = await bcrypt.compare(dto.password, usuario.pin_hash);
   } else {
     passwordValida = await bcrypt.compare(dto.password, usuario.password_hash);
   }
   ```

4. **Actualizar frontend:**
   - Permitir al usuario configurar su PIN de 4-6 dígitos
   - Mostrar teclado numérico si ingresa PIN
   - Mostrar teclado completo si ingresa contraseña

**Ventajas:**
- Cada usuario tiene su propio PIN encriptado
- Mantiene seguridad con bcrypt
- Compatible con teclado numérico
- Permite dual-mode: PIN o contraseña completa

**Esfuerzo:** ~4 horas

---

### Opción 2: Cambiar Teclado a Alfanumérico

**Implementación:**

1. **Modificar el componente de login móvil:**
   ```tsx
   <TextInput
     keyboardType="default"  // Cambiar de "numeric" a "default"
     autoCapitalize="none"
     secureTextEntry
   />
   ```

2. **Eliminar el bypass temporal**

3. **Usar contraseñas alfanuméricas**

**Ventajas:**
- Solución más rápida
- Mantiene el sistema actual

**Desventajas:**
- Menos conveniente para usuarios (escribir contraseñas en móvil)
- No aprovecha la UX de PIN numérico

**Esfuerzo:** ~30 minutos

---

## 📋 CHECKLIST ANTES DE PRODUCCIÓN

Antes de desplegar a producción, **DEBE** completarse UNO de estos pasos:

- [ ] **Implementar Opción 1:** PIN individual por usuario con bcrypt
- [ ] **Implementar Opción 2:** Cambiar teclado a alfanumérico y usar contraseñas

**Y además:**

- [ ] Eliminar el bypass temporal de `auth.service.ts` (líneas 44-72)
- [ ] Restaurar `MinLength(6)` en `login.dto.ts`
- [ ] Verificar que `NODE_ENV=production` en el entorno de producción
- [ ] Probar login en producción con credenciales reales
- [ ] Actualizar este archivo con la fecha de corrección

---

## 🔐 HISTORIAL DE CAMBIOS

| Fecha | Cambio | Responsable |
|-------|--------|-------------|
| 2026-08-04 | Bypass temporal implementado (PIN 1234 en desarrollo) | Claude Code |
| _TBD_ | Corrección permanente aplicada | _Pendiente_ |

---

## ⚠️ ADVERTENCIAS

### NO hacer en producción:

1. ❌ NO desplegar con `NODE_ENV=development`
2. ❌ NO usar PIN 1234 para usuarios reales
3. ❌ NO dejar el bypass activo indefinidamente
4. ❌ NO compartir el PIN de desarrollo públicamente

### SÍ hacer:

1. ✅ Usar este bypass SOLO para desarrollo local
2. ✅ Planificar la corrección permanente cuanto antes
3. ✅ Configurar `NODE_ENV=production` en servidores
4. ✅ Auditar el código antes de cada release

---

## 📞 CONTACTO

Si tienes dudas sobre este bypass o la corrección permanente:
- Revisa este archivo
- Consulta `COMO_FUNCIONA_EL_LOGIN.md`
- Verifica la implementación en `apps/api/src/auth/auth.service.ts`

**Este archivo debe permanecer visible hasta que se corrija el bypass temporal.**
