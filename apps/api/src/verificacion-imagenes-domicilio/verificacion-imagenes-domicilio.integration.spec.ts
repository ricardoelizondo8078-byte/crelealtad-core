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
import { VerificacionImagenesDomicilioModule } from './verificacion-imagenes-domicilio.module';

describe('VerificacionImagenesDomicilio integración', () => {
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
    storageRoot = await mkdtemp(join(tmpdir(), 'crelealtad-imagenes-domicilio-integration-'));
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
        VerificacionImagenesDomicilioModule,
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
      'GRUPO PRUEBA IMAGENES DOMICILIO',
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
      "DELETE FROM audit_log WHERE tabla='verificacion_medidor_luz_respuestas' AND registro_id IN (SELECT id FROM verificacion_medidor_luz_respuestas WHERE integrante_id=$1)",
      [integranteId],
    );
    await dataSource.query(
      "DELETE FROM audit_log WHERE tabla='verificacion_imagenes_domicilio' AND registro_id IN (SELECT id FROM verificacion_imagenes_domicilio WHERE integrante_id=$1)",
      [integranteId],
    );
    await dataSource.query(
      'DELETE FROM verificacion_medidor_luz_respuestas WHERE integrante_id=$1',
      [integranteId],
    );
    await dataSource.query(
      'DELETE FROM verificacion_imagenes_domicilio WHERE integrante_id=$1',
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

  it('exige confirmar que existe medidor antes de su foto y conserva el cierre en servidor', async () => {
    const foto = Buffer.from([0xff, 0xd8, 0xff, 0x01, 0x02]);

    await request(app.getHttpServer())
      .post(`/verificacion/integrantes/${integranteId}/imagenes-domicilio`)
      .set('X-Crelealtad-Context', 'verificacion')
      .field('tipo', 'FACHADA')
      .field('idempotency_key', `home_image_sin_foto_${Date.now()}`)
      .field('foto_capturada_at', '2026-09-22T18:42:58.000Z')
      .field('ubicacion_latitud', '25.686614238')
      .field('ubicacion_longitud', '-100.316112689')
      .field('ubicacion_capturada_at', '2026-09-22T18:43:00.000Z')
      .expect(400);

    const opcional = await request(app.getHttpServer())
      .post(`/verificacion/integrantes/${integranteId}/imagenes-domicilio`)
      .set('X-Crelealtad-Context', 'verificacion')
      .field('tipo', 'FACHADA_CON_INTEGRANTE')
      .field('idempotency_key', `home_image_member_${Date.now()}`)
      .field('foto_capturada_at', '2026-09-22T18:41:58.000Z')
      .field('ubicacion_latitud', '25.686600018')
      .field('ubicacion_longitud', '-100.316100019')
      .field('ubicacion_capturada_at', '2026-09-22T18:42:00.000Z')
      .attach('foto', foto, { filename: 'fachada-integrante.jpg', contentType: 'image/jpeg' })
      .expect(201);
    expect(opcional.body.resumen.proceso.puede_terminar).toBe(false);
    expect(opcional.body.resumen.imagenes.FACHADA).toBeNull();

    const fachadaKey = `home_image_facade_${Date.now()}`;
    const fachada = await request(app.getHttpServer())
      .post(`/verificacion/integrantes/${integranteId}/imagenes-domicilio`)
      .set('X-Crelealtad-Context', 'verificacion')
      .field('tipo', 'FACHADA')
      .field('idempotency_key', fachadaKey)
      .field('foto_capturada_at', '2026-09-22T18:42:58.000Z')
      .field('ubicacion_latitud', '25.686614238')
      .field('ubicacion_longitud', '-100.316112689')
      .field('ubicacion_precision_metros', '8.567')
      .field('ubicacion_capturada_at', '2026-09-22T18:43:00.000Z')
      .attach('foto', foto, { filename: 'fachada.jpg', contentType: 'image/jpeg' })
      .expect(201);

    expect(fachada.body.imagen.tipo).toBe('FACHADA');
    expect(fachada.body.resumen.proceso.puede_terminar).toBe(false);
    expect(fachada.body.resumen.imagenes.NOMENCLATURAS_CALLES).toBeNull();
    expect(fachada.body.resumen.imagenes.MEDIDOR_LUZ).toBeNull();
    expect(fachada.body.resumen.imagenes.FACHADA_CON_INTEGRANTE.id).toBe(
      opcional.body.imagen.id,
    );

    await request(app.getHttpServer())
      .post(`/verificacion/integrantes/${integranteId}/imagenes-domicilio`)
      .set('X-Crelealtad-Context', 'verificacion')
      .field('tipo', 'MEDIDOR_LUZ')
      .field('idempotency_key', `home_image_meter_blocked_${Date.now()}`)
      .field('foto_capturada_at', '2026-09-22T18:43:58.000Z')
      .field('ubicacion_latitud', '25.686620018')
      .field('ubicacion_longitud', '-100.316120019')
      .field('ubicacion_capturada_at', '2026-09-22T18:44:00.000Z')
      .attach('foto', foto, { filename: 'medidor-bloqueado.jpg', contentType: 'image/jpeg' })
      .expect(400);

    const respuestaMedidor = await request(app.getHttpServer())
      .post(`/verificacion/integrantes/${integranteId}/imagenes-domicilio/medidor-luz/respuesta`)
      .set('X-Crelealtad-Context', 'verificacion')
      .send({
        fachada_id: fachada.body.imagen.id,
        tiene_medidor: true,
        idempotency_key: `meter_answer_yes_${Date.now()}`,
      })
      .expect(201);
    expect(respuestaMedidor.body.respuesta.tiene_medidor).toBe(true);
    expect(respuestaMedidor.body.respuesta.motivo).toBeNull();
    expect(respuestaMedidor.body.resumen.proceso.puede_terminar).toBe(false);

    const medidor = await request(app.getHttpServer())
      .post(`/verificacion/integrantes/${integranteId}/imagenes-domicilio`)
      .set('X-Crelealtad-Context', 'verificacion')
      .field('tipo', 'MEDIDOR_LUZ')
      .field('idempotency_key', `home_image_meter_${Date.now()}`)
      .field('foto_capturada_at', '2026-09-22T18:43:58.000Z')
      .field('ubicacion_latitud', '25.686620018')
      .field('ubicacion_longitud', '-100.316120019')
      .field('ubicacion_precision_metros', '7.234')
      .field('ubicacion_capturada_at', '2026-09-22T18:44:00.000Z')
      .attach('foto', foto, { filename: 'medidor-luz.jpg', contentType: 'image/jpeg' })
      .expect(201);

    expect(medidor.body.imagen.tipo).toBe('MEDIDOR_LUZ');
    expect(medidor.body.resumen.proceso.puede_terminar).toBe(true);
    expect(medidor.body.resumen.imagenes.FACHADA.id).toBe(fachada.body.imagen.id);

    const fachadaRepetida = await request(app.getHttpServer())
      .post(`/verificacion/integrantes/${integranteId}/imagenes-domicilio`)
      .set('X-Crelealtad-Context', 'verificacion')
      .field('tipo', 'FACHADA')
      .field('idempotency_key', fachadaKey)
      .field('foto_capturada_at', '2026-09-22T18:42:58.000Z')
      .field('ubicacion_latitud', '25.686614238')
      .field('ubicacion_longitud', '-100.316112689')
      .field('ubicacion_precision_metros', '8.567')
      .field('ubicacion_capturada_at', '2026-09-22T18:43:00.000Z')
      .attach('foto', foto, { filename: 'fachada.jpg', contentType: 'image/jpeg' })
      .expect(201);
    expect(fachadaRepetida.body.imagen.id).toBe(fachada.body.imagen.id);

    const resumen = await request(app.getHttpServer())
      .get(`/verificacion/integrantes/${integranteId}/imagenes-domicilio/resumen`)
      .set('X-Crelealtad-Context', 'verificacion')
      .expect(200);
    expect(resumen.body.proceso.puede_terminar).toBe(true);
    expect(resumen.body.imagenes.NOMENCLATURAS_CALLES).toBeNull();
    expect(resumen.body.imagenes.MEDIDOR_LUZ.id).toBe(medidor.body.imagen.id);
    expect(resumen.body.imagenes.FACHADA_CON_INTEGRANTE.id).toBe(opcional.body.imagen.id);
    expect(JSON.stringify(resumen.body)).not.toContain('ubicacion_latitud');
    expect(JSON.stringify(resumen.body)).not.toContain('registrada_por');

    await request(app.getHttpServer())
      .get(`/verificacion/integrantes/${integranteId}/imagenes-domicilio/${fachada.body.imagen.id}/archivo`)
      .set('X-Crelealtad-Context', 'verificacion')
      .expect('Content-Type', /image\/jpeg/)
      .expect(200);

    const filas = await dataSource.query(
      `SELECT
         tipo,
         registrada_por,
         ubicacion_latitud::double precision AS latitud,
         ubicacion_longitud::double precision AS longitud,
         ubicacion_precision_metros::double precision AS precision_metros,
         ubicacion_fuente
       FROM verificacion_imagenes_domicilio
       WHERE integrante_id=$1
       ORDER BY created_at ASC`,
      [integranteId],
    );
    expect(filas).toHaveLength(3);
    expect(filas).toContainEqual({
      tipo: 'FACHADA',
      registrada_por: usuarioId,
      latitud: 25.6866142,
      longitud: -100.3161127,
      precision_metros: 8.57,
      ubicacion_fuente: 'DISPOSITIVO',
    });
    expect(filas).toContainEqual({
      tipo: 'MEDIDOR_LUZ',
      registrada_por: usuarioId,
      latitud: 25.68662,
      longitud: -100.3161200,
      precision_metros: 7.23,
      ubicacion_fuente: 'DISPOSITIVO',
    });

    const auditorias = await dataSource.query(
      `SELECT datos_despues
       FROM audit_log
       WHERE tabla='verificacion_imagenes_domicilio'
         AND registro_id IN (SELECT id FROM verificacion_imagenes_domicilio WHERE integrante_id=$1)`,
      [integranteId],
    );
    expect(auditorias).toHaveLength(3);
    expect(JSON.stringify(auditorias)).not.toContain('ubicacion_latitud');
    expect(JSON.stringify(auditorias)).not.toContain('ubicacion_longitud');

    const respuestas = await dataSource.query(
      `SELECT tiene_medidor, motivo, fachada_id, registrada_por
       FROM verificacion_medidor_luz_respuestas
       WHERE integrante_id=$1`,
      [integranteId],
    );
    expect(respuestas).toEqual([{
      tiene_medidor: true,
      motivo: null,
      fachada_id: fachada.body.imagen.id,
      registrada_por: usuarioId,
    }]);

    const nuevaFachada = await request(app.getHttpServer())
      .post(`/verificacion/integrantes/${integranteId}/imagenes-domicilio`)
      .set('X-Crelealtad-Context', 'verificacion')
      .field('tipo', 'FACHADA')
      .field('idempotency_key', `home_image_facade_no_meter_${Date.now()}`)
      .field('foto_capturada_at', '2026-10-03T20:10:00.000Z')
      .field('ubicacion_latitud', '25.686614238')
      .field('ubicacion_longitud', '-100.316112689')
      .field('ubicacion_capturada_at', '2026-10-03T20:10:02.000Z')
      .attach('foto', foto, { filename: 'fachada-sin-medidor.jpg', contentType: 'image/jpeg' })
      .expect(201);
    expect(nuevaFachada.body.resumen.medidor_luz).toBeNull();
    expect(nuevaFachada.body.resumen.proceso.puede_terminar).toBe(false);

    await request(app.getHttpServer())
      .post(`/verificacion/integrantes/${integranteId}/imagenes-domicilio/medidor-luz/respuesta`)
      .set('X-Crelealtad-Context', 'verificacion')
      .send({
        fachada_id: nuevaFachada.body.imagen.id,
        tiene_medidor: false,
        idempotency_key: `meter_answer_without_reason_${Date.now()}`,
      })
      .expect(400);

    const respuestaSinMedidor = await request(app.getHttpServer())
      .post(`/verificacion/integrantes/${integranteId}/imagenes-domicilio/medidor-luz/respuesta`)
      .set('X-Crelealtad-Context', 'verificacion')
      .send({
        fachada_id: nuevaFachada.body.imagen.id,
        tiene_medidor: false,
        motivo: 'MEDIDOR_RETIRADO_O_PENDIENTE',
        idempotency_key: `meter_answer_no_${Date.now()}`,
      })
      .expect(201);
    expect(respuestaSinMedidor.body.respuesta).toEqual(expect.objectContaining({
      fachada_id: nuevaFachada.body.imagen.id,
      tiene_medidor: false,
      motivo: 'MEDIDOR_RETIRADO_O_PENDIENTE',
      fuente: 'RESPUESTA',
    }));
    expect(respuestaSinMedidor.body.resumen.proceso.puede_terminar).toBe(true);

    const resumenSinMedidor = await request(app.getHttpServer())
      .get(`/verificacion/integrantes/${integranteId}/imagenes-domicilio/resumen`)
      .set('X-Crelealtad-Context', 'verificacion')
      .expect(200);
    expect(resumenSinMedidor.body.medidor_luz.motivo).toBe(
      'MEDIDOR_RETIRADO_O_PENDIENTE',
    );
    expect(resumenSinMedidor.body.proceso.puede_terminar).toBe(true);
  });
});
