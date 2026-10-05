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
import { VerificacionLlamadasModule } from './verificacion-llamadas.module';

describe('VerificacionLlamadas integración', () => {
  jest.setTimeout(30000);
  const usuarioId = randomUUID();
  const grupoId = randomUUID();
  const expedienteId = randomUUID();
  const integranteId = randomUUID();
  const personaId = randomUUID();
  let app: INestApplication;
  let dataSource: DataSource;
  let testActor: TestActorFixture;
  let storageRoot: string;

  beforeAll(async () => {
    storageRoot = await mkdtemp(join(tmpdir(), 'crelealtad-llamada-integration-'));
    process.env.VERIFICACION_STORAGE_PATH = storageRoot;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          username: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || process.env.DB_PASS,
          database: 'crelealtad_test',
          autoLoadEntities: true,
          synchronize: false,
        }),
        TypeOrmModule.forFeature([ExpedienteEntity, GrupoEntity, PersonaEntity]),
        VerificacionLlamadasModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use((req: { user?: unknown }, _res: unknown, next: () => void) => {
      req.user = { id: usuarioId };
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
      'GRUPO PRUEBA LLAMADAS',
    ]);
    await dataSource.query(
      'INSERT INTO expedientes (id, grupo_id, estado) VALUES ($1, $2, $3)',
      [expedienteId, grupoId, 'EN_VERIFICACION'],
    );
    await dataSource.query(
      `INSERT INTO personas (id, nombres, apellido_pat, telefono, telefono_secundario)
       VALUES ($1, $2, $3, $4, NULL)`,
      [personaId, 'PERSONA', 'PRUEBA', '8110000000'],
    );
    await dataSource.query(
      'INSERT INTO integrantes (id, expediente_id, persona_id, estado) VALUES ($1, $2, $3, $4)',
      [integranteId, expedienteId, personaId, 'SUJETA_CREDITO'],
    );
  });

  afterAll(async () => {
    if (!dataSource) {
      delete process.env.VERIFICACION_STORAGE_PATH;
      await rm(storageRoot, { recursive: true, force: true });
      return;
    }
    const encuestas = await dataSource.query(
      `SELECT encuesta.id
       FROM verificacion_llamada_encuestas encuesta
       JOIN verificacion_llamadas llamada ON llamada.id = encuesta.llamada_id
       WHERE llamada.integrante_id = $1`,
      [integranteId],
    );
    for (const encuesta of encuestas) {
      await dataSource.query(
        "DELETE FROM audit_log WHERE tabla='verificacion_llamada_encuestas' AND registro_id=$1",
        [encuesta.id],
      );
      await dataSource.query('DELETE FROM verificacion_llamada_evidencias WHERE encuesta_id=$1', [encuesta.id]);
      await dataSource.query('DELETE FROM verificacion_llamada_caracteristicas WHERE encuesta_id=$1', [encuesta.id]);
      await dataSource.query('DELETE FROM verificacion_llamada_encuestas WHERE id=$1', [encuesta.id]);
    }
    const confirmacionesTelefono = await dataSource.query(
      `SELECT id
       FROM verificacion_entrevista_telefono_confirmaciones
       WHERE integrante_id = $1`,
      [integranteId],
    );
    for (const confirmacion of confirmacionesTelefono) {
      await dataSource.query(
        "DELETE FROM audit_log WHERE tabla='verificacion_entrevista_telefono_confirmaciones' AND registro_id=$1",
        [confirmacion.id],
      );
    }
    await dataSource.query(
      'DELETE FROM verificacion_entrevista_telefono_confirmaciones WHERE integrante_id=$1',
      [integranteId],
    );
    const evidenciasTelefono = await dataSource.query(
      `SELECT evidencia.id
       FROM verificacion_llamada_evidencias evidencia
       JOIN verificacion_llamadas llamada ON llamada.id = evidencia.llamada_id
       WHERE llamada.integrante_id = $1`,
      [integranteId],
    );
    for (const evidencia of evidenciasTelefono) {
      await dataSource.query(
        "DELETE FROM audit_log WHERE tabla='verificacion_llamada_evidencias' AND registro_id=$1",
        [evidencia.id],
      );
    }
    await dataSource.query(
      `DELETE FROM verificacion_llamada_evidencias evidencia
       USING verificacion_llamadas llamada
       WHERE llamada.id = evidencia.llamada_id
         AND llamada.integrante_id = $1`,
      [integranteId],
    );
    await dataSource.query('DELETE FROM verificacion_llamadas WHERE integrante_id=$1', [integranteId]);
    await dataSource.query(
      "DELETE FROM audit_log WHERE tabla='personas' AND registro_id=$1",
      [personaId],
    );
    await dataSource.query('DELETE FROM integrantes WHERE id=$1', [integranteId]);
    await dataSource.query('DELETE FROM personas WHERE id=$1', [personaId]);
    await dataSource.query('DELETE FROM expedientes WHERE id=$1', [expedienteId]);
    await dataSource.query('DELETE FROM grupos WHERE id=$1', [grupoId]);
    await deleteTestActorFixture(dataSource, testActor);
    await app.close();
    delete process.env.VERIFICACION_STORAGE_PATH;
    await rm(storageRoot, { recursive: true, force: true });
  });

  it('rechaza WhatsApp antes de registrar la primera llamada telefónica', async () => {
    await request(app.getHttpServer())
      .post(`/verificacion/integrantes/${integranteId}/llamadas`)
      .send({
        canal: 'WHATSAPP',
        resultado: 'NO_CONTESTADA',
        idempotency_key: `call_whatsapp_inicial_${Date.now()}`,
        ubicacion_latitud: 25.686614238,
        ubicacion_longitud: -100.316112689,
        ubicacion_precision_metros: 8.567,
        ubicacion_capturada_at: '2026-09-21T18:43:00.000Z',
      })
      .expect(400);
  });

  it('guarda intento, encuesta, seis coincidencias y evidencia mediante multipart', async () => {
    const intento = await request(app.getHttpServer())
      .post(`/verificacion/integrantes/${integranteId}/llamadas`)
      .send({
        canal: 'TELEFONICA',
        resultado: 'CONTESTADA',
        tipo_telefono: 'PRINCIPAL',
        telefono: '8112345678',
        idempotency_key: `call_test_${Date.now()}`,
        ubicacion_latitud: 25.686614238,
        ubicacion_longitud: -100.316112689,
        ubicacion_precision_metros: 8.567,
        ubicacion_capturada_at: '2026-09-21T18:43:00.000Z',
      })
      .expect(201);

    const ubicacionGuardada = await dataSource.query(
      `SELECT
         ubicacion_latitud::double precision AS latitud,
         ubicacion_longitud::double precision AS longitud,
         ubicacion_precision_metros::double precision AS precision_metros,
         ubicacion_fuente
       FROM verificacion_llamadas
       WHERE id=$1`,
      [intento.body.llamada.id],
    );
    expect(ubicacionGuardada[0]).toEqual({
      latitud: 25.6866142,
      longitud: -100.3161127,
      precision_metros: 8.57,
      ubicacion_fuente: 'DISPOSITIVO',
    });

    const evidenciaPng = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
    ]);
    const encuesta = await request(app.getHttpServer())
      .post(`/verificacion/integrantes/${integranteId}/llamadas/${intento.body.llamada.id}/encuesta`)
      .field('identidad_coincide', 'SI')
      .field('domicilio_coincide', 'SI')
      .field('numero_plantas', 'SI')
      .field('color_domicilio', 'SI')
      .field('cochera_entrada', 'SI')
      .field('banqueta_frente', 'SI')
      .field('objeto_visible', 'SI')
      .field('referencia_exterior', 'SI')
      .field('accion_posterior', 'ENTREVISTA_CORTA')
      .attach('evidencia', evidenciaPng, {
        filename: 'evidencia.png',
        contentType: 'image/png',
      })
      .expect(201);

    expect(encuesta.body.encuesta.completada).toBe(true);
    expect(encuesta.body.resumen.proceso.completado).toBe(true);
    expect(encuesta.body.resumen.telefonos_confirmados.PRINCIPAL).toEqual(
      expect.objectContaining({ telefono: '8112345678' }),
    );

    const caracteristicas = await dataSource.query(
      'SELECT COUNT(*)::integer AS cantidad FROM verificacion_llamada_caracteristicas WHERE encuesta_id=$1',
      [encuesta.body.encuesta.id],
    );
    expect(caracteristicas[0].cantidad).toBe(6);

    const intentoGuardado = await dataSource.query(
      'SELECT tipo_telefono, telefono FROM verificacion_llamadas WHERE id=$1',
      [intento.body.llamada.id],
    );
    expect(intentoGuardado).toEqual([{
      tipo_telefono: 'PRINCIPAL',
      telefono: '8112345678',
    }]);
  });

  it('rechaza un resultado de llamada sin ubicación del dispositivo', async () => {
    await request(app.getHttpServer())
      .post(`/verificacion/integrantes/${integranteId}/llamadas`)
      .send({
        canal: 'WHATSAPP',
        resultado: 'NO_CONTESTADA',
        idempotency_key: `call_sin_ubicacion_${Date.now()}`,
      })
      .expect(400);
  });

  it('guarda la evidencia de una llamada contestada y confirma el teléfono sin encuesta', async () => {
    const intento = await request(app.getHttpServer())
      .post(`/verificacion/integrantes/${integranteId}/llamadas`)
      .send({
        canal: 'TELEFONICA',
        resultado: 'CONTESTADA',
        idempotency_key: `call_confirmacion_telefono_${Date.now()}`,
        ubicacion_latitud: 25.686614238,
        ubicacion_longitud: -100.316112689,
        ubicacion_precision_metros: 8.567,
        ubicacion_capturada_at: '2026-09-28T18:43:00.000Z',
      })
      .expect(201);

    const evidenciaPng = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
    ]);
    const respuesta = await request(app.getHttpServer())
      .post(
        `/verificacion/integrantes/${integranteId}/llamadas/${intento.body.llamada.id}/confirmacion-telefono`,
      )
      .field('tipo_telefono', 'SECUNDARIO')
      .field('telefono', '8112345678')
      .attach('evidencia', evidenciaPng, {
        filename: 'evidencia-confirmacion.png',
        contentType: 'image/png',
      })
      .expect(201);

    expect(respuesta.body.confirmacion).toEqual(expect.objectContaining({
      llamada_id: intento.body.llamada.id,
      tipo_telefono: 'SECUNDARIO',
      telefono: '8112345678',
    }));
    expect(respuesta.body.resumen.telefonos_confirmados.SECUNDARIO).toEqual(
      expect.objectContaining({ telefono: '8112345678' }),
    );
    expect(respuesta.body.resumen.proceso.completado).toBe(true);

    const guardada = await dataSource.query(
      `SELECT tipo_telefono, telefono, mime_type
       FROM verificacion_entrevista_telefono_confirmaciones
       WHERE llamada_id = $1`,
      [intento.body.llamada.id],
    );
    expect(guardada).toEqual([{
      tipo_telefono: 'SECUNDARIO',
      telefono: '8112345678',
      mime_type: 'image/png',
    }]);

    const personaActualizada = await dataSource.query(
      'SELECT telefono, telefono_secundario FROM personas WHERE id=$1',
      [personaId],
    );
    expect(personaActualizada).toEqual([{
      telefono: '8110000000',
      telefono_secundario: '8112345678',
    }]);

    await request(app.getHttpServer())
      .get(
        `/verificacion/integrantes/${integranteId}/llamadas/${intento.body.llamada.id}/confirmacion-telefono/evidencia`,
      )
      .expect('Content-Type', /image\/png/)
      .expect(200);

    await request(app.getHttpServer())
      .get(
        `/verificacion/integrantes/${integranteId}/llamadas/${intento.body.llamada.id}/confirmacion-telefono/evidencia-actual`,
      )
      .expect('Content-Type', /image\/png/)
      .expect(200);

    const reemplazoJpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
    const reemplazo = await request(app.getHttpServer())
      .post(
        `/verificacion/integrantes/${integranteId}/llamadas/${intento.body.llamada.id}/confirmacion-telefono/reemplazo-evidencia`,
      )
      .field('tipo_telefono', 'SECUNDARIO')
      .field('telefono', '8112345678')
      .attach('evidencia', reemplazoJpeg, {
        filename: 'evidencia-reemplazo.jpg',
        contentType: 'image/jpeg',
      })
      .expect(201);

    expect(reemplazo.body.evidencia.version).toBe(2);
    const versiones = await dataSource.query(
      `SELECT version, mime_type
       FROM verificacion_llamada_evidencias
       WHERE llamada_id = $1
         AND proposito = 'CONFIRMACION_TELEFONO'
       ORDER BY version`,
      [intento.body.llamada.id],
    );
    expect(versiones).toEqual([
      { version: 1, mime_type: 'image/png' },
      { version: 2, mime_type: 'image/jpeg' },
    ]);

    await request(app.getHttpServer())
      .get(
        `/verificacion/integrantes/${integranteId}/llamadas/${intento.body.llamada.id}/confirmacion-telefono/evidencia-actual`,
      )
      .expect('Content-Type', /image\/jpeg/)
      .expect(200);
  });
});
