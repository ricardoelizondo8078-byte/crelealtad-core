# 11 Architecture Guide — Guía de Arquitectura

Versión: 2.12.0
Estado: Vigente y verificado
Fecha de auditoría: 2026-10-04

## Arquitectura mayor

- Monorepo Node/TypeScript.
- Mobile: React Native + Expo + TypeScript.
- Backend: NestJS + TypeORM + TypeScript.
- Datos: PostgreSQL.
- Comunicación: API HTTP JSON.
- Documentación oficial: `docs/project` y decisiones cerradas en `docs/DECISIONES.md`.

## Estructura verificada

- `apps/api`: API NestJS persistente.
- `apps/mobile`: aplicación operativa de campo.
- `database`: schema, migraciones y documentación de migración.
- `docs`: gobierno, producto, arquitectura, UX y reportes históricos.
- `packages`: existe, sin artefactos compartidos implementados.
- `scripts`: arranque del monorepo.
- `assets`: identidad visual base.
- `tools`: herramientas auxiliares; no forman parte automática del runtime principal.

## Backend

### Módulos registrados

- `AuthModule`
- `GruposModule`
- `ExpedientesModule`
- `IntegrantesModule`
- `SolicitudesModule`
- `CodigosPostalesModule`
- `RenovacionesModule`
- `PendientesModule`
- `VerificacionLlamadasModule`
- `VerificacionVisitasVecinoModule`
- `VerificacionImagenesDomicilioModule`
- `VerificacionEntrevistaModule`
- `HealthController` en el módulo raíz

### Superficie HTTP verificada

- Auth: 2 handlers; la API no expone una lista pública de usuarios.
- Grupos: 3 handlers.
- Expedientes: 7 handlers; el alta ocurre únicamente dentro de la creación transaccional de grupo o renovación.
- Integrantes: 7 handlers.
- Solicitudes: 6 handlers canónicos, incluidos carga, metadatos y contenido documental autenticados.
- Códigos postales: 2 handlers.
- Renovaciones: 2 handlers.
- Pendientes: 1 handler.
- Llamadas de Verificación: 8 handlers.
- Visitas al vecino de Verificación: 8 handlers.
- Imágenes del domicilio de Verificación: 4 handlers.
- Entrevista y sus evidencias: 5 handlers.
- Health: 1 handler.
- Total: 56 handlers.

### Persistencia y validación

- Repositorios TypeORM activos para entidades registradas.
- PostgreSQL mediante variables de entorno. Los fallbacks existen sólo fuera de producción; producción exige `DATABASE_URL` o credenciales completas y valida TLS por defecto.
- `synchronize: false`.
- ValidationPipe global con whitelist, rechazo de campos desconocidos y transformación.
- Solicitudes normalizadas mediante una entidad core y siete entidades hijas. El servicio deriva `persona_id`, `expediente_id` y `grupo_id` desde `integrante_id`; esos identificadores no forman parte del contrato público de escritura.
- Los upserts de las siete tablas hijas reutilizan una rutina tipada común; el almacenamiento documental se consume mediante `DocumentosStoragePort` y su implementación filesystem.
- `IntegrantesModule` depende de `SolicitudesModule`; Solicitudes consulta el contexto mediante su repositorio y no crea un ciclo de módulos.
- Versiones documentales inmutables en filesystem configurable por `DOCUMENT_STORAGE_PATH`; PostgreSQL conserva la referencia vigente.
- `AccessScope` concentra la propiedad por responsable y evita condicionales de autorización dispersos. `AuditEntry` concentra la escritura consistente de eventos.
- Los DTO públicos no aceptan `monto_autorizado`, `ciclo_numero`, relaciones derivadas ni rutas/fechas documentales. `ValidationPipe` rechaza esos campos en lugar de ignorarlos.

### Seguridad disponible

- JWT con Passport.
- Guard JWT global.
- Helmet.
- CORS configurable.
- Throttling general y límite específico para login.
- Logging middleware y logger común.

### Brechas backend

