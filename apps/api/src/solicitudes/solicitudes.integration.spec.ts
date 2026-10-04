import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { mkdtemp, rm } from 'fs/promises';
import { join, resolve } from 'path';
import { tmpdir } from 'os';
import { SolicitudesModule } from './solicitudes.module';
import { IntegrantesModule } from '../integrantes/integrantes.module';
import { ExpedientesModule } from '../expedientes/expedientes.module';
import { GruposModule } from '../grupos/grupos.module';
import { MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST } from '../common/files/upload-file.policy';

describe('Solicitudes Integration - Wizard 7 pasos', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let grupoId: string;
  let expedienteId: string;
  let personaId: string;
  let integranteId: string;
  let testUserId: string;
  let storagePath: string;

  beforeAll(async () => {
    storagePath = resolve(await mkdtemp(join(tmpdir(), 'crelealtad-solicitudes-test-')));
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
          synchronize: false, // NO auto-sincronizar - usamos migraciones reales
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

  afterAll(async () => {
    try {
      if (integranteId) {
        const solicitudes = await dataSource.query(
          'SELECT id FROM solicitudes WHERE integrante_id = $1',
          [integranteId],
        );
        for (const solicitud of solicitudes) {
          for (const tabla of [
            'solicitudes_documentos',
            'solicitudes_validaciones',
            'solicitudes_beneficiarios',
            'solicitudes_referencias',
            'solicitudes_negocios',
            'solicitudes_domicilios',
            'solicitudes_datos_personales',
          ]) {
            await dataSource.query(`DELETE FROM ${tabla} WHERE solicitud_id = $1`, [solicitud.id]);
          }
        }
        await dataSource.query('DELETE FROM solicitudes WHERE integrante_id = $1', [integranteId]);
        await dataSource.query('DELETE FROM integrantes WHERE id = $1', [integranteId]);
      }
      if (personaId) await dataSource.query('DELETE FROM personas WHERE id = $1', [personaId]);
      if (grupoId) {
        await dataSource.query('DELETE FROM expedientes WHERE grupo_id = $1', [grupoId]);
        await dataSource.query('DELETE FROM grupos WHERE id = $1', [grupoId]);
      } else if (expedienteId) {
        await dataSource.query('DELETE FROM expedientes WHERE id = $1', [expedienteId]);
      }
    } catch (error) {
      throw error;
    }

    await app.close();
    await rm(storagePath, { recursive: true, force: true });
    delete process.env.DOCUMENT_STORAGE_PATH;
  });

  it('CICLO COMPLETO: Crear grupo -> expediente -> persona -> integrante -> 7 pasos wizard -> verificar persistencia', async () => {
    // ====================================================================
    // SETUP: Crear grupo, expediente, persona e integrante
    // ====================================================================

    // 1. Crear grupo
    const grupoRes = await request(app.getHttpServer())
      .post('/grupos')
      .send({
        nombre: 'Grupo Test Wizard',
      })
      .expect(201);

    grupoId = grupoRes.body.id;
    expect(grupoId).toBeDefined();

    // 2. El grupo nace con su expediente operativo en la misma transacción.
    expedienteId = grupoRes.body.expedienteId;
    expect(expedienteId).toBeDefined();

    // 3. Crear integrante. La API crea una persona nueva y no acepta enlazar
    // un persona_id arbitrario desde el cliente.
    const integranteRes = await request(app.getHttpServer())
      .post('/integrantes')
      .send({
        expediente_id: expedienteId,
        nombres: 'María Elena',
        apellidoPaterno: 'González',
        apellidoMaterno: 'Ruiz',
      })
      .expect(201);

    integranteId = integranteRes.body.id;
    const personaResult = await dataSource.query(
      'SELECT persona_id FROM integrantes WHERE id = $1',
      [integranteId],
    );
    personaId = personaResult[0].persona_id;
    expect(personaId).toBeDefined();
    expect(integranteId).toBeDefined();
    expect(integranteRes.body.estado).toBe('DOCUMENTANDO');

    // ====================================================================
    // PASO 1: Datos Personales
    // ====================================================================

    await request(app.getHttpServer())
      .patch(`/solicitudes/integrante/${integranteId}`)
      .send({
        // Tabla solicitudes_datos_personales
        nombres: 'María Elena',
        apellido_pat: 'González',
        apellido_mat: 'Ruiz',
        curp: 'GORM850615MDFNZR09',
        fecha_nac: '1985-06-15',
        genero: 'Femenino',
        nacionalidad: 'Mexicana',
        estado_nacimiento: 'Guanajuato',
        estado_civil: 'Casada',
        ocupacion: 'Comerciante',
        nivel_estudio: 'Primaria',
        telefono: '4611234567',
      })
      .expect(200);

    // Verificar persistencia en solicitudes_datos_personales
    const datosPersonales = await dataSource.query(
      'SELECT * FROM solicitudes_datos_personales WHERE solicitud_id IN (SELECT id FROM solicitudes WHERE integrante_id = $1)',
      [integranteId]
    );
    expect(datosPersonales).toHaveLength(1);
    expect(datosPersonales[0].curp).toBe('GORM850615MDFNZR09');
    expect(datosPersonales[0].genero).toBe('Femenino');
    expect(datosPersonales[0].nivel_estudio).toBe('Primaria');

    // ====================================================================
    // PASO 2: Domicilio
    // ====================================================================

    await request(app.getHttpServer())
      .patch(`/solicitudes/integrante/${integranteId}`)
      .send({
        // Tabla solicitudes_domicilios
        dom_calle: 'Hidalgo',
        dom_num_ext: '123',
        dom_num_int: 'A',
        dom_entre_calles: 'Juárez y Morelos',
        dom_colonia: 'Centro',
        dom_municipio: 'Pénjamo',
        dom_estado: 'Guanajuato',
        dom_codigo_postal: '36900',
        dom_telefono: '4611234567',
      })
      .expect(200);

    // Verificar persistencia en solicitudes_domicilios
    const domicilio = await dataSource.query(
      'SELECT * FROM solicitudes_domicilios WHERE solicitud_id IN (SELECT id FROM solicitudes WHERE integrante_id = $1)',
      [integranteId]
    );
    expect(domicilio).toHaveLength(1);
    expect(domicilio[0].dom_calle).toBe('Hidalgo');
    expect(domicilio[0].dom_num_ext).toBe('123');
    expect(domicilio[0].dom_entre_calles).toBe('Juárez y Morelos');
    expect(domicilio[0].dom_codigo_postal).toBe('36900');

    // ====================================================================
    // PASO 3: Referencias
    // ====================================================================

    await request(app.getHttpServer())
      .patch(`/solicitudes/integrante/${integranteId}`)
      .send({
        // Tabla solicitudes_referencias
        ref1_nombre: 'Juan Pérez',
        ref1_parentesco: 'Hermano',
        ref1_telefono: '4619876543',
        ref1_direccion: 'Calle Reforma 45, Pénjamo',
        ref2_nombre: 'Ana López',
        ref2_parentesco: 'Amiga',
        ref2_telefono: '4611112222',
        ref2_direccion: 'Calle Independencia 78, Pénjamo',
        pareja_nombre: 'Carlos González',
        pareja_actividad: 'Albañil',
        pareja_ingreso_semanal: 1500.00,
      })
      .expect(200);

    // Verificar persistencia en solicitudes_referencias
    const referencias = await dataSource.query(
      'SELECT * FROM solicitudes_referencias WHERE solicitud_id IN (SELECT id FROM solicitudes WHERE integrante_id = $1)',
      [integranteId]
    );
    expect(referencias).toHaveLength(1);
    expect(referencias[0].ref1_nombre).toBe('Juan Pérez');
    expect(referencias[0].ref1_direccion).toBe('Calle Reforma 45, Pénjamo');
    expect(referencias[0].pareja_nombre).toBe('Carlos González');
    expect(parseFloat(referencias[0].pareja_ingreso_semanal)).toBe(1500.00);

    // ====================================================================
    // PASO 4: Negocio
    // ====================================================================

    await request(app.getHttpServer())
      .patch(`/solicitudes/integrante/${integranteId}`)
      .send({
        // Tabla solicitudes_negocios
        negocio_giro: 'Venta de ropa',
        negocio_domicilio: 'Mercado Municipal Local 15',
        negocio_colonia: 'Centro',
        negocio_municipio: 'Pénjamo',
        negocio_estado: 'Guanajuato',
        negocio_codigo_postal: '36900',
        negocio_num_ext: '15',
        negocio_desde_cuando: '5 años',
        negocio_ingreso_semanal: 3000.00,
        negocio_otros_ingresos: 500.00,
        negocio_gastos: 1200.00,
        negocio_total: 2300.00,
      })
      .expect(200);

    // Verificar persistencia en solicitudes_negocios
    const negocio = await dataSource.query(
      'SELECT * FROM solicitudes_negocios WHERE solicitud_id IN (SELECT id FROM solicitudes WHERE integrante_id = $1)',
      [integranteId]
    );
    expect(negocio).toHaveLength(1);
    expect(negocio[0].negocio_giro).toBe('Venta de ropa');
    expect(negocio[0].negocio_desde_cuando).toBe('5 años');
    expect(parseFloat(negocio[0].negocio_ingreso_semanal)).toBe(3000.00);
    expect(parseFloat(negocio[0].negocio_total)).toBe(2300.00);

    // ====================================================================
    // PASO 5: Beneficiario
    // ====================================================================

    await request(app.getHttpServer())
      .patch(`/solicitudes/integrante/${integranteId}`)
      .send({
        // Tabla solicitudes_beneficiarios
        beneficiario_nombre: 'Luis González Ruiz',
        beneficiario_parentesco: 'Hijo',
        beneficiario_telefono: '4619998877',
        beneficiario_direccion: 'Hidalgo 123, Pénjamo',
      })
      .expect(200);

    // Verificar persistencia en solicitudes_beneficiarios
    const beneficiario = await dataSource.query(
      'SELECT * FROM solicitudes_beneficiarios WHERE solicitud_id IN (SELECT id FROM solicitudes WHERE integrante_id = $1)',
      [integranteId]
    );
    expect(beneficiario).toHaveLength(1);
    expect(beneficiario[0].beneficiario_nombre).toBe('Luis González Ruiz');
    expect(beneficiario[0].beneficiario_direccion).toBe('Hidalgo 123, Pénjamo');

    // ====================================================================
    // PASO 6: Validaciones
    // ====================================================================

    const montoAntesDelIntentoInvalido = await dataSource.query(
      'SELECT monto_solicitado FROM solicitudes WHERE integrante_id = $1',
      [integranteId],
    );

    await request(app.getHttpServer())
      .patch(`/solicitudes/integrante/${integranteId}`)
      .send({ monto_solicitado: 110000 })
      .expect(400)
      .expect(({ body }) => {
        expect(body.message).toContain('no puede exceder $100,000');
      });

    const montoDespuesDelIntentoInvalido = await dataSource.query(
      'SELECT monto_solicitado FROM solicitudes WHERE integrante_id = $1',
      [integranteId],
    );
    expect(montoDespuesDelIntentoInvalido[0]?.monto_solicitado ?? null).toBe(
      montoAntesDelIntentoInvalido[0]?.monto_solicitado ?? null,
    );

    await request(app.getHttpServer())
      .patch(`/solicitudes/integrante/${integranteId}`)
      .send({
        // Tabla solicitudes_validaciones
        tiene_medidor_luz: 'SI',
        vive_max_5km_tesorera: 'SI',
        monto_solicitado: 18000,
      })
      .expect(200);

    // Verificar persistencia en solicitudes_validaciones
    const validaciones = await dataSource.query(
      'SELECT * FROM solicitudes_validaciones WHERE solicitud_id IN (SELECT id FROM solicitudes WHERE integrante_id = $1)',
      [integranteId]
    );
    expect(validaciones).toHaveLength(1);
    expect(validaciones[0].tiene_medidor_luz).toBe('SI');
    expect(validaciones[0].vive_max_5km_tesorera).toBe('SI');

    // ====================================================================
    // PASO 7: Documentos
    // ====================================================================

    const imagenJpeg = Buffer.from([0xff, 0xd8, 0xff, 0x01]);
    const rutasDocumentos: Record<string, string> = {};
    const ineRes = await request(app.getHttpServer())
      .post(`/solicitudes/integrante/${integranteId}/documentos/ine`)
      .attach('archivos', imagenJpeg, { filename: 'ine-frente.jpg', contentType: 'image/jpeg' })
      .attach('archivos', imagenJpeg, { filename: 'ine-reverso.jpg', contentType: 'image/jpeg' })
      .expect(201);
    rutasDocumentos.ine = ineRes.body.ruta;

    for (const tipo of [
      'comprobante',
      'ine_beneficiario',
      'solicitud_firmada',
    ]) {
      const documentoRes = await request(app.getHttpServer())
        .post(`/solicitudes/integrante/${integranteId}/documentos/${tipo}`)
        .attach('archivos', imagenJpeg, { filename: `${tipo}.jpg`, contentType: 'image/jpeg' })
        .expect(201);
      rutasDocumentos[tipo] = documentoRes.body.ruta;
    }

    const primerLoteCredito = request(app.getHttpServer())
      .post(`/solicitudes/integrante/${integranteId}/documentos/comprobante_credito`)
      .field('indice_inicio', '0')
      .field('total_archivos', String(MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST + 1))
      .field('finalizar', 'false');
    for (let index = 0; index < MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST; index += 1) {
      primerLoteCredito.attach('archivos', imagenJpeg, {
        filename: `comprobante-credito-${index + 1}.jpg`,
        contentType: 'image/jpeg',
      });
    }
    const primerLoteCreditoRes = await primerLoteCredito.expect(201);
    expect(primerLoteCreditoRes.body).toMatchObject({
      recibidos: MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST,
      total_archivos: MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST + 1,
      completado: false,
    });

    const comprobanteCreditoRes = await request(app.getHttpServer())
      .post(`/solicitudes/integrante/${integranteId}/documentos/comprobante_credito`)
      .field('carga_id', primerLoteCreditoRes.body.carga_id)
      .field('indice_inicio', String(MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST))
      .field('total_archivos', String(MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST + 1))
      .field('finalizar', 'true')
      .attach('archivos', imagenJpeg, {
        filename: `comprobante-credito-${MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST + 1}.jpg`,
        contentType: 'image/jpeg',
      })
      .expect(201);
    expect(comprobanteCreditoRes.body.archivos).toHaveLength(
      MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST + 1,
    );
    rutasDocumentos.comprobante_credito = comprobanteCreditoRes.body.ruta;

    const cargaExcesiva = request(app.getHttpServer())
      .post(`/solicitudes/integrante/${integranteId}/documentos/comprobante_credito`);
    for (let index = 0; index <= MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST; index += 1) {
      cargaExcesiva.attach('archivos', imagenJpeg, {
        filename: `exceso-${index + 1}.jpg`,
        contentType: 'image/jpeg',
      });
    }
    await cargaExcesiva.expect(400);

    // Verificar persistencia en solicitudes_documentos
    const documentos = await dataSource.query(
      'SELECT * FROM solicitudes_documentos WHERE solicitud_id IN (SELECT id FROM solicitudes WHERE integrante_id = $1)',
      [integranteId]
    );
    expect(documentos).toHaveLength(1);
    expect(documentos[0].doc_ine_ruta).toBe(rutasDocumentos.ine);
    expect(documentos[0].doc_comprobante_ruta).toBe(rutasDocumentos.comprobante);
    expect(documentos[0].doc_ine_beneficiario_ruta).toBe(rutasDocumentos.ine_beneficiario);
    expect(documentos[0].doc_solicitud_firmada_ruta).toBe(rutasDocumentos.solicitud_firmada);
    expect(documentos[0].doc_comprobante_credito_ruta).toBe(rutasDocumentos.comprobante_credito);

    // ====================================================================
    // VERIFICACIÓN FINAL: GET debe devolver todos los datos
    // ====================================================================

    // Conteo de filas en las 7 tablas hijas
    const solicitudId = (await dataSource.query('SELECT id FROM solicitudes WHERE integrante_id = $1', [integranteId]))[0].id;
    const countDatosPersonales = await dataSource.query('SELECT COUNT(*) FROM solicitudes_datos_personales WHERE solicitud_id = $1', [solicitudId]);
    const countDomicilios = await dataSource.query('SELECT COUNT(*) FROM solicitudes_domicilios WHERE solicitud_id = $1', [solicitudId]);
    const countNegocios = await dataSource.query('SELECT COUNT(*) FROM solicitudes_negocios WHERE solicitud_id = $1', [solicitudId]);
    const countReferencias = await dataSource.query('SELECT COUNT(*) FROM solicitudes_referencias WHERE solicitud_id = $1', [solicitudId]);
    const countBeneficiarios = await dataSource.query('SELECT COUNT(*) FROM solicitudes_beneficiarios WHERE solicitud_id = $1', [solicitudId]);
    const countValidaciones = await dataSource.query('SELECT COUNT(*) FROM solicitudes_validaciones WHERE solicitud_id = $1', [solicitudId]);
    const countDocumentos = await dataSource.query('SELECT COUNT(*) FROM solicitudes_documentos WHERE solicitud_id = $1', [solicitudId]);

    expect(Number(countDatosPersonales[0].count)).toBe(1);
    expect(Number(countDomicilios[0].count)).toBe(1);
    expect(Number(countNegocios[0].count)).toBe(1);
    expect(Number(countReferencias[0].count)).toBe(1);
    expect(Number(countBeneficiarios[0].count)).toBe(1);
    expect(Number(countValidaciones[0].count)).toBe(1);
    expect(Number(countDocumentos[0].count)).toBe(1);

    const finalRes = await request(app.getHttpServer())
      .get(`/solicitudes/integrante/${integranteId}`)
      .expect(200);

    const solicitud = finalRes.body;

    // Core
    expect(solicitud.integrante_id).toBe(integranteId);

    // Paso 1
    expect(solicitud.curp).toBe('GORM850615MDFNZR09');
    expect(solicitud.genero).toBe('Femenino');
    expect(solicitud.nivel_estudio).toBe('Primaria');

    // Paso 2
    expect(solicitud.dom_calle).toBe('Hidalgo');
    expect(solicitud.dom_entre_calles).toBe('Juárez y Morelos');
    expect(solicitud.dom_codigo_postal).toBe('36900');

    // Paso 3
    expect(solicitud.ref1_nombre).toBe('Juan Pérez');
    expect(solicitud.ref1_direccion).toBe('Calle Reforma 45, Pénjamo');
    expect(solicitud.pareja_nombre).toBe('Carlos González');

    // Paso 4
    expect(solicitud.negocio_giro).toBe('Venta de ropa');
    expect(solicitud.negocio_desde_cuando).toBe('5 años');
    expect(solicitud.negocio_ingreso_semanal).toBe(3000.00);

    // Paso 5
    expect(solicitud.beneficiario_nombre).toBe('Luis González Ruiz');
    expect(solicitud.beneficiario_direccion).toBe('Hidalgo 123, Pénjamo');

    // Paso 6
    expect(solicitud.tiene_medidor_luz).toBe('SI');
    expect(solicitud.vive_max_5km_tesorera).toBe('SI');
    expect(Number(solicitud.monto_solicitado)).toBe(18000);
    expect(solicitud.monto_solicitado_confirmado_at).toBeTruthy();

    // Paso 7
    expect(solicitud.doc_ine_ruta).toBe(rutasDocumentos.ine);
    expect(solicitud.doc_ine_beneficiario_ruta).toBe(rutasDocumentos.ine_beneficiario);
    expect(solicitud.doc_solicitud_firmada_ruta).toBe(rutasDocumentos.solicitud_firmada);
    expect(solicitud.doc_comprobante_credito_ruta).toBe(rutasDocumentos.comprobante_credito);

  });
});
