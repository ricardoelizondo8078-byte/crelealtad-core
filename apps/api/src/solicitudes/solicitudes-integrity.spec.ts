import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SolicitudesService } from './solicitudes.service';
import { SolicitudEntity } from './solicitud.entity';
import { SolicitudCoreEntity } from './entities/solicitud-core.entity';
import { SolicitudDatosPersonalesEntity } from './entities/solicitud-datos-personales.entity';
import { SolicitudDomiciliosEntity } from './entities/solicitud-domicilios.entity';
import { SolicitudNegociosEntity } from './entities/solicitud-negocios.entity';
import { SolicitudReferenciasEntity } from './entities/solicitud-referencias.entity';
import { SolicitudBeneficiariosEntity } from './entities/solicitud-beneficiarios.entity';
import { SolicitudValidacionesEntity } from './entities/solicitud-validaciones.entity';
import { SolicitudDocumentosEntity } from './entities/solicitud-documentos.entity';
import { IntegrantesService } from '../integrantes/integrantes.service';
import { IntegranteEntity } from '../integrantes/integrante.entity';
import { PersonaEntity } from '../personas/persona.entity';

/**
 * TEST DE REGRESIÓN: Integridad de Historial de Créditos
 *
 * Verifica que las constraints de integridad aplicadas en la migración
 * AddCreditHistoryIntegrityConstraints funcionen correctamente y que
 * el servicio de solicitudes NO permita que el frontend envíe campos
 * sensibles como numero_credito y credito_id.
 */
