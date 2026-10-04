# CRELEALTAD CORE — Guía operativa para agentes

Versión: 1.0.0
Estado: Base operativa vigente
Fecha de verificación: 2026-08-13

## 1. Propósito

CRELEALTAD CORE es el sistema integral de una financiera mexicana especializada en créditos grupales. Debe cubrir el ciclo completo desde prospección y documentación hasta verificación, análisis, desembolso, cobranza, mora, convenios y reportes.

La operación real de CRELEALTAD manda. La tecnología debe representar y fortalecer esa operación, nunca modificarla por conveniencia técnica.

## 2. Autoridad y lectura obligatoria

Antes de cambiar código, datos, UX, reglas o configuración:

1. Leer `docs/project/00_START_HERE.md`.
2. Seguir el orden documental que ese archivo indique para la tarea.
3. Leer `docs/DECISIONES.md`; sus decisiones marcadas como CERRADA no pueden contradecirse sin aprobación explícita de Ricardo.
4. Inspeccionar el código real y, cuando aplique, el esquema PostgreSQL real.
5. Tratar conversaciones, documentos antiguos y archivos en `docs/archive/` como contexto, no como autoridad.

Jerarquía:

1. `docs/project/01_PROJECT_CONSTITUTION.md`.
2. Reglas de negocio y decisiones cerradas vigentes.
3. Flujo operativo, estados, seguridad y principios de datos.
4. Design System y estándares UX.
5. Código y esquema vigentes verificados.
6. Conversaciones y borradores.

Si dos fuentes se contradicen:

- No resolver silenciosamente una contradicción funcional.
- Registrar la brecha y pedir decisión cuando cambie operación, política, estado o permisos.
- Corregir contradicciones puramente técnicas solo dentro del alcance autorizado.

## 3. Arquitectura verificada

- Monorepo Node/TypeScript.
- Aplicación de campo: React Native + Expo en `apps/mobile`.
- API: NestJS + TypeORM en `apps/api`.
- Sistema de registro: PostgreSQL 17, base local `crelealtad`.
- Migraciones y artefactos de datos: `database/`, `apps/api/src/migrations/` y `migraciones/`.
- Componentes visuales compartidos: `apps/mobile/src/components/ui/`.
- Tokens visuales: `apps/mobile/src/theme/tokens.ts`.
- Autenticación actual: JWT global mediante `JwtAuthGuard`.
- Esquema TypeORM: `synchronize: false`; el esquema se cambia mediante migraciones revisadas.

La base verificada contiene 35 tablas públicas. Entre ellas existen `usuarios`, `roles`, `grupos`, `expedientes`, `integrantes`, las ocho tablas normalizadas de solicitudes, `creditos`, `ciclos`, `pagos`, `mora`, `reestructuras`, `caja_movimientos`, `audit_log` y las tres tablas de importación histórica desde Excel.

La documentación de estado fechada en julio de 2026 contiene inventarios ya superados. Verificar siempre contra código y PostgreSQL antes de afirmar que una capacidad no existe.

## 4. Estado funcional verificado

Existe implementación parcial de:

- Login y emisión de JWT.
- Documentación de grupos, expedientes e integrantes.
- Solicitud individual normalizada.
- Captura documental local parcial.
- Verificación de grupos e integrantes.
- Catálogo de códigos postales.

Brechas críticas actuales:

- El backend aplica autorización granular por módulo/acción, pero la matriz funcional completa y el alcance territorial siguen pendientes de aprobación e implementación.
- La pantalla inicial filtra funciones por permisos efectivos; faltan las pantallas administrativas para gestionarlos.
- `roles.permisos` existe como JSONB y ya es aplicado por un guard global; esto no sustituye la aprobación funcional de la matriz exacta.
- El corte histórico SEM 366 está cargado mediante D01 con 1,485 ciclos, 24,884 semanas y 299 vigentes; el historial individual de integrantes continúa pendiente.
- La captura de documentos usa almacenamiento local parcial; no existe una cola offline completa, sincronización confiable, reintentos idempotentes ni resolución de conflictos.
- Los 49 asesores validan su propio hash bcrypt, pero comparten temporalmente el valor de prueba `1234` y tienen cambio de PIN pendiente; ese valor y el secreto JWT por defecto deben eliminarse antes de producción.
- Hay documentación, archivos backup y variantes legacy que no deben tomarse como implementación principal sin rastrear imports y rutas activas.

