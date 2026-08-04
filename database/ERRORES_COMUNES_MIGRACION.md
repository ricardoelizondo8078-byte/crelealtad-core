# ERRORES COMUNES Y SOLUCIONES - MIGRACIÓN

**Fecha**: 2026-08-02  
**Objetivo**: Documentar errores esperados y cómo resolverlos

---

## CATEGORÍAS DE ERRORES

1. ❌ **Críticos**: Bloquean la migración completamente
2. ⚠️ **Advertencias**: Pueden continuar pero requieren atención
3. ℹ️ **Informativos**: Solo para conocimiento

---

## FASE 1: EXTRACCIÓN DE EXCEL

### Error 1.1: Archivo Excel no encontrado

**Síntoma**:
```
Error: ENOENT: no such file or directory, open 'BASE DE DATOS SEM 364.xlsm'
```

**Causa**: Ruta incorrecta al archivo

**Solución**:
```javascript
// Verificar ruta completa
const fs = require('fs');
const filePath = 'C:\\Users\\Admin\\Desktop\\CRELEALTAD CORE\\BASE DE DATOS SEM 364.xlsm';

if (!fs.existsSync(filePath)) {
  console.error('Archivo no encontrado en:', filePath);
  // Listar archivos en directorio
  const files = fs.readdirSync('C:\\Users\\Admin\\Desktop\\CRELEALTAD CORE');
  console.log('Archivos disponibles:', files);
}
```

**Categoría**: ❌ Crítico

---

### Error 1.2: Hoja no existe en Excel

**Síntoma**:
```
Error: Sheet "Hoja1" not found
```

**Causa**: Nombre de hoja incorrecto

**Solución**:
```javascript
const XLSX = require('xlsx');
const workbook = XLSX.readFile(filePath);

// Listar hojas disponibles
console.log('Hojas disponibles:', workbook.SheetNames);

// Usar hoja correcta
const sheetName = workbook.SheetNames[0]; // Primera hoja
const worksheet = workbook.Sheets[sheetName];
```

**Categoría**: ❌ Crítico

---

### Error 1.3: Memoria insuficiente al leer Excel

**Síntoma**:
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Causa**: Archivo Excel muy grande, Node.js se queda sin memoria

**Solución**:
```bash
# Aumentar memoria de Node.js
node --max-old-space-size=4096 scripts/migration/01_extract_from_excel.js

# O en package.json
"scripts": {
  "migration:extract": "node --max-old-space-size=4096 scripts/migration/01_extract_from_excel.js"
}
```

**Alternativa**: Procesar por lotes
```javascript
// Leer en chunks de 1000 registros
for (let offset = 0; offset < totalRows; offset += 1000) {
  const batch = rows.slice(offset, offset + 1000);
  await processBatch(batch);
}
```

**Categoría**: ❌ Crítico

---

## FASE 2: LIMPIEZA Y TRANSFORMACIÓN

### Error 2.1: CURP inválido

**Síntoma**:
```json
{
  "error": "CURP inválido",
  "curp": "BELG60021",
  "motivo": "Longitud incorrecta (9 caracteres, esperados 18)"
}
```

**Causa**: CURP incompleto o mal formado

**Solución**:
```javascript
function validarCURP(curp) {
  // Validar longitud
  if (!curp || curp.length !== 18) {
    return {
      valido: false,
      error: `Longitud incorrecta (${curp?.length || 0} caracteres, esperados 18)`
    };
  }

  // Validar formato
  const regex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/;
  if (!regex.test(curp)) {
    return {
      valido: false,
      error: 'Formato inválido'
    };
  }

  return { valido: true };
}

// Acción: Loguear y SKIP registro
if (!validarCURP(curp).valido) {
  await logError('CURP_INVALIDO', { curp, fila: rowIndex });
  continue; // Saltar este registro
}
```

**Categoría**: ⚠️ Advertencia (se puede skip)

---

### Error 2.2: Fecha de nacimiento fuera de rango

**Síntoma**:
```json
{
  "error": "Fecha de nacimiento inválida",
  "fecha": "2060-02-18",
  "curp": "BELG600218MNLRPB00"
}
```

