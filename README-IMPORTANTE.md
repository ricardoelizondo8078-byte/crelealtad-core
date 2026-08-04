# 🚀 CÓMO INICIAR CRELEALTAD APP

## ⚡ MÉTODO RÁPIDO (Recomendado)

**Doble clic en:**
```
INICIAR-TODO.bat
```

Esto hace AUTOMÁTICAMENTE:
1. ✅ Detecta tu IP WiFi actual
2. ✅ Actualiza el archivo `.env` con la IP correcta
3. ✅ Inicia el servidor API (puerto 3000)
4. ✅ Inicia Expo Metro (puerto 8081)
5. ✅ Abre el QR code en tu navegador

---

## 📱 USAR EN TU CELULAR

1. Ejecuta `INICIAR-TODO.bat`
2. Espera que aparezca el QR en tu navegador
3. Abre **Expo Go** en tu celular
4. Escanea el QR
5. ¡Listo!

---

## ⚠️ MUY IMPORTANTE

### ❌ NO CIERRES las ventanas negras (terminales)
- Una dice "API - CRELEALTAD"
- Otra dice "EXPO - CRELEALTAD"
- **Minimízalas, pero NO las cierres**

### ✅ Para detener la app:
- Cierra ambas ventanas negras cuando termines

---

## 🔧 POR QUÉ SE DETIENE LA APP

**El problema que tenías:**

Los servidores de desarrollo **NO son permanentes**. Se detienen cuando:
- Cierras la terminal/cmd
- Reinicias la PC
- Cierras la sesión de Claude Code

**La solución:**

Usa `INICIAR-TODO.bat` cada vez que quieras usar la app móvil.

---

## 📝 MÉTODO MANUAL (Si necesitas)

Si por alguna razón necesitas iniciar manualmente:

### 1. Actualizar IP en .env
```bash
# Verifica tu IP con:
ipconfig

# Actualiza apps/mobile/.env con:
EXPO_PUBLIC_API_BASE_URL=http://TU_IP_ACTUAL:3000
```

### 2. Iniciar API
```bash
cd apps/api
npm run start:dev
```

### 3. Iniciar Expo (en otra terminal)
```bash
cd apps/mobile
npx expo start --lan
```

### 4. Escanear QR
Abre: `QR-DEFINITIVO.html` y escanea con Expo Go

---

## 🌐 REQUISITOS

✅ Celular y PC en el **mismo WiFi**  
✅ Desactivar **datos móviles** en el celular  
✅ Tener **Expo Go** instalado  
✅ PostgreSQL corriendo (puerto 5432)  

---

## 🐛 SOLUCIÓN A PROBLEMAS COMUNES

### "Could not connect to server"
→ Ejecuta `INICIAR-TODO.bat` de nuevo (actualiza la IP automáticamente)

### "La app no carga"
→ Verifica que ambas ventanas (API y EXPO) estén abiertas

### "QR no funciona"
→ Asegúrate que estás en el mismo WiFi que la PC

---

## 📊 PUERTOS USADOS

- **3000** → API Backend (NestJS)
- **8081** → Expo Metro Bundler
- **5432** → PostgreSQL Database

---

## 💡 TIPS

1. **Deja las terminales abiertas** mientras uses la app
2. **Usa el .bat** siempre, no inicies manualmente
3. **Tu IP puede cambiar** → el .bat la detecta automáticamente
4. **Minimiza las ventanas** en lugar de cerrarlas

---

## 🔄 PARA SERVICIO PERMANENTE (Producción)

Si quieres que la app esté **siempre disponible** (24/7):

1. Necesitas desplegar en un servidor
2. Opciones:
   - Heroku (API)
   - Expo EAS (Mobile)
   - Railway/Render (API)
   - Vercel (API si migras a Next.js)

**Esto NO es necesario para desarrollo/pruebas.**

---

✅ **Creado el:** 24/07/2026  
📝 **Última actualización:** 24/07/2026  