- Existe un guard global y un decorador de permisos por módulo/acción; toda ruta protegida sin clasificación explícita queda bloqueada. El vocabulario autorizable vive en `auth/permission.contract.ts`, por lo que un identificador nuevo requiere una ampliación central y comprobable, no cadenas dispersas.
- El alcance por responsable está aplicado de extremo a extremo para `ASESOR` en el recorrido activo. El alcance por sucursal/zona y la matriz de los demás roles siguen pendientes.
- Cada asesor valida su PIN contra su propio hash bcrypt; no existe bypass universal. Durante pruebas, los 49 asesores comparten temporalmente el valor aprobado `1234` y tienen `requiere_cambio_pin = true`.
- El middleware registra únicamente metadatos operativos de la petición; no serializa body, parámetros, cabeceras ni valores rechazados por validación.
- `JWT_SECRET` es obligatorio cuando `NODE_ENV=production`; el valor local de desarrollo no permite iniciar producción.
- Las credenciales PostgreSQL también son obligatorias en producción cuando no existe `DATABASE_URL`; la validación del certificado sólo puede desactivarse explícitamente.
- `send-to-verification` usa bloqueo pesimista, valida participantes, pendientes y una tesorera vigente, admite `RETIRADA`, es idempotente y registra el handoff en `audit_log`. Selección/cambio de tesorera, retiro y reintegro son eventos transaccionales auditados; el mínimo parametrizado exacto continúa pendiente.
- DTOs de integrantes conservan alias camelCase/legacy contrarios a la nomenclatura objetivo.
- Las rutas activas y formularios principales no registran payloads ni datos personales en consola.
- No hay módulos ejecutables para análisis, desembolso, cobranza, mora, convenios, reportes, parámetros o administración.

## Aplicación móvil

### Runtime activo

- Entrada `apps/mobile/App.tsx` delega en `apps/mobile/src/App.tsx`.
- `AuthProvider` controla la sesión en memoria; el JWT vive en Expo SecureStore y una migración elimina el valor legacy de AsyncStorage.
- Navegación implementada como estado local en `AppContent`, sin librería de navegación declarativa.
- Superficies principales: login, inicio, crear grupo, renovación, expedientes, detalle de expediente, lista/detalle de verificación y verificación de integrante.
- Formularios auxiliares para integrante, solicitud y documentos.

### Diseño y componentes

- 31 componentes `.tsx` compartidos en `src/components/ui`.
- Tokens en `src/theme/tokens.ts`.
- Fuentes Montserrat e Inter.
- Uso de cámara/galería mediante Expo Image Picker.
- Lectura puntual de ubicación en primer plano mediante Expo Location al confirmar un resultado de llamada; si no existe una lectura válida, la API no recibe ni registra el intento.
- AsyncStorage conserva usuario y borradores no sensibles; SecureStore conserva el JWT. La pantalla documental activa solo presenta como sincronizadas las rutas confirmadas por la API.

### Comunicación API

- `src/services/api-client.ts` agrega JWT automáticamente.
- Varias pantallas activas todavía usan `fetch` directo.
- El uso mixto puede producir HTTP 401 en rutas protegidas y respuestas inconsistentes.
- Debe consolidarse todo acceso protegido en un solo cliente.

### Brechas mobile

- El inicio filtra sus accesos con los permisos efectivos incluidos en login y `/auth/me`; el hook de acceso operativo y el constructor del menú mantienen esa regla fuera del shell `App.tsx`.
- El contrato efectivo actual contiene listas de `modulos` y `acciones`, con soporte de comodín administrativo.
- La sesión guardada se valida contra `/auth/me` al iniciar y sólo entonces restaura usuario, rol y permisos efectivos.
- No hay cola durable offline, backoff, idempotencia ni reconciliación.
- La selección fallida se conserva únicamente durante la sesión de pantalla; cerrar la app antes de confirmar pierde ese reintento.
- La API aplica una política común de firma JPEG/PNG/PDF, máximo de 10 MB, UUID de rutas y SHA-256, y conserva versiones anteriores en almacenamiento. Todas las entradas multipart limitan archivos, campos, partes y encabezados. La carga documental admite hasta 12 archivos por petición; mobile encadena los lotes necesarios y el backend sólo activa la versión completa al finalizar, sin limitar la cantidad funcional aprobada para `comprobante_credito`. Falta un proveedor durable de producción, limpieza programada de cargas parciales y respaldo operativo.
- Las variantes paralelas legacy de `modules/asesor` y sus archivos backup fueron retiradas del árbol activo después de comprobar que no tenían imports ni rutas vigentes.
- No hay pruebas automatizadas mobile verificadas.

## Base de datos

