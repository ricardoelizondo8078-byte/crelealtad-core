# 📱 Cómo Ver la App Móvil CRELEALTAD

**Fecha:** 2026-07-23  
**App:** React Native con Expo

---

## 🚀 ESTADO ACTUAL

Expo está iniciando en:
- **Puerto:** 8081
- **Modo:** Tunnel (accesible desde cualquier red)
- **Metro Bundler:** Corriendo

---

## 📱 OPCIÓN 1: Ver en tu Celular con Expo Go

### Paso 1: Instalar Expo Go

**Android:**
- Abre Google Play Store
- Busca "Expo Go"
- Instala la app

**iOS:**
- Abre App Store
- Busca "Expo Go"
- Instala la app

### Paso 2: Obtener el QR Code

Abre una terminal y ejecuta:

```bash
cd "C:\Users\Admin\Desktop\CRELEALTAD CORE\apps\mobile"
npx expo start --tunnel
```

Deberías ver algo como:

```
Metro waiting on exp://192.168.x.x:8081

› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press w │ open web

› Press r │ reload app
```

### Paso 3: Escanear el QR

1. **Abre Expo Go** en tu celular
2. **Escanea el QR** que aparece en la terminal
3. **Espera** que la app cargue (primera vez puede tardar 30-60 segundos)

---

## 💻 OPCIÓN 2: Ver en tu PC (Navegador Web)

### Método Automático:

En la terminal de Expo, presiona la tecla:
```
w
```

Esto abrirá automáticamente la app en tu navegador en:
```
http://localhost:8081
```

### Método Manual:

Abre tu navegador favorito y ve a:

```
http://localhost:8081
```

O también puedes acceder directamente a:

```
http://localhost:19006
```

---

## 🔧 OPCIÓN 3: Emulador Android

Si tienes Android Studio instalado:

1. Abre Android Studio
2. Inicia un emulador Android
3. En la terminal de Expo, presiona:
   ```
   a
   ```

---

## 🍎 OPCIÓN 4: Simulador iOS (Solo Mac)

Si estás en Mac con Xcode:

1. En la terminal de Expo, presiona:
   ```
   i
   ```

---

## 🌐 ACCESO DESDE OTRA COMPUTADORA EN TU RED

### Paso 1: Obtener tu IP local

En PowerShell:
```powershell
ipconfig | Select-String "IPv4"
```

Por ejemplo: `192.168.1.100`

### Paso 2: Acceder desde otra PC

Abre un navegador en la otra computadora y ve a:
```
http://192.168.1.100:8081
```

O con el puerto alternativo:
```
http://192.168.1.100:19006
```

---

## 📊 VERIFICAR QUE EXPO ESTÁ CORRIENDO

### En PowerShell:

```powershell
# Verificar proceso de Expo
Get-Process | Where-Object {$_.ProcessName -like "*node*"}

# Verificar puerto 8081
Test-NetConnection -ComputerName localhost -Port 8081
```

### En navegador:

Abre:
```
http://localhost:8081
```

Deberías ver la interfaz de Metro Bundler de Expo.

---

## ⚠️ SOLUCIÓN DE PROBLEMAS

### Problema 1: "No aparece el QR"

**Solución:**
```bash
cd apps/mobile
npx expo start --clear
```

### Problema 2: "Cannot connect to Metro"

**Solución:**
1. Verifica que el API en puerto 3000 esté corriendo
2. Revisa el archivo `apps/mobile/.env`:
   ```
   API_URL=http://localhost:3000
   ```

### Problema 3: "Tunnel not working"

**Solución - Usar LAN en lugar de Tunnel:**
```bash
npx expo start --lan
```

### Problema 4: "Expo Go no conecta"

**Asegúrate de que:**
- Tu celular y PC están en la MISMA red WiFi
- El firewall de Windows permite conexiones en puerto 8081

**Desbloquear puerto en Firewall:**
```powershell
New-NetFirewallRule -DisplayName "Expo Metro" -Direction Inbound -Protocol TCP -LocalPort 8081 -Action Allow
```

---

