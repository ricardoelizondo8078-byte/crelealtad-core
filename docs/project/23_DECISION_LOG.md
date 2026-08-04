# 13 Decision Log - Registro de Decisiones

Version: 1.1.0
Estado: Vigente
Fecha de actualizacion: 2026-07-10

## Formato de registro

- ID
- Fecha
- Decision
- Motivo
- Impacto
- Modulos afectados
- Autor
- Estado

## Historial consolidado

- DEC-001 | 2026-07-09 | Constitucion como autoridad maxima | Evitar divergencia documental | Alto | Todos | Arquitectura | Aprobada.
- DEC-002 | 2026-07-09 | Monorepo con apps/api y apps/mobile | Escalabilidad y separacion por capa | Alto | Backend, Mobile | Arquitectura | Aprobada.
- DEC-003 | 2026-07-09 | Stack mobile React Native + Expo + TS | Productividad y despliegue movil | Alto | Mobile | Arquitectura | Aprobada.
- DEC-004 | 2026-07-09 | Stack backend NestJS + TS | Modularidad y mantenibilidad | Alto | API | Arquitectura | Aprobada.
- DEC-005 | 2026-07-09 | PostgreSQL como sistema de registro | Consistencia relacional | Alto | Database | Arquitectura | Aprobada.
- DEC-006 | 2026-07-09 | Guardado automatico como principio UX | Operacion de campo | Alto | Mobile, API | Negocio + UX | Aprobada.
- DEC-007 | 2026-07-09 | Estados calculados por sistema | Reducir errores manuales | Alto | Todos | Negocio | Aprobada.
- DEC-008 | 2026-07-09 | No eliminacion de historial documental | Trazabilidad y auditoria | Alto | Database, API | Control Interno | Aprobada.
- DEC-009 | 2026-07-09 | Renovacion con umbral configurable | Flexibilidad operativa | Alto | Parametros, Credito | Negocio | Aprobada.
- DEC-010 | 2026-07-09 | Documentacion obsoleta a Archive, no borrado | Conservacion historica | Medio | Docs | Arquitectura | Aprobada.
- DEC-011 | 2026-07-09 | Crear carpeta project con 20 documentos oficiales | Gobierno documental empresarial | Alto | Docs | Arquitectura | Aprobada.
- DEC-012 | 2026-07-09 | Mantener discrepancias temporales documentadas entre schema y prototipo | No ocultar deuda tecnica | Alto | API, Database | Arquitectura | Aprobada.
- DEC-013 | 2026-07-10 | Ejecutar auditoria integral de repo y actualizar el paquete documental oficial | Alinear documentacion con el estado real del repositorio | Alto | Docs, Todos | Arquitectura | Aprobada.
- DEC-014 | 2026-07-10 | Reubicar borradores reemplazados e inventarios raiz a docs/archive sin borrado | Reducir ambiguedad y preservar historial | Medio | Docs | Arquitectura | Aprobada.
- DEC-015 | 2026-07-10 | Tratar docs/project como paquete oficial de trabajo y docs/archive como reserva historica de borradores y snapshots | Claridad de autoridad documental | Alto | Docs | Arquitectura | Aprobada.

## Contradicciones documentadas

- C-001: Estados simplificados en prototipo versus catalogo constitucional.
Tratamiento vigente: el catalogo constitucional prevalece; la implementacion actual se documenta como parcial.

- C-002: Tipos documentales hardcoded versus politicas parametrizadas.
Tratamiento vigente: la parametrizacion prevalece; el hardcode actual se conserva solo como semilla temporal.

- C-003: Solicitud en API y mobile sin tabla dedicada en schema.
Tratamiento vigente: la entidad oficial se mantiene y la brecha de persistencia queda abierta.

- C-004: Estados tecnicos de SQL como draft, active y pending versus estados funcionales de negocio.
Tratamiento vigente: los defaults SQL no sustituyen la semantica funcional del sistema.

## Nota de gobierno

- No se aprobaron reglas de negocio nuevas durante la auditoria 2026-07-10.
- Toda contradiccion funcional futura debe documentarse y escalarse sin resolverse unilateralmente.

## Referencias cruzadas

- project/03_PROJECT_STATUS.md
- project/24_CHANGELOG.md
- project/90_ARCHITECT_REVIEW.md
- project/91_PROJECT_AUDIT_REPORT.md
