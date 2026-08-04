const bcrypt = require('bcrypt');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

/**
 * SCRIPT DE IMPORTACIÓN DE ASESORES
 * Lee CSV y crea:
 *   1. Usuario en tabla usuarios (login)
 *   2. Asesor en tabla asesoras (datos personales)
 *   3. Contacto en asesoras_contacto
 *   4. Domicilio en asesoras_domicilios
 *   5. Datos laborales en asesoras_datos_laborales
 */

// Parsear CSV simple
function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index] ? values[index].trim() : null;
    });
    rows.push(row);
  }

  return rows;
}

async function importarAsesores(csvPath) {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: process.env.DB_PASSWORD || process.env.DB_PASS,
    database: 'crelealtad'
  });

  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL\n');

    // Leer CSV
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const asesores = parseCSV(csvContent);

    console.log(`📋 Total de asesores a importar: ${asesores.length}\n`);

    // Obtener IDs necesarios
    const rolAsesor = await client.query("SELECT id FROM roles WHERE nombre = 'ASESOR' LIMIT 1");
    const sucursalMatriz = await client.query("SELECT id FROM sucursales WHERE nombre = 'MATRIZ' LIMIT 1");

    if (rolAsesor.rows.length === 0) {
      throw new Error('No existe rol ASESOR - ejecuta primero script de crear-roles.js');
    }

    const rolAsesorId = rolAsesor.rows[0].id;
    const sucursalMatrizId = sucursalMatriz.rows[0].id;

    let importados = 0;
    let errores = 0;

    for (const asesor of asesores) {
      try {
        console.log(`⏳ Importando: ${asesor.nombre} ${asesor.apellido_paterno}...`);

        // Validar campos requeridos
        if (!asesor.email || !asesor.pin) {
          throw new Error('Email y PIN son requeridos');
        }

        // PASO 1: Crear usuario (login)
        const passwordHash = await bcrypt.hash(asesor.pin, 10);
        const nombreCompleto = `${asesor.nombre} ${asesor.apellido_paterno} ${asesor.apellido_materno || ''}`.trim();

        const usuarioResult = await client.query(`
          INSERT INTO usuarios (nombre, email, password_hash, rol_id, sucursal_id, estado, folio)
          VALUES ($1, $2, $3, $4, $5, 'ACTIVO', $6)
          ON CONFLICT (email) DO UPDATE
            SET nombre = EXCLUDED.nombre,
                password_hash = EXCLUDED.password_hash,
                updated_at = NOW()
          RETURNING id
        `, [nombreCompleto, asesor.email, passwordHash, rolAsesorId, sucursalMatrizId, asesor.folio]);

        const usuarioId = usuarioResult.rows[0].id;

        // Buscar zona (si existe)
        let zonaId = null;
        if (asesor.zona) {
          const zonaResult = await client.query("SELECT id FROM zonas WHERE nombre = $1", [asesor.zona]);
          if (zonaResult.rows.length > 0) {
            zonaId = zonaResult.rows[0].id;
          }
        }

        // PASO 2: Crear asesor (datos personales)
        const asesorResult = await client.query(`
          INSERT INTO asesoras (
            usuario_id, folio, zona_id,
            nombre, apellido_paterno, apellido_materno,
            fecha_nacimiento, genero, curp, rfc, fecha_ingreso
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (usuario_id) DO UPDATE
            SET nombre = EXCLUDED.nombre,
                apellido_paterno = EXCLUDED.apellido_paterno,
                apellido_materno = EXCLUDED.apellido_materno,
                fecha_nacimiento = EXCLUDED.fecha_nacimiento,
                genero = EXCLUDED.genero,
                curp = EXCLUDED.curp,
                rfc = EXCLUDED.rfc,
                fecha_ingreso = EXCLUDED.fecha_ingreso,
                updated_at = NOW()
          RETURNING id
        `, [
          usuarioId,
          asesor.folio,
          zonaId,
          asesor.nombre,
          asesor.apellido_paterno,
          asesor.apellido_materno,
          asesor.fecha_nacimiento,
          asesor.genero,
          asesor.curp,
          asesor.rfc,
          asesor.fecha_ingreso
        ]);

        const asesorId = asesorResult.rows[0].id;

        // PASO 3: Crear contacto
        await client.query(`
          INSERT INTO asesoras_contacto (
            asesor_id, telefono_celular, telefono_casa, telefono_emergencia,
            emergencia_nombre, emergencia_parentesco
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (asesor_id) DO UPDATE
            SET telefono_celular = EXCLUDED.telefono_celular,
                telefono_casa = EXCLUDED.telefono_casa,
                telefono_emergencia = EXCLUDED.telefono_emergencia,
                emergencia_nombre = EXCLUDED.emergencia_nombre,
                emergencia_parentesco = EXCLUDED.emergencia_parentesco,
                updated_at = NOW()
        `, [
          asesorId,
          asesor.telefono_celular,
          asesor.telefono_casa,
          asesor.telefono_emergencia,
          asesor.emergencia_nombre,
          asesor.emergencia_parentesco
        ]);

        // PASO 4: Crear domicilio
        const lat = asesor.dom_latitud ? parseFloat(asesor.dom_latitud) : null;
        const lon = asesor.dom_longitud ? parseFloat(asesor.dom_longitud) : null;

        await client.query(`
          INSERT INTO asesoras_domicilios (
            asesor_id, calle, numero_ext, numero_int, colonia,
            municipio, estado, codigo_postal, referencias,
            latitud, longitud, geolocalizacion_fecha
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (asesor_id) DO UPDATE
            SET calle = EXCLUDED.calle,
                numero_ext = EXCLUDED.numero_ext,
                numero_int = EXCLUDED.numero_int,
                colonia = EXCLUDED.colonia,
                municipio = EXCLUDED.municipio,
                estado = EXCLUDED.estado,
                codigo_postal = EXCLUDED.codigo_postal,
                referencias = EXCLUDED.referencias,
                latitud = EXCLUDED.latitud,
                longitud = EXCLUDED.longitud,
                geolocalizacion_fecha = EXCLUDED.geolocalizacion_fecha,
                updated_at = NOW()
        `, [
          asesorId,
          asesor.dom_calle,
          asesor.dom_numero_ext,
          asesor.dom_numero_int,
          asesor.dom_colonia,
          asesor.dom_municipio,
          asesor.dom_estado,
          asesor.dom_codigo_postal,
          asesor.dom_referencias,
          lat,
          lon,
          (lat && lon) ? new Date() : null
        ]);

        // PASO 5: Crear datos laborales
        const metaGrupos = asesor.meta_mensual_grupos ? parseInt(asesor.meta_mensual_grupos) : null;
        const metaMonto = asesor.meta_mensual_monto ? parseFloat(asesor.meta_mensual_monto) : null;

        await client.query(`
          INSERT INTO asesoras_datos_laborales (
            asesor_id, sucursal_id, tipo_contrato, nivel,
            meta_mensual_grupos, meta_mensual_monto, observaciones
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (asesor_id) DO UPDATE
            SET sucursal_id = EXCLUDED.sucursal_id,
                tipo_contrato = EXCLUDED.tipo_contrato,
                nivel = EXCLUDED.nivel,
                meta_mensual_grupos = EXCLUDED.meta_mensual_grupos,
                meta_mensual_monto = EXCLUDED.meta_mensual_monto,
                observaciones = EXCLUDED.observaciones,
                updated_at = NOW()
        `, [
          asesorId,
          sucursalMatrizId,
          asesor.tipo_contrato,
          asesor.nivel,
          metaGrupos,
          metaMonto,
          asesor.observaciones
        ]);

        console.log(`   ✅ Importado: ${asesor.email} (PIN: ${asesor.pin})`);
        importados++;

      } catch (error) {
        console.error(`   ❌ Error con ${asesor.email}: ${error.message}`);
        errores++;
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`✅ Importados: ${importados}`);
    console.log(`❌ Errores: ${errores}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    // Verificar totales
    const totales = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM usuarios WHERE rol_id = $1) as usuarios,
        (SELECT COUNT(*) FROM asesoras) as asesoras,
        (SELECT COUNT(*) FROM asesoras_contacto) as contactos,
        (SELECT COUNT(*) FROM asesoras_domicilios) as domicilios,
        (SELECT COUNT(*) FROM asesoras_datos_laborales) as laborales
    `, [rolAsesorId]);

    console.log('📊 TOTALES EN BASE DE DATOS:');
    console.table(totales.rows[0]);

  } catch (error) {
    console.error('❌ Error fatal:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Ejecutar
const csvPath = process.argv[2] || path.join(__dirname, '../../TEMPLATE_ASESORES_NORMALIZADO.csv');

if (!fs.existsSync(csvPath)) {
  console.error(`❌ Archivo no encontrado: ${csvPath}`);
  console.log('Uso: node importar-asesores.js [ruta-al-csv]');
  process.exit(1);
}

console.log(`📂 Importando desde: ${csvPath}\n`);

importarAsesores(csvPath)
  .then(() => {
    console.log('✅ Importación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Importación fallida');
    process.exit(1);
  });
