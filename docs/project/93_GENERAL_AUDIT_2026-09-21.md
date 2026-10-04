# 93 Auditoría General 2026-09-21

Estado: Implementación crítica completada; producción aún bloqueada por decisiones y capacidades pendientes
Alcance: código activo, flujo de información, relaciones de módulos, contrato de API, metadatos PostgreSQL y documentación oficial
Datos: sólo metadatos en `crelealtad`; pruebas e integraciones en `crelealtad_test` con datos inventados

## Resultado ejecutivo

La base técnica es modular por dominio y puede seguir creciendo, pero aún no debe declararse lista para producción. En esta auditoría se corrigieron los riesgos ejecutables más inmediatos del recorrido Login → Documentación → Verificación sin cambiar reglas funcionales abiertas ni el esquema real.

## Correcciones implementadas

1. Contrato de escritura seguro: el cliente ya no puede proponer monto autorizado, ciclo, relaciones derivadas ni rutas documentales.
2. Evidencia real: la completitud verifica el manifiesto y archivo del servidor; una ruta inventada o local no completa el Paso 7.
3. Completitud consistente: backend y formulario exigen el mismo conjunto de campos; la edad es derivada.
4. Agregado único: crear grupo crea su expediente atómicamente; se eliminó el segundo endpoint de alta.
5. Selección determinista: si un grupo tiene varios expedientes históricos, se usa el más reciente por `created_at`.
6. Menor privilegio: `ASESOR` sólo puede consultar o modificar expedientes propios a través de rutas directas y archivos.
7. Auditoría: altas y cambios principales registran actor, acción y nombres de campos en la misma transacción, sin duplicar PII.
8. Sesión: la app valida `/auth/me` antes de restaurar usuario, rol y permisos.
9. Superficie pública: se eliminó la lista anónima de usuarios.
10. Producción: base de datos y JWT fallan cerrado; TLS valida certificados salvo excepción explícita.

## Flujo y relaciones verificadas

```text
Usuario/JWT
  -> permisos módulo/acción
  -> empleado responsable (ASESOR)
  -> grupo
  -> expediente
  -> integrante -> persona
  -> solicitud core + 7 tablas hijas
  -> documento confirmado en almacenamiento
  -> completitud
  -> tesorera + participantes
  -> handoff a Verificación
```

PostgreSQL mantiene 39 tablas base, una vista, 39 PK, 61 FK, 44 UNIQUE, 24 CHECK y 146 índices. No hay RLS ni triggers públicos; la autorización de aplicación es por tanto obligatoria y no puede sustituirse por ocultamiento visual.

## Calidad y diseño

- Se reutilizaron servicios comunes para alcance y auditoría, reduciendo repetición.
- Los controladores sólo traducen HTTP y usuario autenticado; reglas, acceso y persistencia permanecen en servicios.
- Los cambios sensibles usan transacciones y asignación explícita de campos.
- `synchronize` continúa desactivado.
- Verificación completa: 25 suites, 123 pruebas, TypeScript API/mobile y build Nest en verde.

## Riesgos que permanecen abiertos

1. Matriz funcional definitiva y alcance por sucursal/zona.
2. Reconciliación de expedientes históricos sin responsable confiable.
3. PIN temporal compartido, cambio/recuperación de PIN y operación real de secretos.
4. Almacenamiento documental durable con respaldo y monitoreo.
5. Cola offline durable, idempotencia entre reinicios, backoff y conflictos.
6. Migraciones dispersas sin una cadena/ledger canónico único.
7. Pantallas grandes de Solicitud y Verificación que requieren extracción gradual con pruebas móviles.
8. Módulos Análisis, Desembolsos, Cobranza, Recolección, Mora, Convenios, Reportes, Parámetros y Administración aún incompletos.
9. Contradicción funcional C-010 sobre el momento de nacimiento del grupo; requiere decisión de Dirección.

## Frecuencia recomendada

- En cada cambio: typecheck y pruebas afectadas.
- Semanal mientras exista desarrollo intenso: revisión corta de seguridad, contratos y documentación.
- Al cerrar cada módulo o migración: auditoría de flujo, permisos, datos, rollback y pruebas end-to-end.
- Mensual: auditoría integral de arquitectura/deuda y actualización de inventarios.
- Antes de piloto o producción: auditoría completa, pruebas de restauración de respaldo, seguridad, rendimiento, offline y aceptación operativa.

La siguiente auditoría integral debe hacerse al cerrar Documentación + Verificación end-to-end o antes de incorporar Desembolsos, lo que ocurra primero.
