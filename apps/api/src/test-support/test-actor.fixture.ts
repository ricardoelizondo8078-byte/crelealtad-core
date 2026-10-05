import { randomUUID } from 'node:crypto';
import { DataSource, EntityManager } from 'typeorm';

export interface TestActorFixture {
  usuarioId: string;
  empleadoId: string;
  rolId: string;
  sucursalId: string;
}

interface CreateTestActorOptions {
  usuarioId?: string;
  tipoEmpleado?: string;
}

async function insertTestActor(
  manager: EntityManager,
  fixture: TestActorFixture,
  tipoEmpleado: string,
): Promise<void> {
  const suffix = fixture.usuarioId.replace(/-/g, '').slice(0, 12);

  await manager.query(
    `INSERT INTO sucursales (id, folio, nombre)
     VALUES ($1, $2, $3)`,
    [fixture.sucursalId, `TEST-${suffix}`, `SUCURSAL PRUEBA ${suffix}`],
  );
  await manager.query(
    `INSERT INTO roles (id, folio, nombre, estado)
     VALUES ($1, $2, $3, 'ACTIVO')`,
    [fixture.rolId, `TEST-${suffix}`, `ROL_PRUEBA_${suffix}`],
  );
  await manager.query(
    `INSERT INTO usuarios (
       id, nombre, apellido_paterno, email, password_hash, rol_id, sucursal_id, estado
     ) VALUES ($1, 'USUARIO', 'PRUEBA', $2, 'HASH_SOLO_PRUEBA', $3, $4, 'ACTIVO')`,
    [
      fixture.usuarioId,
      `usuario.prueba.${suffix}@example.invalid`,
      fixture.rolId,
      fixture.sucursalId,
    ],
  );
  await manager.query(
    `INSERT INTO empleados (id, usuario_id, tipo_empleado)
     VALUES ($1, $2, $3)`,
    [fixture.empleadoId, fixture.usuarioId, tipoEmpleado],
  );
}

export async function createTestActorFixture(
  dataSource: DataSource,
  options: CreateTestActorOptions = {},
): Promise<TestActorFixture> {
  const fixture: TestActorFixture = {
    usuarioId: options.usuarioId ?? randomUUID(),
    empleadoId: randomUUID(),
    rolId: randomUUID(),
    sucursalId: randomUUID(),
  };

  await dataSource.transaction((manager) =>
    insertTestActor(manager, fixture, options.tipoEmpleado ?? 'PRUEBA'),
  );
  return fixture;
}

export async function deleteTestActorFixture(
  dataSource: DataSource,
  fixture: TestActorFixture,
): Promise<void> {
  await dataSource.transaction(async (manager) => {
    await manager.query('DELETE FROM audit_log WHERE usuario_id = $1', [fixture.usuarioId]);
    await manager.query('DELETE FROM empleados WHERE id = $1', [fixture.empleadoId]);
    await manager.query('DELETE FROM usuarios WHERE id = $1', [fixture.usuarioId]);
    await manager.query('DELETE FROM roles WHERE id = $1', [fixture.rolId]);
    await manager.query('DELETE FROM sucursales WHERE id = $1', [fixture.sucursalId]);
  });
}