**Causa**: Error al interpretar año del CURP (60 → 2060 en lugar de 1960)

**Solución**:
```javascript
function extraerFechaDeCURP(curp) {
  const año = curp.substring(4, 6);
  const mes = curp.substring(6, 8);
  const dia = curp.substring(8, 10);

  // FIX: Determinar siglo correctamente
  // 00-30 → 2000+
  // 31-99 → 1900+
  const añoNum = parseInt(año);
  const añoCompleto = añoNum <= 30 ? `20${año}` : `19${año}`;

  const fecha = new Date(`${añoCompleto}-${mes}-${dia}`);

  // Validar que la fecha sea razonable
  const now = new Date();
  const hace150años = new Date(now.getFullYear() - 150, 0, 1);

  if (fecha > now || fecha < hace150años) {
    throw new Error(`Fecha fuera de rango: ${fecha.toISOString()}`);
  }

  return fecha;
}
```

**Categoría**: ⚠️ Advertencia

---

### Error 2.3: Teléfono con formato inválido

**Síntoma**:
```json
{
  "error": "Teléfono inválido",
  "telefono": "123",
  "motivo": "Longitud incorrecta (3 dígitos, esperados 10)"
}
```

**Causa**: Teléfono incompleto en Excel

**Solución**:
```javascript
function limpiarTelefono(telefono) {
  if (!telefono) return null;

  const soloDigitos = telefono.replace(/\D/g, '');

  // Si tiene menos de 10 dígitos, devolver null
  if (soloDigitos.length < 10) {
    return null; // Se guardará como NULL en BD
  }

  // Si tiene exactamente 10, OK
  if (soloDigitos.length === 10) {
    return soloDigitos;
  }

  // Si tiene más de 10, tomar últimos 10
  return soloDigitos.slice(-10);
}

// Acción: Guardar NULL y loguear advertencia
const telefonoLimpio = limpiarTelefono(telefonoRaw);
if (!telefonoLimpio) {
  await logWarning('TELEFONO_INVALIDO', { 
    telefono: telefonoRaw, 
    curp: persona.curp 
  });
}
```

**Categoría**: ℹ️ Informativo (se guarda NULL)

---

### Error 2.4: Nombre con formato extraño

**Síntoma**:
```
Nombre: "MARIA DE LA LUZ GARCIA Y HERNANDEZ DEL VALLE"
```

**Causa**: Nombres compuestos complejos

**Solución**:
```javascript
function parsearNombreComplejo(nombreCompleto) {
  const partes = nombreCompleto.trim().toUpperCase().split(/\s+/);

  // Detectar apellidos compuestos comunes
  const apellidosCompuestos = ['DEL', 'DE LA', 'DE LOS', 'DE LAS', 'Y'];

  let idx = 0;
  let primer_nombre = '';
  let segundo_nombre = '';
  let apellido_pat = '';
  let apellido_mat = '';

  // Tomar nombres (hasta encontrar apellido compuesto o llegar a últimas 2 palabras)
  while (idx < partes.length - 2) {
    if (apellidosCompuestos.includes(partes[idx])) {
      break;
    }
    if (!primer_nombre) {
      primer_nombre = partes[idx];
    } else {
      segundo_nombre += (segundo_nombre ? ' ' : '') + partes[idx];
    }
    idx++;
  }

  // Tomar apellidos (resto de palabras)
  const restantes = partes.slice(idx);
  
  if (restantes.length >= 2) {
    // Buscar "Y" que separa apellidos
    const idxY = restantes.indexOf('Y');
    if (idxY !== -1) {
      apellido_pat = restantes.slice(0, idxY).join(' ');
      apellido_mat = restantes.slice(idxY + 1).join(' ');
    } else {
      // Tomar mitad y mitad
      const mitad = Math.floor(restantes.length / 2);
      apellido_pat = restantes.slice(0, mitad).join(' ');
      apellido_mat = restantes.slice(mitad).join(' ');
    }
  } else {
    apellido_pat = restantes[0] || '';
    apellido_mat = restantes[1] || '';
  }

  return {
    primer_nombre: primer_nombre || null,
    segundo_nombre: segundo_nombre || null,
    apellido_pat: apellido_pat || null,
    apellido_mat: apellido_mat || null
  };
}
```