## 5. Modelo modular y acceso

Módulos institucionales:

1. Login.
2. Documentación.
3. Verificación.
4. Análisis.
5. Desembolsos.
6. Cobranza.
7. Recolección.
8. Mora.
9. Convenios.
10. Reportes.
11. Parámetros.
12. Administración.

Principios obligatorios de acceso:

- Menor privilegio: cada usuario ve y ejecuta solo lo necesario para su función.
- La API es la autoridad de autorización; ocultar una opción en la app no sustituye la validación del backend.
- La app debe construir navegación, inicio y acciones según permisos efectivos devueltos por la API.
- Toda acción sensible requiere usuario, fecha, resultado y contexto auditable.
- Los permisos deben provenir de roles/configuración versionada, no de condicionales dispersos o nombres hardcodeados en pantallas.
- Los accesos administrativos, desembolsos, cambios de parámetros, excepciones y reversiones requieren controles reforzados.
- La matriz exacta de permisos es una decisión funcional: no inventarla ni ampliarla sin aprobación.

Roles presentes en PostgreSQL al 2026-08-13:

- ADMINISTRADOR.
- ASESOR.
- COBRADOR.
- COORDINADOR.
- DESEMBOLSADOR.
- GERENTE.
- RECOLECTOR.
- VERIFICADOR.

Los permisos almacenados actualmente son una base técnica, no evidencia suficiente de que la autorización ya esté aplicada de extremo a extremo.

## 6. UX para operación en campo

La usuaria principal captura en calle, con atención interrumpida, posible sol, ruido, movilidad y conectividad irregular. Diseñar para teléfonos de gama media y uso con una sola mano.

Reglas:

- Una pantalla debe responder una pregunta operativa principal.
- Mostrar primero lo pendiente, bloqueante o siguiente.
- Reducir decisiones, escritura y toques innecesarios.
- Usar lenguaje cotidiano de CRELEALTAD, no lenguaje técnico.
- Botones y áreas táctiles amplios, separados y alcanzables.
- Alto contraste y tipografía legible; no depender únicamente del color.
- Formularios por pasos cortos, siguiendo el orden del formato físico.
- Validación en contexto con instrucciones concretas para corregir.
- Guardado automático y recuperación del progreso.
- Mostrar claramente: guardado local, pendiente de sincronizar, sincronizando, sincronizado o con error.
- Nunca simular éxito cuando el servidor no confirmó la operación.
- Evitar modales, alerts y textos cuando el estado puede comunicarse visualmente.
- Reutilizar tokens y componentes compartidos antes de crear variantes locales.
- Considerar teclado, safe area, cámara, permisos, carga, vacío, error y accesibilidad.

## 7. Offline y sincronización

La captura de campo debe evolucionar hacia un enfoque offline-first controlado:

- Persistir borradores localmente por entidad y usuario.
- Registrar operaciones pendientes en una cola durable.
- Usar identificadores UUID creados en dispositivo cuando el contrato lo permita.
- Hacer reintentos con backoff e idempotencia.
- Subir documentos de forma reanudable y verificar confirmación del servidor.
- Evitar duplicados por reintentos.
- Definir política explícita de conflictos; nunca aplicar “última escritura gana” a datos financieros o decisiones críticas sin aprobación.
- Bloquear estados finales que requieran evidencias aún no sincronizadas.
- Permitir cerrar y reabrir la app sin perder captura.

No declarar un flujo “offline” solo porque utiliza `AsyncStorage`. Debe demostrarse captura, reinicio, reconexión, sincronización, deduplicación y recuperación ante error.

## 8. Reglas de dominio que no deben romperse

