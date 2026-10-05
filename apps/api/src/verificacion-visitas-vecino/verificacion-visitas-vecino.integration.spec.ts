import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { ExpedienteEntity } from '../expedientes/expediente.entity';
import { GrupoEntity } from '../grupos/grupo.entity';
import { PersonaEntity } from '../personas/persona.entity';
import {
  createTestActorFixture,
  deleteTestActorFixture,
  TestActorFixture,
} from '../test-support/test-actor.fixture';
import { VerificacionVisitasVecinoModule } from './verificacion-visitas-vecino.module';

describe('VerificacionVisitasVecino integración', () => {
  jest.setTimeout(30000);
  const usuarioId = randomUUID();
  const grupoId = randomUUID();
  const expedienteId = randomUUID();
  const integranteId = randomUUID();
  let app: INestApplication;
  let dataSource: DataSource;
  let testActor: TestActorFixture;
  let storageRoot: string;

  beforeAll(async () => {
    storageRoot = await mkdtemp(join(tmpdir(), 'crelealtad-visita-vecino-integration-'));
    process.env.VERIFICACION_STORAGE_PATH = storageRoot;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          username: process.env.DB_USER || process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || process.env.DB_PASS,
          database: 'crelealtad_test',
          autoLoadEntities: true,
          synchronize: false,
        }),
        TypeOrmModule.forFeature([ExpedienteEntity, GrupoEntity, PersonaEntity]),
        VerificacionVisitasVecinoModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use((req: { user?: unknown }, _res: unknown, next: () => void) => {
      req.user = {
        id: usuarioId,
        permisos_personalizados: null,
        rol: {
          nombre: 'VERIFICADOR',
          permisos: {
            modulos: ['verificacion'],
            acciones: ['leer', 'registrar'],
          },
        },
      };
      next();
    });
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }));
    await app.init();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    testActor = await createTestActorFixture(dataSource, { usuarioId });

    await dataSource.query('INSERT INTO grupos (id, nombre) VALUES ($1, $2)', [
      grupoId,
      'GRUPO PRUEBA VISITA VECINO',
    ]);
    await dataSource.query(
      'INSERT INTO expedientes (id, grupo_id, estado) VALUES ($1, $2, $3)',
      [expedienteId, grupoId, 'EN_VERIFICACION'],
    );
    await dataSource.query(
      'INSERT INTO integrantes (id, expediente_id, estado) VALUES ($1, $2, $3)',
      [integranteId, expedienteId, 'SUJETA_CREDITO'],
    );
  });

  afterAll(async () => {
    if (!dataSource) {
      delete process.env.VERIFICACION_STORAGE_PATH;
      await rm(storageRoot, { recursive: true, force: true });
      return;
    }
    await dataSource.query(
      "DELETE FROM audit_log WHERE tabla='verificacion_visita_vecino_evidencias' AND registro_id IN (SELECT e.id FROM verificacion_visita_vecino_evidencias e JOIN verificacion_visitas_vecino v ON v.id=e.visita_id WHERE v.integrante_id=$1)",
      [integranteId],
    );
    await dataSource.query(
      'DELETE FROM verificacion_visita_vecino_evidencias WHERE visita_id IN (SELECT id FROM verificacion_visitas_vecino WHERE integrante_id=$1)',
      [integranteId],
    );
    await dataSource.query(
      "DELETE FROM audit_log WHERE tabla='verificacion_visitas_vecino' AND registro_id IN (SELECT id FROM verificacion_visitas_vecino WHERE integrante_id=$1)",
      [integranteId],
    );
    await dataSource.query(
      'DELETE FROM verificacion_visitas_vecino WHERE integrante_id=$1',
      [integranteId],
    );
    await dataSource.query(
      "DELETE FROM audit_log WHERE tabla='verificacion_visita_vecino_fachadas' AND registro_id IN (SELECT id FROM verificacion_visita_vecino_fachadas WHERE integrante_id=$1)",
      [integranteId],
    );
    await dataSource.query(
      'DELETE FROM verificacion_visita_vecino_fachadas WHERE integrante_id=$1',
      [integranteId],
    );
    await dataSource.query('DELETE FROM integrantes WHERE id=$1', [integranteId]);
    await dataSource.query('DELETE FROM expedientes WHERE id=$1', [expedienteId]);
    await dataSource.query('DELETE FROM grupos WHERE id=$1', [grupoId]);
    await deleteTestActorFixture(dataSource, testActor);
    await app.close();
    delete process.env.VERIFICACION_STORAGE_PATH;
    await rm(storageRoot, { recursive: true, force: true });
  });

  it('exige fachada de cámara con ubicación, conserva historial y devuelve lo más reciente', async () => {
    await request(app.getHttpServer())
      .post(`/verificacion/integrantes/${integranteId}/visitas-vecino`)
      .set('X-Crelealtad-Context', 'verificacion')
      .send({
        conoce_y_sabe_donde_vive: true,
        fachada_id: randomUUID(),
        idempotency_key: `neighbor_sin_ubicacion_${Date.now()}`,
      })
      .expect(400);

    await request(app.getHttpServer())
      .post(`/verificacion/integrantes/${integranteId}/visitas-vecino/fachadas`)
      .set('X-Crelealtad-Context', 'verificacion')
      .field('idempotency_key', `facade_sin_foto_${Date.now()}`)
      .field('foto_capturada_at', '2026-09-22T18:42:58.000Z')
      .field('ubicacion_latitud', '25.686614238')
      .field('ubicacion_longitud', '-100.316112689')
      .field('ubicacion_capturada_at', '2026-09-22T18:43:00.000Z')
      .expect(400);

    const evidenciaJpeg = Buffer.from([0xff, 0xd8, 0xff, 0x01, 0x02]);
    const fachadaIdempotencyKey = `facade_test_${Date.now()}`;
    const fachada = await request(app.getHttpServer())
      .post(`/verificacion/integrantes/${integranteId}/visitas-vecino/fachadas`)
      .set('X-Crelealtad-Context', 'verificacion')
      .field('idempotency_key', fachadaIdempotencyKey)
      .field('foto_capturada_at', '2026-09-22T18:42:58.000Z')
      .field('ubicacion_latitud', '25.686614238')
      .field('ubicacion_longitud', '-100.316112689')
      .field('ubicacion_precision_metros', '8.567')
      .field('ubicacion_capturada_at', '2026-09-22T18:43:00.000Z')
      .attach('foto', evidenciaJpeg, {
        filename: 'fachada.jpg',
        contentType: 'image/jpeg',
      })
      .expect(201);

    expect(fachada.body.fachada.id).toMatch(/^[0-9a-f-]{36}$/);

    const fachadaRepetida = await request(app.getHttpServer())
      .post(`/verificacion/integrantes/${integranteId}/visitas-vecino/fachadas`)
      .set('X-Crelealtad-Context', 'verificacion')
      .field('idempotency_key', fachadaIdempotencyKey)
      .field('foto_capturada_at', '2026-09-22T18:42:58.000Z')
      .field('ubicacion_latitud', '25.686614238')
      .field('ubicacion_longitud', '-100.316112689')
      .field('ubicacion_precision_metros', '8.567')
      .field('ubicacion_capturada_at', '2026-09-22T18:43:00.000Z')
      .attach('foto', evidenciaJpeg, {
        filename: 'fachada.jpg',
        contentType: 'image/jpeg',
      })
      .expect(201);
    expect(fachadaRepetida.body.fachada.id).toBe(fachada.body.fachada.id);

    const resumenFachada = await request(app.getHttpServer())
      .get(`/verificacion/integrantes/${integranteId}/visitas-vecino/fachadas/resumen`)
      .set('X-Crelealtad-Context', 'verificacion')
      .expect(200);
    expect(resumenFachada.body.fachada.id).toBe(fachada.body.fachada.id);
    expect(JSON.stringify(resumenFachada.body)).not.toContain('ubicacion_latitud');
    expect(JSON.stringify(resumenFachada.body)).not.toContain('ubicacion_longitud');

    await request(app.getHttpServer())
      .get(`/verificacion/integrantes/${integranteId}/visitas-vecino/fachadas/${fachada.body.fachada.id}/archivo`)
      .set('X-Crelealtad-Context', 'verificacion')
      .expect('Content-Type', /image\/jpeg/)
      .expect(200);

    const fachadaGuardada = await dataSource.query(
      `SELECT
         captura_fuente,
         ubicacion_latitud::double precision AS latitud,
         ubicacion_longitud::double precision AS longitud,
         ubicacion_precision_metros::double precision AS precision_metros,
         ubicacion_fuente
       FROM verificacion_visita_vecino_fachadas
       WHERE id=$1`,
      [fachada.body.fachada.id],
    );
    expect(fachadaGuardada[0]).toEqual({
      captura_fuente: 'CAMARA',
      latitud: 25.6866142,
      longitud: -100.3161127,
      precision_metros: 8.57,
      ubicacion_fuente: 'DISPOSITIVO',
    });

    const idempotencyKey = `neighbor_test_${Date.now()}`;
    const primera = await request(app.getHttpServer())
      .post(`/verificacion/integrantes/${integranteId}/visitas-vecino`)
      .set('X-Crelealtad-Context', 'verificacion')
      .send({
        fachada_id: fachada.body.fachada.id,
        conoce_y_sabe_donde_vive: true,
        idempotency_key: idempotencyKey,
        ubicacion_latitud: 25.686614238,
        ubicacion_longitud: -100.316112689,
        ubicacion_precision_metros: 8.567,
        ubicacion_capturada_at: '2026-09-22T18:43:00.000Z',
      })
      .expect(201);

    expect(primera.body.resumen.resultado.conoce_y_sabe_donde_vive).toBe(true);
    expect(primera.body.resumen.resultado.visita_id).toBe(primera.body.visita.id);

    const repetida = await request(app.getHttpServer())
      .post(`/verificacion/integrantes/${integranteId}/visitas-vecino`)
      .set('X-Crelealtad-Context', 'verificacion')
      .send({
        fachada_id: fachada.body.fachada.id,
        conoce_y_sabe_donde_vive: true,
        idempotency_key: idempotencyKey,
        ubicacion_latitud: 25.686614238,
        ubicacion_longitud: -100.316112689,
        ubicacion_precision_metros: 8.567,
        ubicacion_capturada_at: '2026-09-22T18:43:00.000Z',
      })
      .expect(201);

    expect(repetida.body.visita.id).toBe(primera.body.visita.id);

    await request(app.getHttpServer())
      .post(`/verificacion/integrantes/${integranteId}/visitas-vecino/${primera.body.visita.id}/evidencias`)
      .set('X-Crelealtad-Context', 'verificacion')
      .field('idempotency_key', `neighbor_evidence_sin_foto_${Date.now()}`)
      .field('foto_capturada_at', '2026-09-22T18:45:58.000Z')
      .field('ubicacion_latitud', '25.686614238')
      .field('ubicacion_longitud', '-100.316112689')
      .field('ubicacion_capturada_at', '2026-09-22T18:46:00.000Z')
      .expect(400);

    const evidenciaIdempotencyKey = `neighbor_evidence_test_${Date.now()}`;
    const evidencia = await request(app.getHttpServer())
      .post(`/verificacion/integrantes/${integranteId}/visitas-vecino/${primera.body.visita.id}/evidencias`)
      .set('X-Crelealtad-Context', 'verificacion')
      .field('idempotency_key', evidenciaIdempotencyKey)
      .field('foto_capturada_at', '2026-09-22T18:45:58.000Z')
      .field('ubicacion_latitud', '25.686614238')
      .field('ubicacion_longitud', '-100.316112689')
      .field('ubicacion_precision_metros', '7.891')
      .field('ubicacion_capturada_at', '2026-09-22T18:46:00.000Z')
      .attach('foto', evidenciaJpeg, {
        filename: 'evidencia.jpg',
        contentType: 'image/jpeg',
      })
      .expect(201);

    const evidenciaRepetida = await request(app.getHttpServer())
      .post(`/verificacion/integrantes/${integranteId}/visitas-vecino/${primera.body.visita.id}/evidencias`)
      .set('X-Crelealtad-Context', 'verificacion')
      .field('idempotency_key', evidenciaIdempotencyKey)
      .field('foto_capturada_at', '2026-09-22T18:45:58.000Z')
      .field('ubicacion_latitud', '25.686614238')
      .field('ubicacion_longitud', '-100.316112689')
      .field('ubicacion_precision_metros', '7.891')
      .field('ubicacion_capturada_at', '2026-09-22T18:46:00.000Z')
      .attach('foto', evidenciaJpeg, {
        filename: 'evidencia.jpg',
        contentType: 'image/jpeg',
      })
      .expect(201);
    expect(evidenciaRepetida.body.evidencia.id).toBe(evidencia.body.evidencia.id);

    const resumenEvidencia = await request(app.getHttpServer())
      .get(`/verificacion/integrantes/${integranteId}/visitas-vecino/${primera.body.visita.id}/evidencias/resumen`)
      .set('X-Crelealtad-Context', 'verificacion')
      .expect(200);
    expect(resumenEvidencia.body.evidencia.id).toBe(evidencia.body.evidencia.id);
    expect(JSON.stringify(resumenEvidencia.body)).not.toContain('ubicacion_latitud');
    expect(JSON.stringify(resumenEvidencia.body)).not.toContain('ubicacion_longitud');

    await request(app.getHttpServer())
      .get(`/verificacion/integrantes/${integranteId}/visitas-vecino/${primera.body.visita.id}/evidencias/${evidencia.body.evidencia.id}/archivo`)
      .set('X-Crelealtad-Context', 'verificacion')
      .expect('Content-Type', /image\/jpeg/)
      .expect(200);

    const evidenciaGuardada = await dataSource.query(
      `SELECT
         captura_fuente,
         ubicacion_latitud::double precision AS latitud,
         ubicacion_longitud::double precision AS longitud,
         ubicacion_precision_metros::double precision AS precision_metros,
         ubicacion_fuente
       FROM verificacion_visita_vecino_evidencias
       WHERE id=$1`,
      [evidencia.body.evidencia.id],
    );
    expect(evidenciaGuardada[0]).toEqual({
      captura_fuente: 'CAMARA',
      latitud: 25.6866142,
      longitud: -100.3161127,
      precision_metros: 7.89,
      ubicacion_fuente: 'DISPOSITIVO',
    });

    const segunda = await request(app.getHttpServer())
      .post(`/verificacion/integrantes/${integranteId}/visitas-vecino`)
      .set('X-Crelealtad-Context', 'verificacion')
      .send({
        fachada_id: fachada.body.fachada.id,
        conoce_y_sabe_donde_vive: false,
        idempotency_key: `neighbor_test_no_${Date.now()}`,
        ubicacion_latitud: 25.68660001,
        ubicacion_longitud: -100.31610001,
        ubicacion_capturada_at: '2026-09-22T18:45:00.000Z',
      })
      .expect(201);

    const resumen = await request(app.getHttpServer())
      .get(`/verificacion/integrantes/${integranteId}/visitas-vecino/resumen`)
      .set('X-Crelealtad-Context', 'verificacion')
      .expect(200);

    expect(resumen.body.resultado.conoce_y_sabe_donde_vive).toBe(false);
    expect(resumen.body.resultado.visita_id).toBe(segunda.body.visita.id);
    expect(resumen.body.resultado.fachada_id).toBe(fachada.body.fachada.id);

    const evidenciaSegundaRespuesta = await request(app.getHttpServer())
      .get(
        `/verificacion/integrantes/${integranteId}/visitas-vecino/${segunda.body.visita.id}/evidencias/resumen`,
      )
      .set('X-Crelealtad-Context', 'verificacion')
      .expect(200);
    expect(evidenciaSegundaRespuesta.body.evidencia).toBeNull();

    const rows = await dataSource.query(
      `SELECT
         conoce_y_sabe_donde_vive,
         fachada_id,
         ubicacion_latitud::double precision AS latitud,
         ubicacion_longitud::double precision AS longitud,
         ubicacion_precision_metros::double precision AS precision_metros,
         ubicacion_fuente
       FROM verificacion_visitas_vecino
       WHERE integrante_id=$1
       ORDER BY created_at ASC`,
      [integranteId],
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      conoce_y_sabe_donde_vive: true,
      fachada_id: fachada.body.fachada.id,
      latitud: 25.6866142,
      longitud: -100.3161127,
      precision_metros: 8.57,
      ubicacion_fuente: 'DISPOSITIVO',
    });

    const audits = await dataSource.query(
      `SELECT datos_despues
       FROM audit_log
       WHERE tabla='verificacion_visitas_vecino'
         AND registro_id IN (SELECT id FROM verificacion_visitas_vecino WHERE integrante_id=$1)`,
      [integranteId],
    );
    expect(audits).toHaveLength(2);
    expect(JSON.stringify(audits)).not.toContain('ubicacion_latitud');
    expect(JSON.stringify(audits)).not.toContain('ubicacion_longitud');

    const auditoriaFachada = await dataSource.query(
      `SELECT datos_despues
       FROM audit_log
       WHERE tabla='verificacion_visita_vecino_fachadas'
         AND registro_id=$1`,
      [fachada.body.fachada.id],
    );
    expect(auditoriaFachada).toHaveLength(1);
    expect(JSON.stringify(auditoriaFachada)).not.toContain('ubicacion_latitud');
    expect(JSON.stringify(auditoriaFachada)).not.toContain('ubicacion_longitud');

    const auditoriaEvidencia = await dataSource.query(
      `SELECT datos_despues
       FROM audit_log
       WHERE tabla='verificacion_visita_vecino_evidencias'
         AND registro_id=$1`,
      [evidencia.body.evidencia.id],
    );
    expect(auditoriaEvidencia).toHaveLength(1);
    expect(JSON.stringify(auditoriaEvidencia)).not.toContain('ubicacion_latitud');
    expect(JSON.stringify(auditoriaEvidencia)).not.toContain('ubicacion_longitud');
  });
});