- PostgreSQL 17.10.
- 50 tablas base y una vista pública; `schema_migrations` es una tabla técnica sin datos operativos.
- Las migraciones 033 a 035 agregaron tres FK faltantes, un ledger por checksum y validación estructural de permisos JSONB; `crelealtad_test` y `crelealtad` tienen 32 migraciones aplicadas sin pendientes ni drift hasta 035.
- `verificacion_llamadas` conserva cada intento confirmado y su ubicación actual del dispositivo; tres tablas hijas guardan encuesta, seis características y metadatos de evidencia. La imagen vive en almacenamiento protegido y no existe borrado operativo.
- `verificacion_visita_vecino_fachadas` conserva metadatos, hash, actor e ubicación de la fachada; el archivo se mantiene en filesystem protegido y se entrega sólo mediante API autenticada. `verificacion_visitas_vecino` conserva la confirmación combinada y liga cada respuesta nueva con la fachada más reciente.
- `verificacion_visita_vecino_evidencias` conserva la segunda fotografía geolocalizada y la liga a la respuesta concreta; el archivo también permanece en filesystem protegido y sólo se entrega con JWT y alcance válido.
- `verificacion_imagenes_domicilio` conserva el historial de nomenclaturas, fachada, medidor de luz y fachada con la integrante, con tipo, hash, actor, fechas e ubicación por toma; los archivos viven en filesystem protegido y la API presenta únicamente la imagen más reciente de cada tipo sin exponer coordenadas. M03 ofrece fachada y medidor como obligatorias, mantiene la fachada con integrante opcional y reserva la nomenclatura para otro módulo sin eliminar su contrato ni historia.
- `verificacion_entrevistas` conserva una captura parcial tipada por integrante; familiares y desacuerdos viven en historiales separados de altas y retiros. `verificacion_entrevista_evidencias` unifica las fotografías de negocio, control de pagos y folleto, y exige en toda captura nueva cámara, horas, actor, coordenadas, fuente, hash e idempotencia. Los archivos permanecen protegidos y las filas previas a la migración 031 no reciben coordenadas inventadas.
- D01 conserva cortes históricos del Excel en tres tablas separadas del modelo transaccional de desembolso; la carga usa manifiesto, hash, prevalidación y transacción.
- Roles y permisos iniciales almacenados.
- Sin RLS ni triggers públicos.
- Auditoría transversal incompleta.

El detalle canónico está en `10_DATABASE_PRINCIPLES.md`.

## Offline y conectividad variable

Estado actual:

- Persistencia local parcial con AsyncStorage.
- Captura de imágenes y carga inmediata autenticada al servidor.
- Timeout de health check para descubrimiento de API.
- Sin motor de sincronización verificable.

Arquitectura requerida antes de escalar captura:

1. Almacén local estructurado por entidad/usuario.
2. Cola durable de operaciones.
3. Idempotency keys y UUID cuando aplique.
4. Reintentos con backoff.
5. Estado visible de sincronización.
6. Subida reanudable de documentos.
7. Política de conflictos aprobada.
8. Pruebas de cierre, reinicio, reconexión y duplicidad.

## Testing y calidad

- Treinta y seis suites API activas; no quedan suites `.skip`.
- Cero suites automatizadas mobile verificadas.
- `npm run build` de la API fue aprobado el 2026-09-02.
- Jest aprobó 36 suites y 161 pruebas el 2026-09-25.
- La limpieza de los casos activos de `crelealtad_test` termina correctamente.
- `npm run typecheck` valida API y mobile desde la raíz. TypeScript rechaza implícitos `any`, símbolos/parámetros sin uso, retornos incompletos y fallthrough en API; mobile aplica las puertas equivalentes compatibles con Expo.
- Falta una prueba end-to-end del flujo login → documentación → verificación.
- `npm run verify` ejecuta typecheck y las pruebas API; la preparación determinista de `crelealtad_test` continúa como requisito para integraciones.

## Deployment e integraciones

- No se verificó configuración productiva completa de despliegue.
- No se verificó almacenamiento S3 operativo.
- No se verificó CI/CD como contrato activo.
- Railway y Expo EAS permanecen como objetivos documentales, no como despliegues confirmados por esta auditoría.

## Decisiones de consistencia

1. La constitución y decisiones cerradas gobiernan semántica funcional.
2. Código y PostgreSQL gobiernan el inventario técnico observable.
3. Un artefacto presente no se considera integrado hasta rastrear su uso en runtime.
4. Ocultar una acción en mobile no sustituye autorización en API.
5. AsyncStorage no equivale a arquitectura offline completa.
6. Todo cambio de esquema usa migración revisada y reversible.

## Referencias cruzadas

- `project/03_PROJECT_STATUS.md`
- `project/10_DATABASE_PRINCIPLES.md`
- `project/12_SECURITY_MODEL.md`
- `project/13_DEVELOPMENT_STANDARDS.md`
- `project/20_MODULE_CATALOG.md`
- `../DECISIONES.md`