**Categoría**: ⚠️ Advertencia (requiere revisión manual)

---

## FASE 3: MIGRACIÓN A BASE DE DATOS

### Error 3.1: Violación de constraint UNIQUE

**Síntoma**:
```
Error: duplicate key value violates unique constraint "personas_curp_key"
Detail: Key (curp)=(BELG600218MNLRPB00) already exists.
```

**Causa**: Intentando insertar CURP que ya existe

**Solución**:
```javascript
// Opción 1: SKIP si ya existe
try {
  await personaRepository.insert(persona);
} catch (error) {
  if (error.code === '23505') { // PostgreSQL unique violation
    console.warn(`Persona con CURP ${persona.curp} ya existe, saltando...`);
    // Usar el ID existente
    const existente = await personaRepository.findOne({ where: { curp: persona.curp } });
    mapeo[persona.curp] = existente.id;
    continue;
  }
  throw error;
}

// Opción 2: UPDATE si ya existe (UPSERT)
await personaRepository.upsert(persona, ['curp']);
```

**Categoría**: ℹ️ Informativo

---

### Error 3.2: Foreign Key no existe

**Síntoma**:
```
Error: insert or update on table "integrantes" violates foreign key constraint "integrantes_persona_id_fkey"
Detail: Key (persona_id)=(550e8400-e29b-41d4-a716-446655440999) is not present in table "personas".
```

**Causa**: Intentando vincular con persona que no existe

**Solución**:
```javascript
// Verificar que persona existe ANTES de insertar integrante
const personaExiste = await personaRepository.findOne({ 
  where: { id: persona_id } 
});

if (!personaExiste) {
  await logError('PERSONA_NO_EXISTE', {
    persona_id,
    curp: integranteData.curp,
    fila: rowIndex
  });
  
  // Opción: Crear persona con datos mínimos
  const nuevaPersona = await crearPersonaMinima(integranteData.curp);
  persona_id = nuevaPersona.id;
}

await integranteRepository.insert({
  persona_id,
  expediente_id,
  // ...
});
```

**Categoría**: ❌ Crítico

---

### Error 3.3: Grupo no encontrado en mapeo

**Síntoma**:
```
Error: Grupo "GABINAS VIP" no encontrado en mapeo
```

**Causa**: Grupo mencionado en integrantes pero no fue migrado en fase de grupos

**Solución**:
```javascript
// Verificar mapeo ANTES de buscar
if (!mapeoGrupos[nombreGrupo]) {
  // Opción 1: Crear grupo on-the-fly
  console.warn(`Grupo "${nombreGrupo}" no existe, creándolo...`);
  
  const nuevoGrupo = await grupoRepository.save({
    nombre: nombreGrupo,
    folio: `AUTO-${Date.now()}`,
    estado: 'ACTIVO'
  });
  
  mapeoGrupos[nombreGrupo] = nuevoGrupo.id;
  
  await logWarning('GRUPO_CREADO_AUTO', { nombre: nombreGrupo });
}

const grupo_uuid = mapeoGrupos[nombreGrupo];
```

**Categoría**: ⚠️ Advertencia

---

### Error 3.4: Timeout de conexión

**Síntoma**:
```
Error: timeout of 30000ms exceeded
```

**Causa**: Inserción masiva muy lenta

**Solución**:
```javascript
// Aumentar timeout
await dataSource.query('SET statement_timeout = 300000'); // 5 minutos

// Procesar en lotes más pequeños
const BATCH_SIZE = 500; // Reducir de 1000 a 500

for (let i = 0; i < personas.length; i += BATCH_SIZE) {
  const batch = personas.slice(i, i + BATCH_SIZE);
  await personaRepository.insert(batch);
  console.log(`Procesados ${i + batch.length}/${personas.length}`);
}

// Desactivar triggers temporalmente (si es seguro)
await dataSource.query('ALTER TABLE personas DISABLE TRIGGER ALL');
// ... insertar datos ...
await dataSource.query('ALTER TABLE personas ENABLE TRIGGER ALL');
```

**Categoría**: ⚠️ Advertencia

---

## FASE 4: VALIDACIÓN

