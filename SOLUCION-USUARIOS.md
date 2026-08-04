# SOLUCIÓN DEFINITIVA - Usuarios no aparecen en Login

## ✅ CAMBIOS REALIZADOS

1. **Eliminado el sistema de API Discovery** - Era complejo y causaba problemas
2. **Simplificado api.ts** - Ahora usa DIRECTAMENTE la variable de entorno `.env`
3. **LoginScreen simplificado** - Ya no intenta "descubrir" el API
4. **App.tsx simplificado** - Eliminadas pantallas de "Conectando..."

## 🚀 CÓMO INICIAR (MÉTODO SIMPLE)

### Opción 1: Script Mejorado
```
iniciar-todo-mejorado.bat
```

Este script:
- Detecta tu IP automáticamente
- Actualiza el `.env` con la IP correcta
- Limpia el puerto 3100 si está ocupado
- Verifica que el firewall esté bien
- Inicia API y Expo
- Verifica que todo funcione

### Opción 2: Manual
1. Abre 2 terminales
2. Terminal 1 - API:
   ```
   cd apps\api
   npm run start:dev
   ```
3. Terminal 2 - Expo:
   ```
   cd apps\mobile
   npx expo start --lan
   ```

## 🔧 SI LOS USUARIOS NO APARECEN

### Paso 1: Verifica que el API esté corriendo
```powershell
# En PowerShell:
Invoke-WebRequest -Uri "http://192.168.1.83:3100/auth/login-list" -UseBasicParsing
```

Si funciona → Pasa al Paso 2
Si falla → El API no está corriendo, reinícialo

### Paso 2: Verifica el firewall
```powershell
# En PowerShell COMO ADMINISTRADOR:
New-NetFirewallRule -DisplayName "CRELEALTAD API Port 3100" -Direction Inbound -LocalPort 3100 -Protocol TCP -Action Allow
```

### Paso 3: Verifica el .env
Abre `apps\mobile\.env` y verifica que tenga:
```
EXPO_PUBLIC_API_BASE_URL=http://[TU-IP]:3100
```

**IMPORTANTE:** Después de cambiar `.env`, debes **REINICIAR Expo** (Ctrl+C y luego `npm start`)

### Paso 4: Verifica la IP
Si cambiaste de red WiFi, tu IP pudo cambiar.

Obtén tu IP actual:
```powershell
ipconfig
```

Actualiza el `.env` con la nueva IP y reinicia Expo.

## 📱 WORKFLOW DIARIO

1. Ejecuta `iniciar-todo-mejorado.bat`
2. Espera que abran las 2 ventanas (API y Expo)
3. Escanea el QR en Expo Go
4. ¡Listo!

## ⚠️ REGLAS DE ORO

1. **NUNCA cierres las ventanas de API y Expo mientras trabajas**
2. **Si cambias el `.env`, REINICIA Expo** (no basta con reload)
3. **Si cambias de red WiFi, ejecuta el script nuevamente**
4. **El firewall debe estar abierto** (puerto 3100)

## 🐛 DEBUG

Si aún no funciona, revisa los logs en la consola de Expo Go:
```
🔵 API_BASE_URL: http://192.168.1.83:3100
🔵 apiUrl generada: http://192.168.1.83:3100/auth/login-list
🔵 Intentando cargar usuarios desde: http://192.168.1.83:3100/auth/login-list
🔵 Response status: 200
🔵 Usuarios cargados: 6
```

Si ves `❌ Error cargando usuarios`, es problema de red/firewall.