- No se borra información operativa ni historial crítico.
- Persona es identidad permanente con folio inmutable.
- Nombres de pila en `nombres`; apellidos en `apellido_pat` y `apellido_mat` según decisiones cerradas.
- PostgreSQL es la fuente de verdad de nombres de campos; capas de datos usan español y `snake_case`.
- Solicitudes se normalizan en tabla core más siete tablas hijas y usan upsert por `solicitud_id`.
- `persona_id`, `expediente_id` y `grupo_id` de solicitud se derivan en backend desde `integrante_id`.
- `numero_credito` y `credito_id` solo los genera el backend durante el desembolso real.
- Un ciclo nace únicamente con el desembolso real.
- Estados oficiales se calculan mediante reglas y eventos; el usuario no los selecciona arbitrariamente.
- Las políticas variables deben parametrizarse; no hardcodearlas.
- La solicitud física y la captura digital son capas distintas cuando ambas sean obligatorias.
- Los documentos locales no hacen que una solicitud quede lista hasta que las evidencias exigidas estén confirmadas en servidor.

## 9. Seguridad y datos

- No mostrar, copiar ni registrar contraseñas, tokens, secretos o datos personales innecesarios.
- No usar datos reales de clientas en fixtures, capturas o respuestas de diagnóstico.
- No consultar filas personales cuando basta con metadatos del esquema.
- Aplicar autorización y alcance de sucursal/zona en servidor.
- Registrar auditoría para cambios de estado, decisiones, excepciones, permisos, parámetros y movimientos financieros.
- No usar `DROP`, `TRUNCATE`, borrados masivos ni migraciones destructivas sin alcance explícito, respaldo verificado, plan de reversión y aprobación del usuario.
- Para cambios de esquema: inspección real, migración incremental, respaldo, prueba en `crelealtad_test`, validación y solo después aplicación controlada.
- No usar `synchronize: true`.

## 10. Protocolo de trabajo por tarea

Antes:

1. Definir resultado observable, alcance y fuera de alcance.
2. Identificar módulo, reglas, estados, permisos y datos afectados.
3. Revisar código activo, imports, rutas, pruebas y esquema real.
4. Detectar decisiones abiertas; pedir definición si afectan negocio.
5. Crear una especificación de módulo con `docs/project/21_MODULE_SPEC_TEMPLATE.md` cuando sea una capacidad nueva o ampliación importante.

Durante:

1. Hacer el cambio mínimo, modular y reversible.
2. Mantener reglas fuera de UI y autorización fuera de simples condiciones visuales.
3. Reutilizar componentes, tipos y servicios.
4. Añadir pruebas para regla, permiso, error y caso de conectividad afectados.
5. No mezclar refactors ajenos a la tarea.

Después:

1. Ejecutar TypeScript, compilación y pruebas aplicables.
2. Verificar el flujo nominal, bloqueo, permiso insuficiente y recuperación de error.
3. Para datos, verificar integridad, conteos, constraints y plan de reversión.
4. Revisar `docs/project/22_CHANGE_CHECKLIST.md`.
5. Actualizar estado, changelog o decisiones solo cuando corresponda.
6. Informar archivos modificados, pruebas, riesgos y pendientes reales.

## 11. Comandos base

Desde la raíz:

```powershell
npm run dev
```

API:

```powershell
Set-Location apps/api
npm run build
npm test
npm run start:dev
```

Mobile:

```powershell
Set-Location apps/mobile
npx tsc --noEmit
npm start
```

Antes de ejecutar cualquier comando que modifique PostgreSQL, explicar qué cambiará y cómo se verificará.

## 12. Prioridad técnica recomendada

Sin convertirla en autorización automática para implementar, el orden recomendado es:

1. Actualizar el inventario técnico oficial contra código y PostgreSQL.
2. Diseñar y aprobar la matriz módulo–acción–rol.
3. Implementar autorización de backend y navegación filtrada por permisos.
4. Eliminar mecanismos temporales de autenticación y gestionar secretos correctamente.
5. Diseñar la arquitectura offline y sincronización antes de extender masivamente formularios de campo.
6. Consolidar Documentación y Verificación con pruebas end-to-end.
7. Construir módulos financieros posteriores sobre auditoría e idempotencia desde el inicio.