describe('Solicitudes - Integridad de Historial de Créditos', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let solicitudesService: SolicitudesService;
  let testPersonaId: string;
  let testIntegranteId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          username: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME || 'crelealtad',
          entities: [
            SolicitudEntity,
            SolicitudCoreEntity,
            SolicitudDatosPersonalesEntity,
            SolicitudDomiciliosEntity,
            SolicitudNegociosEntity,
            SolicitudReferenciasEntity,
            SolicitudBeneficiariosEntity,
            SolicitudValidacionesEntity,
            SolicitudDocumentosEntity,
            IntegranteEntity,
            PersonaEntity,
          ],
          synchronize: false,
        }),
        TypeOrmModule.forFeature([
          SolicitudEntity,
          SolicitudCoreEntity,
          SolicitudDatosPersonalesEntity,
          SolicitudDomiciliosEntity,
          SolicitudNegociosEntity,
          SolicitudReferenciasEntity,
          SolicitudBeneficiariosEntity,
          SolicitudValidacionesEntity,
          SolicitudDocumentosEntity,
        ]),
      ],
      providers: [
        SolicitudesService,
        {
          provide: IntegrantesService,
          useValue: {},
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    solicitudesService = moduleFixture.get<SolicitudesService>(SolicitudesService);

    // Crear datos de prueba
    const personas = await dataSource.query('SELECT id FROM personas LIMIT 1');
    if (personas.length > 0) {
      testPersonaId = personas[0].id;
    } else {
      // Crear persona de prueba si no existe
      const result = await dataSource.query(`
        INSERT INTO personas (nombres, apellido_pat, apellido_mat, curp)
        VALUES ('TEST', 'PERSONA', 'INTEGRITY', 'TEPE800101HDFRSR00')
        RETURNING id
      `);
      testPersonaId = result[0].id;
    }

    const integrantes = await dataSource.query('SELECT id FROM integrantes LIMIT 1');
    if (integrantes.length > 0) {
      testIntegranteId = integrantes[0].id;
    } else {
      // Crear integrante de prueba si no existe
      const expedientes = await dataSource.query('SELECT id FROM expedientes LIMIT 1');
      const expedienteId = expedientes.length > 0 ? expedientes[0].id : null;

      const result = await dataSource.query(`
        INSERT INTO integrantes (persona_id, expediente_id, tipo)
        VALUES ($1, $2, 'SOLICITANTE')
        RETURNING id
      `, [testPersonaId, expedienteId]);
      testIntegranteId = result[0].id;
    }
  });

  afterAll(async () => {
    // Limpiar datos de prueba creados
    await dataSource.query('DELETE FROM solicitudes WHERE persona_id = $1', [testPersonaId]);
    await app.close();
  });

  beforeEach(async () => {
    // Limpiar solicitudes antes de cada test
    await dataSource.query('DELETE FROM solicitudes WHERE integrante_id = $1', [testIntegranteId]);
  });

  describe('1. Sanitización de numero_credito en DTO', () => {
    it('debe ignorar numero_credito enviado en el body (queda NULL)', async () => {
      // Intentar crear solicitud enviando numero_credito desde el "frontend"
      const solicitud = await solicitudesService.createOrUpdateForSolicitante({
        integrante_id: testIntegranteId,
        persona_id: testPersonaId,
        numero_credito: 99, // ← Intento malicioso desde el frontend
        monto_solicitado: 5000,
      });

      expect(solicitud).toBeDefined();
      expect(solicitud.id).toBeDefined();

      // Verificar que numero_credito quedó NULL (ignorado)
      const verificacion = await dataSource.query(
        'SELECT numero_credito FROM solicitudes WHERE id = $1',
        [solicitud.id]
      );

      expect(verificacion[0].numero_credito).toBeNull();
    });

    it('debe ignorar credito_id enviado en el body (queda NULL)', async () => {
      // Crear un crédito falso para intentar asignarlo
      const creditosFalsos = await dataSource.query('SELECT id FROM creditos LIMIT 1');
      const creditoIdFalso = creditosFalsos.length > 0 ? creditosFalsos[0].id : '00000000-0000-0000-0000-000000000001';

      const solicitud = await solicitudesService.createOrUpdateForSolicitante({
        integrante_id: testIntegranteId,
        persona_id: testPersonaId,
        credito_id: creditoIdFalso, // ← Intento malicioso desde el frontend
        monto_solicitado: 5000,
      });

      expect(solicitud).toBeDefined();

      // Verificar que credito_id quedó NULL (ignorado)
      const verificacion = await dataSource.query(
        'SELECT credito_id FROM solicitudes WHERE id = $1',
        [solicitud.id]
      );

      expect(verificacion[0].credito_id).toBeNull();
    });
  });

  describe('2. Constraint UNIQUE (persona_id, numero_credito)', () => {
    it('debe FALLAR al insertar dos solicitudes con mismo persona_id y numero_credito NOT NULL', async () => {
      // Insertar directamente en la BD para simular desembolsos (bypassing el servicio)
      await dataSource.query(`
        INSERT INTO solicitudes (persona_id, integrante_id, numero_credito)
        VALUES ($1, $2, 1)
      `, [testPersonaId, testIntegranteId]);

      // Intentar insertar otra solicitud con el mismo numero_credito
      await expect(
        dataSource.query(`
          INSERT INTO solicitudes (persona_id, integrante_id, numero_credito)
          VALUES ($1, $2, 1)
        `, [testPersonaId, testIntegranteId])
      ).rejects.toThrow(); // Debe fallar por violación de UNIQUE constraint
    });

    it('debe PERMITIR múltiples solicitudes con mismo persona_id y numero_credito NULL', async () => {
      // Insertar primera solicitud con numero_credito NULL
      await dataSource.query(`
        INSERT INTO solicitudes (persona_id, integrante_id, numero_credito)
        VALUES ($1, $2, NULL)
      `, [testPersonaId, testIntegranteId]);

      // Insertar segunda solicitud con numero_credito NULL (debe funcionar)
      await expect(
        dataSource.query(`
          INSERT INTO solicitudes (persona_id, integrante_id, numero_credito)
          VALUES ($1, $2, NULL)
        `, [testPersonaId, testIntegranteId])
      ).resolves.not.toThrow();

      // Insertar tercera solicitud con numero_credito NULL (debe funcionar)
      await expect(
        dataSource.query(`
          INSERT INTO solicitudes (persona_id, integrante_id, numero_credito)
          VALUES ($1, $2, NULL)
        `, [testPersonaId, testIntegranteId])
      ).resolves.not.toThrow();

      // Verificar que se crearon 3 solicitudes con numero_credito NULL
      const resultado = await dataSource.query(`
        SELECT COUNT(*) AS total
        FROM solicitudes
        WHERE persona_id = $1 AND numero_credito IS NULL
      `, [testPersonaId]);

      expect(parseInt(resultado[0].total)).toBe(3);
    });
  });

  describe('3. Foreign Key: persona_id -> personas.id', () => {
    it('debe FALLAR al crear solicitud con persona_id inexistente', async () => {
      const personaIdInexistente = '00000000-0000-0000-0000-999999999999';

      await expect(
        dataSource.query(`
          INSERT INTO solicitudes (persona_id, integrante_id)
          VALUES ($1, $2)
        `, [personaIdInexistente, testIntegranteId])
      ).rejects.toThrow(); // Debe fallar por FK constraint
    });

    it('debe PERMITIR crear solicitud con persona_id existente', async () => {
      await expect(
        dataSource.query(`
          INSERT INTO solicitudes (persona_id, integrante_id)
          VALUES ($1, $2)
        `, [testPersonaId, testIntegranteId])
      ).resolves.not.toThrow();
    });
  });

  describe('4. Verificación de ON DELETE RESTRICT', () => {
    it('debe FALLAR al intentar borrar una persona con solicitudes asociadas', async () => {
      // Crear solicitud asociada a la persona
      await dataSource.query(`
        INSERT INTO solicitudes (persona_id, integrante_id)
        VALUES ($1, $2)
      `, [testPersonaId, testIntegranteId]);

      // Intentar borrar la persona (debe fallar)
      await expect(
        dataSource.query('DELETE FROM personas WHERE id = $1', [testPersonaId])
      ).rejects.toThrow(); // Debe fallar por ON DELETE RESTRICT
    });
  });
});
