# Auditoría de calidad y arquitectura — 2026-08-29

Estado: correcciones técnicas implementadas y verificadas
Alcance: `apps/api`, `apps/mobile`, configuración TypeScript, pruebas y documentación técnica
Fuera de alcance: nuevas reglas de negocio, cambios de esquema, matriz funcional definitiva y arquitectura offline aún no aprobada

## Resultado ejecutivo

El código activo ya está organizado por módulos de dominio y dispone de una base NestJS/TypeORM y React Native reutilizable. La auditoría encontró problemas reales de integridad transaccional, duplicación, dependencias cíclicas, contratos legacy, logging sensible y éxitos simulados en Verificación. Esos problemas se corrigieron sin modificar PostgreSQL.

La arquitectura resultante se aproxima mejor a SOLID:

- Responsabilidad única: persistencia documental detrás de `DocumentosStoragePort`; mapper móvil separado de la pantalla; configuración JWT única.
- Abierto/cerrado e inversión de dependencias: Solicitudes consume el puerto documental y puede cambiar de implementación sin alterar controlador/servicio.
- Sustitución y segregación: el contrato público de Solicitud ya no admite identificadores que debe derivar el servidor.
- Dependencias: Integrantes depende de Solicitudes; Solicitudes resuelve contexto con repositorio y no vuelve a depender de Integrantes.
- DRY: un solo upsert tipado atiende las siete tablas hijas y un solo mapper genera guardado manual/automático móvil.

## Correcciones realizadas

1. Grupo y expediente se crean atómicamente.
2. Persona e integrante se crean atómicamente.
3. Los guardados móviles se serializan y no navegan si fallan.
4. El handoff a Verificación es idempotente, bloqueado por estado/completitud y auditable.
5. Los dictámenes de integrante no pueden ejecutarse mediante el endpoint manual vigente.
6. Verificación no simula éxito ni calcula políticas financieras no aprobadas.
7. Se retiraron rutas, entidades, servicios, pantallas, respaldos y pruebas deshabilitadas sin uso activo.
8. Request logging y errores de validación dejaron de incluir payloads, cabeceras y valores personales.
9. `JWT_SECRET` es obligatorio en producción.
10. TypeScript activa puertas contra `any` implícito, símbolos sin uso, retornos incompletos y fallthrough.

## Verificación objetiva

- `npm run typecheck`: aprobado en API y mobile.
- `npm run build` en API: aprobado.
- Jest: 14 suites y 61 pruebas aprobadas.
- Suites deshabilitadas: 0.
- Handlers HTTP clasificados por acceso: 29 de 29.
- Cambios de esquema o migraciones aplicadas: 0.

## Deuda que no debe ocultarse

### Alta

- `SolicitudFormScreen.tsx` e `IntegranteVerificacionScreen.tsx` siguen siendo pantallas extensas. La persistencia ya fue extraída, pero los pasos visuales deben dividirse gradualmente con pruebas de comportamiento para evitar un refactor riesgoso de una sola vez.
- Verificación no tiene todavía contrato persistente para checklist, observaciones, asignación, dictamen, devolución o avance. Su finalización debe permanecer bloqueada.
- No existe arquitectura offline-first completa: faltan cola durable, idempotencia entre reinicios, reintentos, conflictos y pruebas de reconexión.

### Media

- Mobile no tiene suites automatizadas; TypeScript no sustituye pruebas de interacción.
- API conserva `strictNullChecks` y `strictPropertyInitialization` desactivados por el modelado histórico de entidades TypeORM. Deben activarse por módulos, corrigiendo nulabilidad real en vez de añadir aserciones indiscriminadas.
- Algunos servicios devuelven view models estructurales sin DTO de respuesta dedicado; conviene tiparlos al ampliar esos endpoints.

## Conclusión

La base es modular y escalable para continuar, pero no puede declararse “terminada” ni completamente SOLID mientras persistan los hotspots móviles, el contrato funcional abierto de Verificación y la brecha offline. Las correcciones realizadas eliminan los riesgos inmediatos sin inventar reglas de CRELEALTAD.
