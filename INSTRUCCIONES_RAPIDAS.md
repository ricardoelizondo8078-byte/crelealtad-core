# ⚡ INSTRUCCIONES RÁPIDAS - ENTRAR A LA APP

## 🚀 PASO 1: Iniciar la API

Ejecuta este script:

```bash
START_API_DEV.bat
```

O manualmente:

```bash
cd apps/api
npm run start:dev
```

Espera a ver el mensaje: `🚀 API iniciada en el puerto 3100`

---

## 📱 PASO 2: Iniciar la App Móvil

En otra terminal:

```bash
cd apps/mobile
npx expo start
```

---

## 🔐 PASO 3: Entrar con PIN 1234

En la pantalla de login:

```
Email: admin@crelealtad.com
PIN:   1234
```

**¡Listo! Deberías entrar sin problemas.**

---

## ⚠️ IMPORTANTE

Este PIN es **TEMPORAL** solo para desarrollo.

Ver documentación completa en:
- `COMO_ENTRAR_AHORA.md` - Instrucciones detalladas
- `SECURITY_PENDING.md` - Plan de corrección permanente
- `COMO_FUNCIONA_EL_LOGIN.md` - Explicación técnica

---

## 🐛 SI HAY PROBLEMAS

### "Credenciales inválidas" con PIN 1234

1. Verifica que `NODE_ENV=development` esté en `apps/api/.env`
2. Reinicia la API con `START_API_DEV.bat`
3. Verifica en consola que diga: `⚠️ [DEV] Autenticación con PIN temporal 1234`

### API no responde

```bash
# Matar procesos Node
taskkill /F /IM node.exe

# Reiniciar API
START_API_DEV.bat
```

### Puerto 3100 en uso

```bash
# Ver qué proceso usa el puerto
netstat -ano | findstr :3100

# Matar ese proceso (reemplaza PID con el número que aparece)
taskkill /F /PID <PID>
```

---

## ✅ DESPUÉS DE ENTRAR

Prueba el refactor de nombres según:

```
REFACTOR_NOMBRES_COMPLETADO.md
```

**NO elimines columnas de la BD todavía.**

---

**¡Listo para entrar!** 🚀
