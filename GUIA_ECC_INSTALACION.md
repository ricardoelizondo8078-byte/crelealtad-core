# Guía Completa - ECC (Enhanced Claude Code) Instalado

**Fecha de instalación:** 2026-08-03  
**Estado:** ✅ Instalación completa y verificada

---

## 📦 Componentes Instalados

### ✅ 67 Agentes Especializados (`.claude/agents/`)
Agentes son subprocesos especializados para delegar trabajo con permisos limitados.

### ✅ 292 Skills (`.claude/skills/`)
Workflows reutilizables que puedes invocar con el comando `/skill <nombre>`.

### ✅ 122 Reglas de Código (`.claude/rules/`)
Estándares de código que se cargan automáticamente por lenguaje.

### ✅ 4 Hooks (`.claude/hooks/`)
Automatizaciones basadas en eventos (PreToolUse, PostToolUse, SessionStart).

### ✅ Memoria Persistente
Sistema de memoria en `C:\Users\Admin\.claude\projects\C--Users-Admin-Desktop-CRELEALTAD-CORE\memory\`

---

## 🚀 Cómo Usar Cada Componente

### 1️⃣ AGENTES ESPECIALIZADOS

Los agentes son expertos en tareas específicas. El sistema selecciona automáticamente el agente correcto según el contexto.

#### **Agentes Principales:**

| Agente | Descripción | Cuándo se usa |
|--------|-------------|---------------|
| `planner` | Planificación de arquitectura | Cuando pides planificar features complejas |
| `code-reviewer` | Revisión de código con contexto fresco | Después de cambios importantes en código |
| `security-reviewer` | Auditoría de seguridad OWASP Top 10 | Para código con autenticación, APIs, datos sensibles |
| `typescript-reviewer` | Revisor especializado en TypeScript | Cambios en archivos .ts/.tsx |
| `python-reviewer` | Revisor especializado en Python | Cambios en archivos .py |
| `go-reviewer` | Revisor especializado en Go | Cambios en archivos .go |
| `database-reviewer` | Revisor de esquemas de BD | Migraciones y cambios de esquema |
| `e2e-runner` | Ejecutor de pruebas E2E | Verificación de flujos de usuario |
| `build-error-resolver` | Resolvedor de errores de build | Fallos de compilación |

**💡 Uso automático:** No necesitas invocar agentes manualmente, se activan según el contexto de tu solicitud.

---

### 2️⃣ SKILLS (Workflows Reutilizables)

Skills son workflows completos que puedes activar con comandos slash.

#### **Skills Más Importantes:**

**🔧 Desarrollo y Arquitectura:**
- `/skill tdd-workflow` - Desarrollo guiado por pruebas (RED→GREEN→REFACTOR)
- `/skill plan-canvas` - Planificación visual interactiva de features
- `/skill api-design` - Diseño de APIs RESTful siguiendo mejores prácticas
- `/skill database-migrations` - Gestión segura de migraciones de BD

**🔒 Seguridad:**
- `/skill security-scan` - Auditoría completa OWASP Top 10
- `/skill django-security` - Revisión de seguridad específica para Django
- `/skill laravel-security` - Revisión de seguridad específica para Laravel

**✅ Testing y Calidad:**
- `/skill e2e-testing` - Configuración y ejecución de pruebas end-to-end
- `/skill verification-loop` - Ciclo de verificación continua
- `/skill code-tour` - Documentación interactiva del codebase

**📊 Frameworks Específicos:**
- `/skill django-patterns` - Mejores prácticas para Django
- `/skill springboot-patterns` - Mejores prácticas para Spring Boot
- `/skill laravel-patterns` - Mejores prácticas para Laravel
- `/skill react-patterns` - Mejores prácticas para React
- `/skill nextjs-turbopack` - Optimización con Next.js y Turbopack

**🧠 Aprendizaje y Memoria:**
- `/skill continuous-learning-v2` - Sistema de aprendizaje continuo que extrae patrones
- `/skill unified-memory` - Memoria compartida entre sesiones

**📈 Investigación y Análisis:**
- `/skill deep-research` - Investigación profunda de temas
- `/skill benchmark` - Medición de rendimiento y comparación de alternativas
- `/skill market-research` - Análisis de mercado

**🎨 Frontend y UI:**
- `/skill frontend-patterns` - Mejores prácticas de frontend
- `/skill react-performance` - Optimización de rendimiento en React
- `/skill accessibility` - Auditoría y diseño accesible (WCAG 2.2 AA)

**🏗️ DevOps y Deployment:**
- `/skill deployment-patterns` - Patrones de despliegue
- `/skill docker-patterns` - Mejores prácticas con Docker
- `/skill kubernetes-patterns` - Patrones de Kubernetes

---

### 3️⃣ REGLAS DE CÓDIGO

Reglas se cargan automáticamente según el lenguaje que uses:

- **TypeScript/JavaScript:** Estándares de código, ESLint, Prettier
- **Python:** PEP 8, type hints, docstrings
- **Go:** Conventions, error handling, concurrency patterns
- **Java/Kotlin:** Spring Boot, JPA, testing patterns
- **PHP:** PSR standards, Laravel conventions
- **C++:** Modern C++ standards, RAII, templates

**💡 No necesitas hacer nada:** Las reglas se aplican automáticamente cuando trabajas con código.

---

### 4️⃣ HOOKS (Automatizaciones)

Hooks ejecutan acciones automáticas en eventos específicos:

1. **SessionStart:** Inicialización de contexto al empezar sesión
2. **PreToolUse:** Validación antes de usar herramientas
3. **PostToolUse:** Acciones después de usar herramientas
4. **Stop:** Limpieza al finalizar sesión

**💡 Control de hooks:**
```bash
# Deshabilitar hooks específicos
export ECC_DISABLED_HOOKS="hook1,hook2"

