# 13 Development Standards — Estándares de Desarrollo

Versión: 1.4.0
Estado: Vigente
Fecha de verificación: 2026-10-04

## Principios

- Cambios pequenos, trazables y reversibles.
- No romper compatibilidad de flujo operativo.
- No introducir reglas de negocio no documentadas.
- No eliminar historial funcional o documental.

## Convenciones de codigo

- TypeScript obligatorio en mobile y backend.
- Nombres de archivos por modulo y contexto.
- DTOs tipados; evitar estructuras any.
- Servicios orientados a casos de uso.

## Convenciones backend

- Controlador para contrato HTTP.
- Servicio para logica.
- Modulo por dominio.
- Validacion de entrada obligatoria en endpoints nuevos.
- Manejo de errores consistente.

## Convenciones mobile

- Componentes reutilizables en components/ui.
- Features por dominio.
- Tokens de diseno centralizados en theme.
- Mensajes operativos claros.
- Toda lógica pura nueva o modificada debe cubrir al menos caso nominal, bloqueo y validación
  aplicables con Jest; la interacción visible reutilizable se prueba con React Native Testing Library.
- ESLint usa la configuración oficial de Expo. Una advertencia heredada puede permanecer sólo si
  queda visible y su corrección exige un refactor funcional fuera del alcance; los errores o el
  crecimiento sobre la línea base de 42 advertencias bloquean.

## Convenciones de datos

- Estados canonicos en espanol de negocio.
- Claves tecnicas en formato consistente.
- Auditoria en cambios sensibles.

## Checklist de Arquitecto (obligatorio)

1. Validar alineacion con constitucion.
2. Verificar impacto en estado y reglas.
3. Verificar impacto en datos y auditoria.
4. Verificar no duplicacion documental.
5. Registrar decision relevante en decision log.

## Checklist de Developer (obligatorio)

1. Leer reglas y modulo afectado.
2. Implementar cambio minimo.
3. Ejecutar pruebas del modulo.
4. Actualizar documentacion afectada.
5. Registrar riesgos y supuestos.
6. Ejecutar `npm run verify` desde la raíz; incluye escaneo de secretos, lint mobile, TypeScript y
   pruebas API/mobile.

## Checklist de Testing (obligatorio)

1. Caso nominal.
2. Caso de bloqueo.
3. Caso de error de validacion.
4. Caso de transicion invalida.
5. Caso de trazabilidad.

## Checklist de Release

1. Estado de modulos actualizado.
2. Riesgos abiertos documentados.
3. Changelog actualizado.
4. Decision log actualizado.
5. Rollback plan definido.

## Checklist de Deployment

1. Variables de entorno verificadas.
2. Migraciones evaluadas.
3. `db:migrations:status` sin pendientes, drift ni entradas desconocidas.
4. Cambio de esquema probado en `crelealtad_test`, respaldo verificado y plan de reversión documentado.
5. Aplicación canónica mediante `db:migrations:apply`, `--database`, `--through` y `MIGRATION_APPLY_CONFIRM` igual al nombre exacto de la base.
6. Salud de API validada.
7. Monitoreo inicial activo.

La reconstrucción de `crelealtad_test` es destructiva y requiere
`TEST_DB_RESET_CONFIRM=crelealtad_test`; el proceso debe terminar con el catálogo completo
registrado como `BASELINE` en `schema_migrations`.

## Checklist de Documentación

1. Referencias cruzadas validas.
2. Sin placeholders.
3. Sin contradicciones no resueltas.
4. Versión y fecha actualizadas.
5. Estados funcionales y técnicos se distinguen; una correspondencia abierta nunca se presenta
   como migración autorizada.
6. Los flujos objetivo se etiquetan como pendientes cuando no existe caso de uso ejecutable.

## Referencias cruzadas

- project/12_SECURITY_MODEL.md
- project/18_CODEX_WORKFLOW.md
- project/24_CHANGELOG.md
