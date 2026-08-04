# 09 Development Standards - Estandares de Desarrollo

Version: 1.0.0
Estado: Vigente

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
3. Salud de API validada.
4. Monitoreo inicial activo.

## Checklist de Documentacion

1. Referencias cruzadas validas.
2. Sin placeholders.
3. Sin contradicciones no resueltas.
4. Version y fecha actualizadas.

## Referencias cruzadas

- project/12_SECURITY_MODEL.md
- project/18_CODEX_WORKFLOW.md
- project/24_CHANGELOG.md
