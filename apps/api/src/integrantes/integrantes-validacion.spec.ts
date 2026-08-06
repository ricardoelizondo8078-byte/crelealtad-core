import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { IntegrantesModule } from './integrantes.module';
import { SolicitudesModule } from '../solicitudes/solicitudes.module';
import { ExpedientesModule } from '../expedientes/expedientes.module';
import { GruposModule } from '../grupos/grupos.module';

describe('Integrantes - Validación de Solicitud Completa', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let grupoId: string;
  let expedienteId: string;
  let personaId: string;
  let integranteId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          username: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASS,
          database: process.env.DB_NAME || 'crelealtad_test',
          autoLoadEntities: true,
          synchronize: false,
        }),
        GruposModule,
        ExpedientesModule,
        IntegrantesModule,
        SolicitudesModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  beforeEach(async () => {
    // Crear datos de prueba para cada test (CURP único con timestamp)
    const timestamp = Date.now().toString().slice(-6);
    const curpUnico = `VAL${timestamp}HDFLRL01`;

    const grupoRes = await request(app.getHttpServer())
      .post('/grupos')
      .send({
        nombre: `Grupo Test Validación ${timestamp}`,
      });
    grupoId = grupoRes.body.id;

    const expedienteRes = await request(app.getHttpServer())
      .post('/expedientes')
      .send({ grupo_id: grupoId });
    expedienteId = expedienteRes.body.id;

    const personaResult = await dataSource.query(
      `INSERT INTO personas (nombres, apellido_pat, apellido_mat, curp, fecha_nac)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['Test', 'Validación', 'Completa', curpUnico, '1990-01-01']
    );
    personaId = personaResult[0].id;

    const integranteRes = await request(app.getHttpServer())
      .post('/integrantes')
      .send({
        expediente_id: expedienteId,
        persona_id: personaId,
      });
    integranteId = integranteRes.body.id;
  });

  afterEach(async () => {
    // Cleanup después de cada test
    try {
      if (integranteId) {
        await dataSource.query('DELETE FROM solicitudes WHERE integrante_id = $1', [integranteId]);
        await dataSource.query('DELETE FROM integrantes WHERE id = $1', [integranteId]);
      }
      if (personaId) {
        await dataSource.query('DELETE FROM personas WHERE id = $1', [personaId]);
      }
      if (expedienteId) {
        await dataSource.query('DELETE FROM expedientes WHERE id = $1', [expedienteId]);
      }
      if (grupoId) {
        await dataSource.query('DELETE FROM grupos WHERE id = $1', [grupoId]);
      }
    } catch (e) {
      console.error('Error en cleanup afterEach:', e.message);
    }
  });

  afterAll(async () => {
    // Cleanup final de cualquier dato residual
    try {
      await dataSource.query(`DELETE FROM solicitudes WHERE integrante_id IN (SELECT id FROM integrantes WHERE persona_id IN (SELECT id FROM personas WHERE curp LIKE 'VAL%'))`);
      await dataSource.query(`DELETE FROM integrantes WHERE persona_id IN (SELECT id FROM personas WHERE curp LIKE 'VAL%')`);
      await dataSource.query(`DELETE FROM expedientes WHERE nombre LIKE '%Test Validación%'`);
      await dataSource.query(`DELETE FROM grupos WHERE nombre LIKE '%Test Validación%'`);
      await dataSource.query(`DELETE FROM personas WHERE curp LIKE 'VAL%'`);
    } catch (e) {
      console.error('Error en cleanup afterAll:', e.message);
    }
    await app.close();
  });

  it('debe RECHAZAR SUJETA_CREDITO con solicitud vacía', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/integrantes/${integranteId}/estado`)
      .send({ estado: 'SUJETA_CREDITO' })
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body.message).toBe('Solicitud incompleta');
    expect(res.body.pasosIncompletos).toContain('Paso 1: Datos Personales');
    expect(res.body.pasosIncompletos).toContain('Paso 2: Domicilio');
    expect(res.body.pasosIncompletos).toContain('Paso 3: Referencias');
    expect(res.body.pasosIncompletos).toContain('Paso 4: Negocio');
    expect(res.body.pasosIncompletos).toContain('Paso 5: Beneficiario');
    expect(res.body.pasosIncompletos).toContain('Paso 6: Validaciones');
    expect(res.body.pasosIncompletos).toContain('Paso 7: Documentos');
    // Ahora devuelve etiquetas legibles en español, no nombres de columna
    expect(res.body.camposFaltantes['Paso 1']).toContain('Nombre(s) de pila');
    expect(res.body.camposFaltantes['Paso 1']).toContain('CURP');
    expect(res.body.camposFaltantes['Paso 1']).toContain('Fecha de nacimiento');
    expect(res.body.camposFaltantes['Paso 1']).toContain('Género');
  });

  it('debe ACEPTAR SUJETA_CREDITO con solicitud completa', async () => {
    // Llenar los 7 pasos
    await request(app.getHttpServer())
      .patch(`/solicitudes/integrante/${integranteId}`)
      .send({
        integrante_id: integranteId,
        persona_id: personaId,
        expediente_id: expedienteId,
        grupo_id: grupoId,
        // Paso 1
        nombres: 'Carlos Miguel',
        curp: 'VACM900101HDFLRL01',
        fecha_nac: '1990-01-01',
        genero: 'Masculino',
        // Paso 2
        dom_calle: 'Hidalgo',
        dom_colonia: 'Centro',
        dom_municipio: 'Pénjamo',
        // Paso 3
        ref1_nombre: 'Juan',
        ref2_nombre: 'Pedro',
        // Paso 4
        negocio_giro: 'Comercio',
        negocio_ingreso_semanal: 1000,
        // Paso 5
        beneficiario_nombre: 'María',
        beneficiario_parentesco: 'Hija',
        // Paso 6 (tiene_menos_70_anios se calcula automáticamente desde fecha_nac del paso 1)
        tiene_medidor_luz: 'SI',
        vive_max_5km_tesorera: 'SI',
        // Paso 7
        doc_ine_ruta: '/ine.jpg',
        doc_comprobante_ruta: '/comp.pdf',
        doc_ine_beneficiario_ruta: '/ine_ben.jpg',
        doc_solicitud_firmada_ruta: '/sol.pdf',
      });

    // Ahora debe permitir SUJETA_CREDITO
    const res = await request(app.getHttpServer())
      .patch(`/integrantes/${integranteId}/estado`)
      .send({ estado: 'SUJETA_CREDITO' })
      .expect(HttpStatus.OK);

    expect(res.body.estado).toBe('SUJETA_CREDITO');
  });
});
