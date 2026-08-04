# 🧪 Pruebas Rápidas - ECC Instalado

Este documento te ayuda a probar que ECC funciona correctamente con ejemplos prácticos.

---

## ✅ VERIFICACIÓN COMPLETADA

### Componentes Verificados:

**✅ Agentes Core:**
- planner
- code-reviewer
- security-reviewer
- typescript-reviewer
- python-reviewer
- e2e-runner
- build-error-resolver
- database-reviewer

**✅ Skills Core:**
- tdd-workflow
- security-scan
- plan-canvas
- e2e-testing
- continuous-learning-v2
- django-patterns
- react-patterns
- deployment-patterns
- api-design
- deep-research

**✅ Sistema de Memoria:**
- Memoria persistente inicializada
- Índice MEMORY.md creado
- Registro de instalación ECC guardado

---

## 🎯 Pruebas Rápidas Sugeridas

### 1. Probar Workflow TDD

```
"Usa /skill tdd-workflow para crear una función que valide emails"
```

**Resultado esperado:** El sistema activará el workflow TDD y:
1. Escribirá tests primero (RED)
2. Implementará el código (GREEN)
3. Refactorizará si es necesario (REFACTOR)
4. Verificará cobertura >80%

---

### 2. Probar Planificación con Plan Canvas

```
"Usa /skill plan-canvas para planificar un sistema de autenticación JWT"
```

**Resultado esperado:** Creará un plan visual interactivo que puedes revisar y aprobar antes de implementar.

---

### 3. Probar Security Scan

```
"Usa /skill security-scan para revisar el código en apps/api/src/auth/"
```

**Resultado esperado:** Análisis de seguridad OWASP Top 10, detección de vulnerabilidades, secrets hardcodeados, etc.

---

### 4. Probar Code Review Automático

```
"Usa el agente code-reviewer para revisar los cambios recientes en el código"
```

**Resultado esperado:** Revisión detallada de calidad, mantenibilidad, y posibles mejoras.

---

### 5. Probar Deep Research

```
"Usa /skill deep-research para investigar mejores prácticas de arquitectura hexagonal en TypeScript"
```

**Resultado esperado:** Investigación profunda con fuentes, comparaciones y recomendaciones.

---

### 6. Probar Memoria Persistente

```
"Recuerda que prefiero usar async/await en lugar de Promises directas en TypeScript"
```

**Resultado esperado:** La preferencia se guarda en memoria y se aplicará en futuras sesiones.

Luego prueba:
```
"¿Qué preferencias de código tengo guardadas?"
```

**Resultado esperado:** El sistema consultará la memoria y te mostrará tus preferencias.

---

## 📊 Comandos de Diagnóstico

### Ver todas las skills disponibles:
```powershell
Get-ChildItem -Path '.claude\skills' -Directory | Select-Object Name | Sort-Object Name
```

### Ver todos los agentes disponibles:
```powershell
Get-ChildItem -Path '.claude\agents' -File | Select-Object Name | Sort-Object Name
```

### Ver contenido de memoria:
```powershell
Get-ChildItem -Path 'C:\Users\Admin\.claude\projects\C--Users-Admin-Desktop-CRELEALTAD-CORE\memory\' -File
```

### Buscar skills por tema:
```powershell
Get-ChildItem -Path '.claude\skills' -Directory | Where-Object { $_.Name -like '*react*' }
```

---

## 🎓 Escenarios de Uso Real

### Escenario 1: Desarrollar Nueva Feature con TDD

**Comando:**
```
"Voy a implementar un sistema de notificaciones push. 
Usa /skill plan-canvas para crear el plan, 
luego /skill tdd-workflow para implementarlo,
y finalmente /skill security-scan para verificar seguridad."
```

**Flujo esperado:**
1. Plan Canvas crea blueprint visual
2. Usuario revisa y aprueba
3. TDD Workflow implementa con tests
4. Security Scan valida seguridad
5. Code Reviewer da OK final

---

### Escenario 2: Corregir Bug Crítico

**Comando:**
```
"Hay un bug en la validación de tokens JWT. 
Usa /skill tdd-workflow para crear un test que reproduzca el bug,
luego implementa el fix."
```

**Flujo esperado:**
1. Test que reproduce el bug (RED)
2. Implementación del fix (GREEN)
3. Refactorización si necesario
4. Code review automático

---

### Escenario 3: Preparar para Producción

**Comando:**
```
"Vamos a producción mañana.
Usa /skill security-scan para auditoría,
/skill e2e-testing para verificar flujos críticos,
y revisa la cobertura de tests."
```

**Flujo esperado:**
1. Security scan OWASP Top 10
2. E2E tests de flujos críticos
3. Verificación de cobertura >80%
4. Reporte de preparación para producción

---

## 🔍 Explorando el Sistema

### Ver detalles de una skill específica:
```powershell
Get-Content '.claude\skills\tdd-workflow\SKILL.md' | Select-Object -First 50
```

### Ver detalles de un agente específico:
```powershell
Get-Content '.claude\agents\planner.md' | Select-Object -First 50
```

### Buscar skills relacionadas con testing:
```powershell
Get-ChildItem -Path '.claude\skills' -Directory | 
Where-Object { $_.Name -like '*test*' -or $_.Name -like '*tdd*' } | 
Select-Object Name
```

---

## 💡 Tips para Máximo Aprovechamiento

1. **Confía en el sistema:** Los agentes y skills se activan automáticamente según contexto
2. **Usa nombres claros:** "Usa /skill tdd-workflow" es mejor que explicar todo el proceso
3. **Combina skills:** Puedes encadenar varios skills para workflows complejos
4. **Memoria es tu aliada:** Comparte preferencias una vez, se aplican siempre
5. **Revisa la documentación:** Cada skill tiene su propio SKILL.md con detalles

---

## 🚨 Troubleshooting

### Si una skill no se encuentra:
```powershell
# Verificar que existe
Test-Path '.claude\skills\nombre-skill'

# Listar todas las skills
Get-ChildItem -Path '.claude\skills' -Directory | Select-Object Name
```

### Si memoria no persiste:
```powershell
# Verificar directorio de memoria
Test-Path 'C:\Users\Admin\.claude\projects\C--Users-Admin-Desktop-CRELEALTAD-CORE\memory\MEMORY.md'

# Ver contenido
Get-Content 'C:\Users\Admin\.claude\projects\C--Users-Admin-Desktop-CRELEALTAD-CORE\memory\MEMORY.md'
```

### Si hooks no funcionan:
```powershell
# Ver configuración de hooks
Get-Content '.claude\hooks\hooks.json' | ConvertFrom-Json | Select-Object -First 20
```

---

## 📚 Próximos Pasos

1. ✅ **Instalación completa** - HECHO
2. 🧪 **Prueba práctica** - Usa los ejemplos de arriba
3. 🎯 **Integra en tu workflow** - Empieza a usar skills en tu día a día
4. 📖 **Explora más skills** - Hay 292 disponibles, descubre las que te sirvan
5. 🧠 **Entrena la memoria** - Comparte preferencias y contexto del proyecto

---

**Estado:** ✅ Sistema completamente instalado y verificado  
**Listo para usar:** SÍ  
**Documentación:** `GUIA_ECC_INSTALACION.md` en el directorio raíz
