const { DataSource } = require('typeorm');
const fs = require('fs');

async function extraerEsquema() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: process.env.DB_PASSWORD || process.env.DB_PASS,
    database: 'crelealtad',
  });

  await dataSource.initialize();

  // Query para extraer el esquema completo
  const queryEsquema = `
    SELECT
        c.table_name        AS tabla,
        c.ordinal_position  AS posicion,
        c.column_name       AS columna,
        CASE
            WHEN c.data_type = 'character varying'
                THEN 'character varying(' || c.character_maximum_length || ')'
            WHEN c.data_type = 'numeric'
                THEN 'numeric(' || c.numeric_precision || ',' || c.numeric_scale || ')'
            ELSE c.data_type
        END                 AS tipo_dato,
        c.is_nullable       AS nullable,
        c.column_default    AS default_valor,
        fk.referencia_fk    AS relacion_fk
    FROM information_schema.columns c
    JOIN information_schema.tables t
         ON t.table_name = c.table_name
        AND t.table_schema = c.table_schema
    LEFT JOIN (
        SELECT
            kcu.table_name,
            kcu.column_name,
            'FK -> ' || ccu.table_name || '.' || ccu.column_name AS referencia_fk
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
             ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
             ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
    ) fk
         ON fk.table_name = c.table_name
        AND fk.column_name = c.column_name
    WHERE c.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
    ORDER BY c.table_name, c.ordinal_position;
  `;

  const columnas = await dataSource.query(queryEsquema);

  // Query para obtener llaves primarias
  const queryPK = `
    SELECT tc.table_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name;
  `;

  const pks = await dataSource.query(queryPK);

  // Query para obtener conteo de registros
  const queryConteo = `
    SELECT relname, n_live_tup
    FROM pg_stat_user_tables
    ORDER BY relname;
  `;

  const conteos = await dataSource.query(queryConteo);

  // Guardar resultados
  fs.writeFileSync('esquema.json', JSON.stringify({
    columnas,
    pks,
    conteos
  }, null, 2));

  // Imprimir resumen
  const tablasUnicas = [...new Set(columnas.map(c => c.tabla))].sort();
  console.log(`Total de tablas encontradas: ${tablasUnicas.length}`);
  console.log('\nListado de tablas:');
  tablasUnicas.forEach((tabla, i) => {
    console.log(`${(i + 1).toString().padStart(2)}. ${tabla}`);
  });

  console.log(`\nTotal de columnas: ${columnas.length}`);

  await dataSource.destroy();
}

extraerEsquema().catch(console.error);