## 🎯 COMANDOS ÚTILES EN EXPO

Una vez que Expo está corriendo, puedes presionar:

```
› Press a │ open Android
› Press i │ open iOS (solo Mac)
› Press w │ open web browser
› Press r │ reload app
› Press m │ toggle menu
› Press j │ open debugger
› Press c │ clear bundler cache
```

---

## 📝 URLS IMPORTANTES

| Descripción | URL |
|-------------|-----|
| Metro Bundler | http://localhost:8081 |
| App Web (alternativo) | http://localhost:19006 |
| API Backend | http://localhost:3000 |
| DevTools | http://localhost:8081/debugger-ui |

---

## 🔄 REINICIAR TODO

Si algo no funciona, reinicia en este orden:

```bash
# 1. Detener Expo
# Presiona Ctrl+C en la terminal de Expo

# 2. Limpiar cache
cd apps/mobile
npx expo start --clear

# 3. Si aún falla, reinstalar dependencias
npm install
npx expo start
```

---

## 📱 CONFIGURACIÓN DE LA APP

### Verificar configuración del API:

```bash
# Ver archivo de configuración
cat apps/mobile/.env
```

Debería tener:
```env
API_URL=http://localhost:3000
# o
API_URL=http://192.168.x.x:3000  # Para celular
```

---

## 🎨 CARACTERÍSTICAS DE LA APP

Según tu código, la app móvil incluye:

- ✅ React Native 0.81.5
- ✅ Expo 54
- ✅ AsyncStorage (para datos locales)
- ✅ DateTimePicker
- ✅ Image Picker (para fotos)
- ✅ TypeScript

---

## 📸 CAPTURA DE PANTALLA DEL QR

El QR debería aparecer así en la terminal:

```
┌─────────────────────────────────────┐
│                                     │
│   ███ ▄▄▄▄▄ █▀█  ▄▄██  ▄▄▄▄▄ ███   │
│   █ █ █   █ ███▄▀▀ ▀▄▀ █   █ █ █   │
│   █ █ ▄▄▄▄█ ▀ █▄ ▀ ▀▄  ▄▄▄▄█ █ █   │
│   ███ ▄▄▄▄▄ █ █ ▀ ▀ ▀ ▄▄▄▄▄▄▄ ███   │
│   ... (más líneas de QR) ...       │
│                                     │
└─────────────────────────────────────┘

exp://192.168.x.x:8081
```

**Escanea este QR con Expo Go en tu celular**

---

## 🆘 AYUDA RÁPIDA

### Ver en navegador AHORA:

1. Abre PowerShell
2. Ejecuta:
   ```powershell
   Start-Process "http://localhost:8081"
   ```

### Ver en celular AHORA:

1. Instala Expo Go desde Play Store / App Store
2. Abre la terminal donde corre Expo
3. Escanea el QR que aparece
4. ¡Listo!

---

## ✅ CHECKLIST

Antes de escanear el QR:

- [ ] API corriendo en puerto 3000
- [ ] Expo corriendo en puerto 8081
- [ ] Expo Go instalado en el celular
- [ ] Celular y PC en la misma red WiFi
- [ ] Firewall permite puerto 8081

---

## 📞 COMANDOS COMPLETOS

### Iniciar todo desde cero:

```bash
# Terminal 1: API
cd "C:\Users\Admin\Desktop\CRELEALTAD CORE\apps\api"
npm run start:dev

# Terminal 2: Expo
cd "C:\Users\Admin\Desktop\CRELEALTAD CORE\apps\mobile"
npx expo start --tunnel
```

### Ver en navegador:

```bash
# En la terminal de Expo, presiona:
w
```

### Ver QR para celular:

```bash
# El QR aparece automáticamente en la terminal de Expo
# Solo escanéalo con Expo Go
```

---

**¡Listo!** Ahora tienes toda la información para ver tu app en cualquier dispositivo 🎉

**¿Necesitas ayuda adicional?** Dime qué dispositivo quieres usar:
- 📱 Celular Android
- 📱 iPhone
- 💻 Navegador web
- 🖥️ Emulador Android
