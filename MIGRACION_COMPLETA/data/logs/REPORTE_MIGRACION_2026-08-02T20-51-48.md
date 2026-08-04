# REPORTE DE MIGRACIÓN - CRELEALTAD

**Fecha**: 2026-08-02
**Hora**: 14:51:48

---

## 📊 RESUMEN EJECUTIVO

✅ **MIGRACIÓN EXITOSA**

- Errores críticos: 0
- Advertencias: 3
- Errores de limpieza: 674

---

## 📈 DATOS MIGRADOS

| Tabla | Cantidad |
|-------|----------|
| personas | 3235 |
| grupos | 493 |
| expedientes | 493 |
| integrantes | 3426 |
| creditos | 0 |
| tesoreras | 297 |

---

## 🎯 COMPARACIÓN CON VALORES ESPERADOS

| Tabla | Esperado | Obtenido | Diferencia | % |
|-------|----------|----------|------------|---|
| personas | 8300 | 3235 | -5065 | -61.02% ⚠️ |
| grupos | 500 | 493 | -7 | -1.40% ✅ |
| expedientes | 500 | 493 | -7 | -1.40% ✅ |
| integrantes | 8407 | 3426 | -4981 | -59.25% ⚠️ |
| tesoreras | 6695 | 297 | -6398 | -95.56% ⚠️ |

---

## 🔗 INTEGRIDAD REFERENCIAL

✅ Todos los integrantes tienen persona
✅ Todos los integrantes tienen expediente
✅ Todos los expedientes tienen grupo

---

## ⚠️ ADVERTENCIAS

- personas: 61.02% de diferencia con esperado
- integrantes: 59.25% de diferencia con esperado
- tesoreras: 95.56% de diferencia con esperado

---

## 📝 ERRORES DE LIMPIEZA

| Tipo de Error | Cantidad |
|---------------|----------|
| CURP_INVALIDO | 674 |

Ver detalles en: `C:\Users\Admin\Desktop\CRELEALTAD CORE\MIGRACION_COMPLETA\data\logs/errores_limpieza.json`

---

## 📁 ARCHIVOS GENERADOS

### Datos staging:
- C:\Users\Admin\Desktop\CRELEALTAD CORE\MIGRACION_COMPLETA\data\staging/integrantes_raw.json
- C:\Users\Admin\Desktop\CRELEALTAD CORE\MIGRACION_COMPLETA\data\staging/personas_clean.json
- C:\Users\Admin\Desktop\CRELEALTAD CORE\MIGRACION_COMPLETA\data\staging/grupos_clean.json

### Mapeos:
- C:\Users\Admin\Desktop\CRELEALTAD CORE\MIGRACION_COMPLETA\data\mapeo/grupos_legacy_to_uuid.json
- C:\Users\Admin\Desktop\CRELEALTAD CORE\MIGRACION_COMPLETA\data\mapeo/personas_curp_to_uuid.json
- C:\Users\Admin\Desktop\CRELEALTAD CORE\MIGRACION_COMPLETA\data\mapeo/expedientes_grupo_to_uuid.json

### Logs:
- C:\Users\Admin\Desktop\CRELEALTAD CORE\MIGRACION_COMPLETA\data\logs/errores_limpieza.json
- C:\Users\Admin\Desktop\CRELEALTAD CORE\MIGRACION_COMPLETA\data\logs/validacion_final.json
- C:\Users\Admin\Desktop\CRELEALTAD CORE\MIGRACION_COMPLETA\data\logs/REPORTE_MIGRACION_2026-08-02T20-51-48.md

---

## 🚀 PRÓXIMOS PASOS

1. ✅ Revisar advertencias (si las hay)
2. ✅ Verificar datos en la aplicación
3. ✅ Limpiar archivos staging (opcional)
4. ✅ Migración COMPLETA