# Cambiar nivel de severidad
export ECC_HOOK_PROFILE="minimal"  # minimal, standard, strict
```

---

### 5️⃣ MEMORIA PERSISTENTE

El sistema de memoria guarda contexto entre sesiones en archivos Markdown.

**📂 Ubicación:** `C:\Users\Admin\.claude\projects\C--Users-Admin-Desktop-CRELEALTAD-CORE\memory\`

**Tipos de memoria:**
- `user` - Información sobre tu rol, preferencias, expertise
- `feedback` - Correcciones y preferencias de workflow
- `project` - Contexto de iniciativas, bugs, decisiones
- `reference` - Enlaces a sistemas externos (Linear, Jira, etc.)

**💡 Uso:**
- Di "recuerda que..." y el sistema guardará información relevante
- Di "olvida..." para eliminar información
- La memoria se consulta automáticamente cuando es relevante

---

## 🎯 Flujos de Trabajo Recomendados

### **Desarrollo de Nueva Feature:**
```
1. /skill plan-canvas "descripción de la feature"
2. Revisar y aprobar el plan visual
3. /skill tdd-workflow
4. Implementación automática con RED→GREEN→REFACTOR
5. /code-review (usa agente code-reviewer automáticamente)
6. /skill security-scan (si maneja datos sensibles)
```

### **Corrección de Bug:**
```
1. /skill tdd-workflow
2. Escribir test que reproduzca el bug (RED)
3. Implementar fix (GREEN)
4. Refactorizar si es necesario (REFACTOR)
5. /code-review
```

### **Preparación para Producción:**
```
1. /skill security-scan
2. /skill e2e-testing
3. Verificar cobertura de tests (>80%)
4. /skill deployment-patterns
5. Review final con code-reviewer
```

### **Investigación Profunda:**
```
1. /skill deep-research "tema a investigar"
2. /skill benchmark (si comparas alternativas)
3. /skill market-research (si es análisis de mercado)
```

---

## 📊 Verificación de Instalación

```powershell
# Agentes
Get-ChildItem -Path '.claude\agents' -File -Recurse | Measure-Object
# Resultado: 67 agentes

# Skills
Get-ChildItem -Path '.claude\skills' -Directory | Measure-Object
# Resultado: 292 skills

# Reglas
Get-ChildItem -Path '.claude\rules' -File -Recurse | Measure-Object
# Resultado: 122 reglas

# Memoria
Test-Path 'C:\Users\Admin\.claude\projects\C--Users-Admin-Desktop-CRELEALTAD-CORE\memory\MEMORY.md'
# Resultado: True
```

---

## 🔑 Comandos Clave

| Comando | Descripción |
|---------|-------------|
| `/skill <nombre>` | Invocar una skill específica |
| `/code-review` | Revisar código actual |
| `/plan <descripción>` | Crear plan de implementación |
| `/help` | Ver ayuda de Claude Code |
| `/config` | Configurar preferencias |

---

## 💡 Tips de Uso

1. **Deja que el sistema trabaje:** Los agentes y skills se activan automáticamente según contexto
2. **Usa skills para tareas complejas:** En lugar de explicar todo, usa `/skill tdd-workflow` o `/skill plan-canvas`
3. **Confía en la memoria:** El sistema recuerda tus preferencias y contexto del proyecto
4. **Combina skills:** Puedes usar varios skills en secuencia para workflows complejos
5. **Revisa siempre:** Usa `/code-review` antes de commits importantes

---

## 🎓 Filosofía ECC

ECC convierte patrones repetitivos de ingeniería en infraestructura instalada:

- **Plan → Test → Implement → Review → Verify → Remember → Improve**

En lugar de reinventar workflows en cada tarea, ECC proporciona componentes reutilizables que fuerzan metodología:
- Test-first development
- Revisión con contexto fresco
- Documentación de decisiones
- Seguridad desde el diseño

---

## 📚 Recursos Adicionales

- **Repositorio ECC:** https://github.com/affaan-m/ecc
- **Documentación completa:** `C:\Users\Admin\ecc\docs\`
- **Memoria del proyecto:** `C:\Users\Admin\.claude\projects\C--Users-Admin-Desktop-CRELEALTAD-CORE\memory\`

---

## ✅ Estado de la Instalación

- ✅ Repositorio clonado
- ✅ 67 agentes instalados
- ✅ 292 skills instaladas
- ✅ 122 reglas de código instaladas
- ✅ 4 hooks configurados
- ✅ Memoria persistente inicializada
- ✅ Verificación completa exitosa

**🎉 ECC está completamente instalado y listo para usar.**

---

**Próximos pasos sugeridos:**

1. Prueba el workflow TDD: `/skill tdd-workflow`
2. Crea un plan para tu próxima feature: `/skill plan-canvas "mi feature"`
3. Ejecuta un security scan: `/skill security-scan`
4. Explora skills disponibles revisando `.claude/skills/`
