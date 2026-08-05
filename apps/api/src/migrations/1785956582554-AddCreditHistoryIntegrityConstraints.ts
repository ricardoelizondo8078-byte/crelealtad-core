import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migración: Integridad de Cadena de Historial de Créditos
 *
 * PROPÓSITO:
 * Cerrar la integridad referencial de la cadena persona -> solicitudes -> creditos
 * ANTES del primer desembolso, garantizando que numero_credito solo incremente
 * en desembolsos reales y que no existan registros huérfanos.
 *
 * CAMBIOS:
 * 1. Verifica ausencia de registros huérfanos (DETIENE si encuentra alguno)
 * 2. Agrega 5 Foreign Keys en solicitudes
 * 3. Agrega constraint UNIQUE (persona_id, numero_credito)
 *
 * REGLA DE NEGOCIO:
 * En CRELEALTAD no se borra información, por lo que todas las FK usan ON DELETE RESTRICT.
 *
 * CONTRATO DE numero_credito:
 * - Solo se asigna en desembolsos REALES
 * - Debe ser consecutivo por persona (1, 2, 3, ...)
 * - UNIQUE (persona_id, numero_credito) permite múltiples NULL (solicitudes sin desembolso)
 */
export class AddCreditHistoryIntegrityConstraints1785956582554 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('\n=== MIGRACIÓN: Integridad de Cadena de Historial de Créditos ===\n');

        // =====================================================
        // PASO 1: VERIFICAR AUSENCIA DE HUÉRFANOS
        // =====================================================
        console.log('PASO 1: Verificando ausencia de registros huérfanos...');

        const verificaciones = [
            {
                nombre: 'solicitudes.persona_id -> personas.id',
                query: `
                    SELECT COUNT(*) AS cantidad
                    FROM solicitudes s
                    WHERE s.persona_id IS NOT NULL
                      AND NOT EXISTS (SELECT 1 FROM personas p WHERE p.id = s.persona_id)
                `
            },
            {
                nombre: 'solicitudes.expediente_id -> expedientes.id',
                query: `
                    SELECT COUNT(*) AS cantidad
                    FROM solicitudes s
                    WHERE s.expediente_id IS NOT NULL
                      AND NOT EXISTS (SELECT 1 FROM expedientes e WHERE e.id = s.expediente_id)
                `
            },
            {
                nombre: 'solicitudes.grupo_id -> grupos.id',
                query: `
                    SELECT COUNT(*) AS cantidad
                    FROM solicitudes s
                    WHERE s.grupo_id IS NOT NULL
                      AND NOT EXISTS (SELECT 1 FROM grupos g WHERE g.id = s.grupo_id)
                `
            },
            {
                nombre: 'solicitudes.credito_id -> creditos.id',
                query: `
                    SELECT COUNT(*) AS cantidad
                    FROM solicitudes s
                    WHERE s.credito_id IS NOT NULL
                      AND NOT EXISTS (SELECT 1 FROM creditos c WHERE c.id = s.credito_id)
                `
            },
            {
                nombre: 'solicitudes.integrante_id -> integrantes.id',
                query: `
                    SELECT COUNT(*) AS cantidad
                    FROM solicitudes s
                    WHERE s.integrante_id IS NOT NULL
                      AND NOT EXISTS (SELECT 1 FROM integrantes i WHERE i.id = s.integrante_id)
                `
            }
        ];

        for (const verificacion of verificaciones) {
            const resultado = await queryRunner.query(verificacion.query);
            const cantidad = parseInt(resultado[0].cantidad);

            if (cantidad > 0) {
                const errorMsg = `
❌ MIGRACIÓN DETENIDA: Se encontraron ${cantidad} registros huérfanos en ${verificacion.nombre}

No se puede proceder con la migración hasta que se limpien los registros huérfanos.

Para investigar, ejecuta:
${verificacion.query.replace('COUNT(*) AS cantidad', 's.id, s.' + verificacion.nombre.split('.')[1].split(' ')[0])} LIMIT 10;
                `;
                throw new Error(errorMsg);
            }

            console.log(`  ✅ ${verificacion.nombre}: Sin huérfanos`);
        }

        console.log('\n✅ PASO 1 COMPLETADO: No hay registros huérfanos\n');

        // =====================================================
        // PASO 2: AGREGAR FOREIGN KEYS
        // =====================================================
        console.log('PASO 2: Agregando Foreign Keys...');

        /**
         * FK 1: solicitudes.persona_id -> personas.id
         *
         * ON DELETE RESTRICT porque:
         * - En CRELEALTAD no se borra información (regla de negocio)
         * - Una persona con solicitudes NO debe poder eliminarse
         * - Si se requiere "eliminar" una persona, debe ser soft delete
         */
        await queryRunner.query(`
            ALTER TABLE solicitudes
            ADD CONSTRAINT fk_solicitudes_persona
                FOREIGN KEY (persona_id)
                REFERENCES personas(id)
                ON DELETE RESTRICT
        `);
        console.log('  ✅ FK solicitudes.persona_id -> personas.id (ON DELETE RESTRICT)');

        /**
         * FK 2: solicitudes.expediente_id -> expedientes.id
         *
         * ON DELETE RESTRICT porque:
         * - No se borra información
         * - Un expediente con solicitudes asociadas NO debe poder eliminarse
         * - El expediente es crítico para la trazabilidad del proceso
         */
        await queryRunner.query(`
            ALTER TABLE solicitudes
            ADD CONSTRAINT fk_solicitudes_expediente
                FOREIGN KEY (expediente_id)
                REFERENCES expedientes(id)
                ON DELETE RESTRICT
        `);
        console.log('  ✅ FK solicitudes.expediente_id -> expedientes.id (ON DELETE RESTRICT)');

        /**
         * FK 3: solicitudes.grupo_id -> grupos.id
         *
         * ON DELETE RESTRICT porque:
         * - No se borra información
         * - Un grupo con solicitudes asociadas NO debe poder eliminarse
         * - El grupo es parte del contexto operativo de la solicitud
         */
        await queryRunner.query(`
            ALTER TABLE solicitudes
            ADD CONSTRAINT fk_solicitudes_grupo
                FOREIGN KEY (grupo_id)
                REFERENCES grupos(id)
                ON DELETE RESTRICT
        `);
        console.log('  ✅ FK solicitudes.grupo_id -> grupos.id (ON DELETE RESTRICT)');

        /**
         * FK 4: solicitudes.credito_id -> creditos.id
         *
         * ON DELETE RESTRICT porque:
         * - No se borra información
         * - Un crédito con solicitud asociada NO debe poder eliminarse
         * - La relación solicitud -> crédito es fundamental para el historial
         */
        await queryRunner.query(`
            ALTER TABLE solicitudes
            ADD CONSTRAINT fk_solicitudes_credito
                FOREIGN KEY (credito_id)
                REFERENCES creditos(id)
                ON DELETE RESTRICT
        `);
        console.log('  ✅ FK solicitudes.credito_id -> creditos.id (ON DELETE RESTRICT)');

        /**
         * FK 5: solicitudes.integrante_id -> integrantes.id
         *
         * ON DELETE RESTRICT porque:
         * - No se borra información
         * - Un integrante con solicitud asociada NO debe poder eliminarse
         * - El integrante es quien solicita el crédito, su vínculo es permanente
         */
        await queryRunner.query(`
            ALTER TABLE solicitudes
            ADD CONSTRAINT fk_solicitudes_integrante
                FOREIGN KEY (integrante_id)
                REFERENCES integrantes(id)
                ON DELETE RESTRICT
        `);
        console.log('  ✅ FK solicitudes.integrante_id -> integrantes.id (ON DELETE RESTRICT)');

        console.log('\n✅ PASO 2 COMPLETADO: 5 Foreign Keys agregadas\n');

        // =====================================================
        // PASO 3: AGREGAR CONSTRAINT UNIQUE (persona_id, numero_credito)
        // =====================================================
        console.log('PASO 3: Agregando constraint UNIQUE (persona_id, numero_credito)...');

        /**
         * UNIQUE (persona_id, numero_credito)
         *
         * COMPORTAMIENTO EN POSTGRESQL:
         * - Permite MÚLTIPLES filas con numero_credito = NULL para la misma persona_id
         * - Solo valida unicidad cuando AMBOS valores son NOT NULL
         *
         * ESTO ES CORRECTO porque:
         * - Todas las solicitudes SIN desembolso tienen numero_credito = NULL
         * - Solo las solicitudes DESEMBOLSADAS tienen numero_credito NOT NULL
         * - Cada persona puede tener múltiples solicitudes sin desembolso (todas con NULL)
         * - Pero solo puede tener UN crédito con numero_credito = 1, UNO con numero_credito = 2, etc.
         *
         * EJEMPLO VÁLIDO:
         * persona_id          | numero_credito
         * ------------------- | --------------
         * uuid-persona-A      | NULL           ← Solicitud 1 (sin desembolso)
         * uuid-persona-A      | NULL           ← Solicitud 2 (sin desembolso)
         * uuid-persona-A      | NULL           ← Solicitud 3 (sin desembolso)
         * uuid-persona-A      | 1              ← Primer crédito desembolsado
         * uuid-persona-A      | 2              ← Segundo crédito desembolsado
         * uuid-persona-A      | NULL           ← Solicitud 4 (sin desembolso)
         * uuid-persona-A      | 3              ← Tercer crédito desembolsado
         *
         * EJEMPLO INVÁLIDO (violación de constraint):
         * uuid-persona-A      | 1
         * uuid-persona-A      | 1              ← ERROR: Duplicado
         */
        await queryRunner.query(`
            ALTER TABLE solicitudes
            ADD CONSTRAINT solicitudes_persona_numero_credito_unique
                UNIQUE (persona_id, numero_credito)
        `);
        console.log('  ✅ UNIQUE (persona_id, numero_credito) agregada');
        console.log('     → Permite múltiples NULL (solicitudes sin desembolso)');
        console.log('     → Valida unicidad solo cuando ambos son NOT NULL');

        console.log('\n✅ PASO 3 COMPLETADO: Constraint UNIQUE agregada\n');

        console.log('=== MIGRACIÓN COMPLETADA EXITOSAMENTE ===\n');
        console.log('Constraints aplicadas:');
        console.log('  ✅ 5 Foreign Keys con ON DELETE RESTRICT');
        console.log('  ✅ 1 UNIQUE constraint (persona_id, numero_credito)');
        console.log('\nLa cadena de integridad está cerrada. ✅\n');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('\n=== ROLLBACK: Revirtiendo Migración de Integridad ===\n');

        // Revertir en orden inverso

        // 1. Eliminar constraint UNIQUE
        console.log('Eliminando constraint UNIQUE...');
        await queryRunner.query(`
            ALTER TABLE solicitudes
            DROP CONSTRAINT IF EXISTS solicitudes_persona_numero_credito_unique
        `);
        console.log('  ✅ UNIQUE constraint eliminada');

        // 2. Eliminar Foreign Keys (en orden inverso)
        console.log('\nEliminando Foreign Keys...');

        await queryRunner.query(`
            ALTER TABLE solicitudes
            DROP CONSTRAINT IF EXISTS fk_solicitudes_integrante
        `);
        console.log('  ✅ FK integrante_id eliminada');

        await queryRunner.query(`
            ALTER TABLE solicitudes
            DROP CONSTRAINT IF EXISTS fk_solicitudes_credito
        `);
        console.log('  ✅ FK credito_id eliminada');

        await queryRunner.query(`
            ALTER TABLE solicitudes
            DROP CONSTRAINT IF EXISTS fk_solicitudes_grupo
        `);
        console.log('  ✅ FK grupo_id eliminada');

        await queryRunner.query(`
            ALTER TABLE solicitudes
            DROP CONSTRAINT IF EXISTS fk_solicitudes_expediente
        `);
        console.log('  ✅ FK expediente_id eliminada');

        await queryRunner.query(`
            ALTER TABLE solicitudes
            DROP CONSTRAINT IF EXISTS fk_solicitudes_persona
        `);
        console.log('  ✅ FK persona_id eliminada');

        console.log('\n=== ROLLBACK COMPLETADO ===\n');
        console.log('Todas las constraints de integridad han sido eliminadas.\n');
    }

}
