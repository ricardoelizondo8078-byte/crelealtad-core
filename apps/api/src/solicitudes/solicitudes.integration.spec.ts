import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { SolicitudesModule } from './solicitudes.module';
import { IntegrantesModule } from '../integrantes/integrantes.module';
import { ExpedientesModule } from '../expedientes/expedientes.module';
import { GruposModule } from '../grupos/grupos.module';

describe('Solicitudes Integration - Wizard 7 pasos', () => {
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
          synchronize: false, // NO auto-sincronizar - usamos migraciones reales
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

  afterAll(async () => {
    // Limpiar datos de prueba
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

    await app.close();
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
        tesorera_id: '00000000-0000-0000-0000-000000000001', // UUID de prueba
        ciclo_numero: 1,
      })
      .expect(201);

    grupoId = grupoRes.body.id;
    expect(grupoId).toBeDefined();

    // 2. Crear expediente
    const expedienteRes = await request(app.getHttpServer())
      .post('/expedientes')
      .send({ grupo_id: grupoId })
      .expect(201);

    expedienteId = expedienteRes.body.id;
    expect(expedienteId).toBeDefined();

    // 3. Crear persona directamente en BD porque no hay endpoint /personas
    const personaResult = await dataSource.query(
      `INSERT INTO personas (nombres, apellido_pat, apellido_mat, curp, fecha_nac)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['María Elena', 'González', 'Ruiz', 'GORM850615MDFNZR09', '1985-06-15']
    );
    personaId = personaResult[0].id;
    expect(personaId).toBeDefined();

    // 4. Crear integrante
    const integranteRes = await request(app.getHttpServer())
      .post('/integrantes')
      .send({
        expediente_id: expedienteId,
        persona_id: personaId,
      })
      .expect(201);

    integranteId = integranteRes.body.id;
    expect(integranteId).toBeDefined();
    expect(integranteRes.body.estado).toBe('DOCUMENTANDO');

    // ====================================================================
    // PASO 1: Datos Personales
    // ====================================================================

    await request(app.getHttpServer())
      .patch(`/solicitudes/integrante/${integranteId}`)
      .send({
        integrante_id: integranteId,
        persona_id: personaId,
        expediente_id: expedienteId,
        grupo_id: grupoId,
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
        integrante_id: integranteId,
        persona_id: personaId,
        expediente_id: expedienteId,
        grupo_id: grupoId,
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
        integrante_id: integranteId,
        persona_id: personaId,
        expediente_id: expedienteId,
        grupo_id: grupoId,
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
        integrante_id: integranteId,
        persona_id: personaId,
        expediente_id: expedienteId,
        grupo_id: grupoId,
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
        integrante_id: integranteId,
        persona_id: personaId,
        expediente_id: expedienteId,
        grupo_id: grupoId,
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

    await request(app.getHttpServer())
      .patch(`/solicitudes/integrante/${integranteId}`)
      .send({
        integrante_id: integranteId,
        persona_id: personaId,
        expediente_id: expedienteId,
        grupo_id: grupoId,
        // Tabla solicitudes_validaciones
        tiene_medidor_luz: 'SI',
        vive_max_5km_tesorera: 'SI',
        tiene_menos_70_anios: 'SI',
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

    await request(app.getHttpServer())
      .patch(`/solicitudes/integrante/${integranteId}`)
      .send({
        integrante_id: integranteId,
        persona_id: personaId,
        expediente_id: expedienteId,
        grupo_id: grupoId,
        // Tabla solicitudes_documentos
        doc_ine_ruta: '/storage/ine_maria_gonzalez.jpg',
        doc_ine_fecha: '2024-01-15',
        doc_comprobante_ruta: '/storage/comprobante_maria_gonzalez.pdf',
        doc_comprobante_fecha: '2024-01-15',
        doc_ine_beneficiario_ruta: '/storage/ine_luis_gonzalez.jpg',
        doc_ine_beneficiario_fecha: '2024-01-15',
        doc_solicitud_firmada_ruta: '/storage/solicitud_firmada_maria.pdf',
        doc_solicitud_firmada_fecha: '2024-01-15',
      })
      .expect(200);

    // Verificar persistencia en solicitudes_documentos
    const documentos = await dataSource.query(
      'SELECT * FROM solicitudes_documentos WHERE solicitud_id IN (SELECT id FROM solicitudes WHERE integrante_id = $1)',
      [integranteId]
    );
    expect(documentos).toHaveLength(1);
    expect(documentos[0].doc_ine_ruta).toBe('/storage/ine_maria_gonzalez.jpg');
    expect(documentos[0].doc_comprobante_ruta).toBe('/storage/comprobante_maria_gonzalez.pdf');
    expect(documentos[0].doc_ine_beneficiario_ruta).toBe('/storage/ine_luis_gonzalez.jpg');
    expect(documentos[0].doc_solicitud_firmada_ruta).toBe('/storage/solicitud_firmada_maria.pdf');

    // ====================================================================
    // VERIFICACIÓN FINAL: GET debe devolver todos los datos
    // ====================================================================

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

    // Paso 7
    expect(solicitud.doc_ine_ruta).toBe('/storage/ine_maria_gonzalez.jpg');
    expect(solicitud.doc_ine_beneficiario_ruta).toBe('/storage/ine_luis_gonzalez.jpg');
    expect(solicitud.doc_solicitud_firmada_ruta).toBe('/storage/solicitud_firmada_maria.pdf');

    console.log('✅ CICLO COMPLETO VERIFICADO: 7 pasos persisten correctamente en las 7 tablas hijas');
  });
});
