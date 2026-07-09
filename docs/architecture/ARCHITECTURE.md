# Arquitectura propuesta

Este documento consolida la documentación de arquitectura del proyecto CRELEALTAD CORE.

## Objetivo del repositorio

Organizar un monorepo inicial para:
- una aplicación móvil con React Native
- un backend con NestJS
- una base de datos PostgreSQL
- documentación y configuración de infraestructura

## Estructura propuesta

```text
apps/
  mobile/
    src/
      app/
      features/
      shared/
      assets/
    docs/
  api/
    src/
      app/
      modules/
      common/
      config/
      infra/
    test/
    docs/

packages/
  shared/
    src/
      types/
      constants/
      utils/

infra/
  docker/
  env/
  scripts/

database/
  migrations/
  seeds/
  schema/

docs/
  architecture/
  ux/

README.md
```

## Principios de organización

- Separar la aplicación móvil del backend en proyectos independientes.
- Mantener el código compartido en paquetes reutilizables.
- Reservar la carpeta de infraestructura para contenedores, variables de entorno y scripts operativos.
- Mantener la base de datos en una carpeta dedicada para esquemas, migraciones y semillas.
- Documentar la arquitectura y el diseño de experiencia de usuario sin implementar reglas de negocio.

## Alcance inicial

Este es un punto de partida estructural. No se implementan módulos funcionales ni reglas de negocio en este paso.
