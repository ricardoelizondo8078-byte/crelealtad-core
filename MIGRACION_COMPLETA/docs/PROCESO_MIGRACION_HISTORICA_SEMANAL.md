# Proceso repetible de migración histórica semanal

Este procedimiento permite usar cualquier corte futuro de `BASE DE DATOS 76.xlsm`. No depende del número de semana ni requiere modificar rutas dentro del código.

## 1. Validar el Excel

Desde `MIGRACION_COMPLETA`:

```powershell
npm run historico:validar -- --excel "RUTA\AL\CORTE\BASE DE DATOS 76.xlsm"
```

El comando escribe un directorio en `runtime-data/migracion-historica/<12-primeros-del-hash>/` con:

- `manifest.json`: identidad, hash, contrato y conteos.
- `ciclos.json`: una fila por `# GPO + CICLO`.
- `semanas.json`: comportamiento semanal agregado.
- `incidencias.json`: errores y advertencias.

No continuar si `estado` no es `VALIDADO` o si hay incidencias `ERROR`.

## 2. Respaldar y preparar la base destino

Crear y verificar un respaldo completo antes de cambiar esquema o datos. Aplicar una sola vez:

```powershell
psql -U postgres -d NOMBRE_BASE -v ON_ERROR_STOP=1 -f database/migrations/006_historial_grupos_excel.sql
```

El rollback existe en `006_historial_grupos_excel.rollback.sql`, pero es destructivo y solo debe usarse con respaldo y autorización.

## 3. Prevalidar relaciones

```powershell
npm run historico:prevalidar-bd -- --artefactos "RUTA\A\ARTEFACTOS" --base NOMBRE_BASE
```

Si la base limpia todavía no contiene todos los grupos:

```powershell
npm run historico:prevalidar-bd -- --artefactos "RUTA\A\ARTEFACTOS" --base NOMBRE_BASE --crear-grupos
```

Una coincidencia ambigua de nombre siempre bloquea. `--crear-grupos` crea únicamente nombres inexistentes; nunca fusiona variantes.

## 4. Cargar sin activar

```powershell
npm run historico:cargar -- --artefactos "RUTA\A\ARTEFACTOS" --base NOMBRE_BASE --crear-grupos --aplicar
```

Verificar al menos:

- conteos iguales al manifiesto;
- cero ciclos sin `grupo_id`;
- cero semanas huérfanas;
- vigentes iguales al resumen lateral;
- lista de ciclos sin asesora limitada a incidencias aprobadas como `OFNA`.

## 5. Activar el corte verificado

Repetir el comando con `--activar`. La idempotencia reutiliza la importación existente y solo cambia la base activa:

```powershell
npm run historico:cargar -- --artefactos "RUTA\A\ARTEFACTOS" --base NOMBRE_BASE --crear-grupos --activar --aplicar
```

Solo puede existir un corte activo de `HISTORIAL_GRUPOS`.

## 6. Procedimiento para la salida final del app

1. Cerrar una copia inmutable del Excel de la semana acordada.
2. Ejecutar validación y resolver incidencias con Operación.
3. Crear una base nueva de ensayo con el esquema definitivo y catálogos/empleados aprobados.
4. Ejecutar la carga completa sin activar y validar conteos.
5. Probar `Mis grupos`, renovación, historial y alcance por asesora.
6. Repetir el ensayo desde cero para demostrar reproducibilidad.
7. Respaldar la base de destino definitiva.
8. Ejecutar el mismo archivo/hash, validar y activar.
9. Conservar Excel, hash, manifiesto, respaldo y reporte de verificación.

La estrategia recomendada es salir desde una base limpia y migrada. No borrar manualmente datos ficticios mezclados con el histórico.
