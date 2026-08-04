const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: 'crelealtad',
  entities: ['src/**/*.entity.ts'],
  synchronize: false,
  logging: true,
});

async function test() {
  try {
    await AppDataSource.initialize();
    console.log('✓ Conexión establecida');

    const SolicitudCoreEntity = require('./src/solicitudes/entities/solicitud-core.entity').SolicitudCoreEntity;
    const SolicitudDatosPersonalesEntity = require('./src/solicitudes/entities/solicitud-datos-personales.entity').SolicitudDatosPersonalesEntity;
    const SolicitudEntity = require('./src/solicitudes/solicitud.entity').SolicitudEntity;

    const integranteId = '9edb4a65-f1c6-4b6f-b4b8-2de137ad54b1';

    console.log('\n1. Creando solicitud core...');
    let solicitudCore = AppDataSource.manager.create(SolicitudCoreEntity, {
      integrante_id: integranteId
    });
    solicitudCore = await AppDataSource.manager.save(SolicitudCoreEntity, solicitudCore);
    console.log('✓ Solicitud core creada, ID:', solicitudCore.id);

    console.log('\n2. Guardando datos personales...');
    let datosPersonales = AppDataSource.manager.create(SolicitudDatosPersonalesEntity, {
      solicitud_id: solicitudCore.id,
      primer_nombre: 'PRUEBA',
      apellido_pat: 'TEST',
      apellido_mat: 'GUARDADO',
    });
    await AppDataSource.manager.save(SolicitudDatosPersonalesEntity, datosPersonales);
    console.log('✓ Datos personales guardados');

    console.log('\n3. Leyendo desde vista consolidada...');
    const solicitud = await AppDataSource.manager.findOne(SolicitudEntity, {
      where: { id: solicitudCore.id }
    });

    if (solicitud) {
      console.log('✓ Solicitud leída desde vista:');
      console.log('  - solicitud_id:', solicitud.id);
      console.log('  - integrante_id:', solicitud.integrante_id);
    } else {
      console.log('✗ NO se pudo leer desde la vista');
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack:', error.stack);
  }
}

test();
