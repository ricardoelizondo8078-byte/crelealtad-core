# Publicación web de CRELEALTAD CORE

Estado: infraestructura preparada; activación externa pendiente  
Proveedor definido: Render  
Fecha: 2026-10-30

## Arquitectura

- `crelealtad-web`: exportación estática Expo Web servida por CDN.
- `crelealtad-api`: servicio NestJS en Node.js 20 o posterior.
- `crelealtad-postgres`: PostgreSQL 17 privado, sin acceso público.
- `/var/data`: disco persistente exclusivo para documentos y evidencias.
- `JWT_SECRET`: generado y custodiado por Render.
- CORS: limitado al origen exacto de la aplicación web.

La definición versionada está en `render.yaml`.

## Inicialización de datos

El predeploy ejecuta `npm --prefix apps/api run db:deploy`.

1. Si PostgreSQL está completamente vacío, carga únicamente la estructura de
   `database/schema-dump.sql` y registra el baseline canónico.
2. Si ya existe estructura, no la reinicializa.
3. Después aplica de forma transaccional las migraciones canónicas pendientes.
4. Si detecta drift, migraciones desconocidas o falta una confirmación exacta,
   el despliegue falla antes de iniciar la API.

El inicializador no carga personas, usuarios, expedientes ni documentos.

## Activación externa

1. Iniciar sesión en Render usando la cuenta GitHub propietaria del repositorio.
2. Crear un Blueprint desde `ricardoelizondo8078-byte/crelealtad-core`.
3. Revisar y aceptar los tres recursos definidos en `render.yaml`.
4. Esperar el estado `Live` de API y web.
5. Validar `https://crelealtad-api.onrender.com/health`.
6. Validar `https://crelealtad-web.onrender.com` a 390, 1024 y 1440 px.

## Condiciones antes de operación real

- No importar la base local hasta eliminar PIN compartidos y confirmar el
  procedimiento de cambio de PIN para cada usuario.
- No transmitir datos personales a Render sin aprobación explícita del
  responsable de CRELEALTAD y respaldo cifrado verificado.
- Crear la primera identidad administrativa mediante un procedimiento separado,
  auditable y sin credenciales escritas en Git.
- Verificar respaldo de PostgreSQL y del disco de evidencias.
- Ejecutar la lista `docs/project/22_CHANGE_CHECKLIST.md`.