### Error 4.1: Conteos no coinciden

**Síntoma**:
```
Esperado: 8,407 integrantes
Obtenido: 8,352 integrantes
Diferencia: -55 registros
```

**Causa**: Algunos registros fallaron al insertarse

**Solución**:
```javascript
// Revisar log de errores
const errores = await dataSource
  .getRepository('staging.migration_errors')
  .find({ where: { fase: 'integrantes', resuelto: false } });

console.log(`Errores sin resolver: ${errores.length}`);

// Generar reporte de faltantes
const faltantes = errores.map(e => ({
  curp: e.datos_afectados?.curp,
  motivo: e.error_mensaje
}));

console.table(faltantes);

// Decidir acción
// - Si <2% de error: Aceptable, continuar
// - Si >2% de error: Revisar y reintentar
```

**Categoría**: ⚠️ Advertencia

---

### Error 4.2: Integridad referencial rota

**Síntoma**:
```sql
-- Query devuelve registros
SELECT i.id, i.persona_id
FROM integrantes i
LEFT JOIN personas p ON p.id = i.persona_id
WHERE p.id IS NULL;
```

**Causa**: Datos huérfanos (integrantes sin persona)

**Solución**:
```sql
-- Eliminar integrantes huérfanos
DELETE FROM integrantes
WHERE persona_id NOT IN (SELECT id FROM personas);

-- O crear personas faltantes
INSERT INTO personas (id, curp, primer_nombre, apellido_pat, estado)
SELECT DISTINCT
  i.persona_id,
  'DESCONOCIDO',
  'POR',
  'REVISAR',
  'INCOMPLETA'
FROM integrantes i
LEFT JOIN personas p ON p.id = i.persona_id
WHERE p.id IS NULL;
```

**Categoría**: ❌ Crítico

---

## ERRORES DE SISTEMA

### Error S.1: Permisos insuficientes

**Síntoma**:
```
Error: permission denied for schema staging
```

**Causa**: Usuario no tiene permisos en schema staging

**Solución**:
```sql
-- Como superusuario
GRANT ALL ON SCHEMA staging TO usuario_migracion;
GRANT ALL ON ALL TABLES IN SCHEMA staging TO usuario_migracion;
GRANT ALL ON ALL SEQUENCES IN SCHEMA staging TO usuario_migracion;
```

**Categoría**: ❌ Crítico

---

### Error S.2: Disco lleno

**Síntoma**:
```
Error: could not extend file "base/16384/12345": No space left on device
```

**Causa**: Disco de base de datos lleno

**Solución**:
```bash
# Verificar espacio
df -h

# Limpiar archivos temporales
VACUUM FULL;

# O aumentar almacenamiento (Supabase: upgrade plan)
```

**Categoría**: ❌ Crítico

---

## TABLA DE REFERENCIA RÁPIDA

| Código Error | Categoría | Acción |
|--------------|-----------|--------|
| `ENOENT` | ❌ Crítico | Verificar ruta de archivo |
| `23505` (UNIQUE) | ℹ️ Informativo | SKIP o UPSERT |
| `23503` (FK) | ❌ Crítico | Verificar datos relacionados |
| `CURP_INVALIDO` | ⚠️ Advertencia | Loguear y SKIP |
| `TELEFONO_INVALIDO` | ℹ️ Informativo | Guardar NULL |
| `timeout` | ⚠️ Advertencia | Reducir batch size |
| `permission denied` | ❌ Crítico | Otorgar permisos |

---

## LOG DE ERRORES TÍPICO

```json
{
  "fase": "personas",
  "total_procesados": 8407,
  "exitosos": 8352,
  "fallidos": 55,
  "errores": [
    {
      "tipo": "CURP_INVALIDO",
      "cantidad": 23,
      "ejemplo": "BELG60021"
    },
    {
      "tipo": "TELEFONO_INVALIDO",
      "cantidad": 297,
      "accion": "Guardado como NULL"
    },
    {
      "tipo": "DUPLICATE_KEY",
      "cantidad": 32,
      "accion": "Registro saltado, se usó existente"
    }
  ]
}
```

---

**Última actualización**: 2026-08-02  
**Versión**: 1.0  
