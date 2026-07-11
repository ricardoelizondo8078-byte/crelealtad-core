# 🚀 CRELEALTAD CORE - Guía de Inicio

## ✅ SOLUCIÓN DEFINITIVA - No más problemas de red

### 🎯 Método 1: SUPER FÁCIL (Recomendado)

1. **Doble clic en**: `INICIAR_PROYECTO.bat`
2. Se abrirán 2 ventanas automáticamente:
   - **Ventana 1**: API (servidor backend)
   - **Ventana 2**: Expo (aplicación móvil en MODO TÚNEL)
3. En tu celular:
   - Abre **Expo Go**
   - Escanea el **QR** que aparece en la ventana de Expo
   - ✨ ¡Listo! Funciona en **CUALQUIER red** (WiFi, datos, hotspot)

### 📱 ¿Por qué ahora SÍ funciona?

**Modo Túnel de Expo:**
- Crea una URL única de Internet
- No importa si cambias de WiFi
- No importa si usas datos móviles
- No importa si compartes internet del celular
- **SIEMPRE FUNCIONA** 🎉

---

## 🛠️ Método 2: Manual (si necesitas más control)

### Iniciar API:
```powershell
cd apps/api
npm start
```

### Iniciar Expo con detección automática de IP:
```powershell
cd apps/mobile
./start-expo.ps1
```

---

## ❓ Solución de Problemas

### "Veo varios CRELEALTAD Mobile en Expo Go"
1. Cierra completamente Expo Go en tu celular
2. Vuelve a abrirlo
3. Solo verás UNO con el QR activo

### "No aparece el QR"
1. Espera 30 segundos (Metro está compilando)
2. El QR aparecerá en la ventana de Expo

### "El túnel no conecta"
1. Verifica tu conexión a Internet
2. Reinicia con `INICIAR_PROYECTO.bat`

---

## 📋 Requisitos

- Node.js instalado
- Expo Go en tu celular
- Conexión a Internet (para modo túnel)

---

## 🎨 Desarrollado por
**CRELEALTAD CORE Team**
Con asistencia de Claude Code
