import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { mkdtemp, rm } from 'fs/promises';
import { join, resolve } from 'path';
import { tmpdir } from 'os';
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
  let testUserId: string;
  let storagePath: string;

  beforeAll(async () => {
    storagePath = resolve(await mkdtemp(join(tmpdir(), 'crelealtad-validacion-test-')));
    process.env.DOCUMENT_STORAGE_PATH = storagePath;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          username: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || process.env.DB_PASS,
          database: 'crelealtad_test',
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
    app.use((req: { user?: unknown }, _res: unknown, next: () => void) => {
      req.user = {
        id: testUserId,
        rol: { nombre: 'ASESOR' },
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
    const testUsers = await dataSource.query(
      'SELECT u.id FROM usuarios u JOIN empleados e ON e.usuario_id = u.id ORDER BY u.id LIMIT 1',
    );
    testUserId = testUsers[0].id;
  });

  beforeEach(async () => {
    // Crear datos inventados para cada test.
    const timestamp = Date.now().toString().slice(-6);

    const grupoRes = await request(app.getHttpServer())
      .post('/grupos')
      .send({
        nombre: `Grupo Test Validación ${timestamp}`,
      });
    grupoId = grupoRes.body.id;
    expedienteId = grupoRes.body.expedienteId;

    const integranteRes = await request(app.getHttpServer())
      .post('/integrantes')
      .send({
        expediente_id: expedienteId,
        nombres: 'Test',
        apellidoPaterno: 'Validación',
        apellidoMaterno: 'Completa',
      });
    integranteId = integranteRes.body.id;
    const personaResult = await dataSource.query(
      'SELECT persona_id FROM integrantes WHERE id = $1',
      [integranteId],
    );
    personaId = personaResult[0].persona_id;
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
        await dataSource.query('DELETE FROM expedientes WHERE grupo_id = $1', [grupoId]);
        await dataSource.query('DELETE FROM grupos WHERE id = $1', [grupoId]);
      }
    } catch (error) {
      throw error;
    }
  });

  afterAll(async () => {
    await app.close();
    await rm(storagePath, { recursive: true, force: true });
    delete process.env.DOCUMENT_STORAGE_PATH;
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
    expect(res.body.camposFaltantes['Paso 6']).toContain('Monto solicitado capturado');
    expect(res.body.camposFaltantes['Paso 7']).not.toContain('INE del beneficiario');
  });

  it('debe ACEPTAR SUJETA_CREDITO sin INE del beneficiario porque es opcional', async () => {
    // Llenar los 7 pasos
    await request(app.getHttpServer())
      .patch(`/solicitudes/integrante/${integranteId}`)
      .send({
        // Paso 1
        nombres: 'Carlos Miguel',
        apellido_pat: 'Validación',
        apellido_mat: 'Completa',
        telefono: '4611234567',
        curp: 'VACM900101HDFLRL01',
        fecha_nac: '1990-01-01',
        genero: 'Masculino',
        estado_civil: 'Soltero',
        ocupacion: 'Comerciante',
        nivel_estudio: 'Secundaria',
        nacionalidad: 'MEXICANA',
        estado_nacimiento: 'Guanajuato',
        // Paso 2
        dom_calle: 'Hidalgo',
        dom_num_ext: '123',
        dom_entre_calles: 'Juárez y Morelos',
        dom_colonia: 'Centro',
        dom_municipio: 'Pénjamo',
        dom_estado: 'Guanajuato',
        dom_codigo_postal: '36900',
        // Paso 3
        ref1_nombre: 'Juan',
        ref1_parentesco: 'Amigo',
        ref1_telefono: '4611111111',
        ref1_direccion: 'Reforma 10',
        ref2_nombre: 'Pedro',
        ref2_parentesco: 'Vecino',
        ref2_telefono: '4612222222',
        ref2_direccion: 'Allende 20',
        // Paso 4
        negocio_giro: 'Comercio',
        negocio_domicilio: 'Mercado municipal',
        negocio_num_ext: '4',
        negocio_colonia: 'Centro',
        negocio_municipio: 'Pénjamo',
        negocio_estado: 'Guanajuato',
        negocio_codigo_postal: '36900',
        negocio_desde_cuando: '5 años',
        negocio_ingreso_semanal: 1000,
        negocio_gastos: 300,
        negocio_total: 700,
        // Paso 5
        beneficiario_nombre: 'María',
        beneficiario_parentesco: 'Hija',
        beneficiario_telefono: '4613333333',
        beneficiario_direccion: 'Hidalgo 123',
        // Paso 6 (tiene_menos_70_anios se calcula automáticamente desde fecha_nac del paso 1)
        tiene_medidor_luz: 'SI',
        vive_max_5km_tesorera: 'SI',
        monto_solicitado: 18000,
      })
      .expect(HttpStatus.OK);

    const imagenJpeg = Buffer.from([0xff, 0xd8, 0xff, 0x01]);
    await request(app.getHttpServer())
      .post(`/solicitudes/integrante/${integranteId}/documentos/ine`)
      .attach('archivos', imagenJpeg, { filename: 'ine-frente.jpg', contentType: 'image/jpeg' })
      .attach('archivos', imagenJpeg, { filename: 'ine-reverso.jpg', contentType: 'image/jpeg' })
      .expect(HttpStatus.CREATED);

    for (const tipo of ['comprobante', 'solicitud_firmada']) {
      await request(app.getHttpServer())
        .post(`/solicitudes/integrante/${integranteId}/documentos/${tipo}`)
        .attach('archivos', imagenJpeg, { filename: `${tipo}.jpg`, contentType: 'image/jpeg' })
        .expect(HttpStatus.CREATED);
    }

    // Ahora debe permitir SUJETA_CREDITO
    const res = await request(app.getHttpServer())
      .patch(`/integrantes/${integranteId}/estado`)
      .send({ estado: 'SUJETA_CREDITO' })
      .expect(HttpStatus.OK);

    expect(res.body.estado).toBe('SUJETA_CREDITO');
  });

  it('rechaza campos financieros, relaciones y rutas documentales controlados por servidor', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/solicitudes/integrante/${integranteId}`)
      .send({
        persona_id: personaId,
        expediente_id: expedienteId,
        grupo_id: grupoId,
        ciclo_numero: 99,
        monto_autorizado: 999999,
        doc_ine_ruta: '/ruta/inventada.jpg',
      })
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body.message).toEqual(expect.arrayContaining([
      'property persona_id should not exist',
      'property expediente_id should not exist',
      'property grupo_id should not exist',
      'property ciclo_numero should not exist',
      'property monto_autorizado should not exist',
      'property doc_ine_ruta should not exist',
    ]));
  });

  it('rechaza enlazar una persona existente desde el alta pública de integrante', async () => {
    const res = await request(app.getHttpServer())
      .post('/integrantes')
      .send({
        expediente_id: expedienteId,
        nombres: 'Persona inventada',
        persona_id: personaId,
      })
      .expect(HttpStatus.BAD_REQUEST);

    expect(res.body.message).toContain('property persona_id should not exist');
  });
});
