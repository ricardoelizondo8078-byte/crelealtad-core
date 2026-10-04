import { BadRequestException, ConflictException } from '@nestjs/common';
import { ExpedienteEntity, ExpedienteEstado } from '../expedientes/expediente.entity';
import { SolicitudCoreEntity } from '../solicitudes/entities/solicitud-core.entity';
import { SolicitudDocumentosEntity } from '../solicitudes/entities/solicitud-documentos.entity';
import { IntegranteEntity, IntegranteEstado } from './integrante.entity';
import { IntegrantesService } from './integrantes.service';

describe('IntegrantesService - revisión documental desde Verificación', () => {
  const integranteRepositoryTransaccional = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const expedienteRepositoryTransaccional = {
    findOne: jest.fn(),
  };
  const solicitudRepositoryTransaccional = {
    findOne: jest.fn(),
  };
  const documentosRepositoryTransaccional = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const managerTransaccional = {
    getRepository: jest.fn((entity: Function) => {
      if (entity === IntegranteEntity) return integranteRepositoryTransaccional;
      if (entity === ExpedienteEntity) return expedienteRepositoryTransaccional;
      if (entity === SolicitudCoreEntity) return solicitudRepositoryTransaccional;
      if (entity === SolicitudDocumentosEntity) return documentosRepositoryTransaccional;
      throw new Error('Repositorio transaccional no configurado para la prueba');
    }),
    query: jest.fn(),
  };
  const integranteRepository = {
    manager: {
      transaction: jest.fn(),
    },
  };
  let service: IntegrantesService;
  const scopeVerificador = { usuarioId: 'usuario-1', rolNombre: 'VERIFICADOR' };
  const scopeAsesor = { usuarioId: 'usuario-asesor', rolNombre: 'VERIFICADOR' };

  beforeEach(() => {
    jest.clearAllMocks();
    integranteRepository.manager.transaction.mockImplementation(
      async (operacion: (manager: typeof managerTransaccional) => Promise<unknown>) => (
        operacion(managerTransaccional)
      ),
    );
    integranteRepositoryTransaccional.save.mockImplementation(async (integrante) => integrante);
    documentosRepositoryTransaccional.save.mockImplementation(async (documentos) => documentos);
    solicitudRepositoryTransaccional.findOne.mockResolvedValue({ id: 'solicitud-1' });
    documentosRepositoryTransaccional.findOne.mockResolvedValue({
      solicitud_id: 'solicitud-1',
      doc_ine_ruta: '/documentos/ine-anterior',
      doc_ine_fecha: new Date('2026-08-01'),
      doc_comprobante_ruta: '/documentos/comprobante-vigente',
      doc_comprobante_fecha: new Date('2026-08-01'),
      doc_ine_beneficiario_ruta: '/documentos/beneficiario-vigente',
      doc_ine_beneficiario_fecha: new Date('2026-08-01'),
      doc_solicitud_firmada_ruta: '/documentos/solicitud-vigente',
      doc_solicitud_firmada_fecha: new Date('2026-08-01'),
    });
    managerTransaccional.query.mockResolvedValue([]);
    service = new IntegrantesService(
      integranteRepository as never,
      {} as never,
      {} as never,
    );
  });

  it('marca REVISAR DOCUMENTACIÓN de forma auditada mientras el expediente está en Verificación', async () => {
    integranteRepositoryTransaccional.findOne.mockResolvedValue({
      id: 'integrante-1',
      expediente_id: 'expediente-1',
      estado: IntegranteEstado.SUJETA_CREDITO,
    });
    expedienteRepositoryTransaccional.findOne.mockResolvedValue({
      id: 'expediente-1',
      estado: ExpedienteEstado.EN_VERIFICACION,
    });

    const result = await service.updateEstadoManual(
      'integrante-1',
      IntegranteEstado.DOCUMENTANDO,
      scopeVerificador,
      ['ine'],
    );

    expect(result.estado).toBe(IntegranteEstado.DOCUMENTANDO);
    expect(documentosRepositoryTransaccional.save).toHaveBeenCalledWith(
      expect.objectContaining({
        doc_ine_ruta: null,
        doc_ine_fecha: null,
        doc_comprobante_ruta: '/documentos/comprobante-vigente',
      }),
    );
    expect(managerTransaccional.query).toHaveBeenCalledWith(
      expect.stringContaining('audit_log'),
      expect.arrayContaining([
        'integrante-1',
        'REV_DOC_SOLICITADA',
        'usuario-1',
      ]),
    );
    const valoresAuditoria = managerTransaccional.query.mock.calls[0][1] as unknown[];
    expect(String(valoresAuditoria[1]).length).toBeLessThanOrEqual(20);
    expect(JSON.parse(String(valoresAuditoria[2]))).toEqual(expect.objectContaining({
      documentos_observados: ['ine'],
      rutas_anteriores: { ine: '/documentos/ine-anterior' },
    }));
  });

  it('elimina la incidencia al completar nuevamente la documentación', async () => {
    jest.spyOn(service, 'validarSolicitudCompleta').mockResolvedValue({
      completa: true,
      pasosIncompletos: [],
      camposFaltantes: {},
    });
    integranteRepositoryTransaccional.findOne.mockResolvedValue({
      id: 'integrante-1',
      expediente_id: 'expediente-1',
      estado: IntegranteEstado.DOCUMENTANDO,
    });
    expedienteRepositoryTransaccional.findOne.mockResolvedValue({
      id: 'expediente-1',
      estado: ExpedienteEstado.EN_VERIFICACION,
    });

    const result = await service.updateEstadoManual(
      'integrante-1',
      IntegranteEstado.SUJETA_CREDITO,
      scopeAsesor,
    );

    expect(result.estado).toBe(IntegranteEstado.SUJETA_CREDITO);
    expect(managerTransaccional.query).toHaveBeenCalledWith(
      expect.stringContaining('audit_log'),
      expect.arrayContaining([
        'integrante-1',
        'REV_DOC_COMPLETADA',
        'usuario-asesor',
      ]),
    );
    const valoresAuditoria = managerTransaccional.query.mock.calls[0][1] as unknown[];
    expect(String(valoresAuditoria[1]).length).toBeLessThanOrEqual(20);
  });

  it('bloquea la devolución documental fuera de un expediente en Verificación', async () => {
    integranteRepositoryTransaccional.findOne.mockResolvedValue({
      id: 'integrante-1',
      expediente_id: 'expediente-1',
      estado: IntegranteEstado.SUJETA_CREDITO,
    });
    expedienteRepositoryTransaccional.findOne.mockResolvedValue({
      id: 'expediente-1',
      estado: ExpedienteEstado.EN_DOCUMENTACION,
    });

    await expect(service.updateEstadoManual(
      'integrante-1',
      IntegranteEstado.DOCUMENTANDO,
      scopeVerificador,
      ['ine'],
    )).rejects.toBeInstanceOf(ConflictException);
  });

  it('exige identificar al menos un documento observado', async () => {
    await expect(service.updateEstadoManual(
      'integrante-1',
      IntegranteEstado.DOCUMENTANDO,
      scopeVerificador,
    )).rejects.toBeInstanceOf(BadRequestException);

    expect(integranteRepository.manager.transaction).not.toHaveBeenCalled();
  });

  it('mantiene bloqueados los dictámenes no implementados', async () => {
    await expect(service.updateEstadoManual(
      'integrante-1',
      IntegranteEstado.RECHAZADA,
      scopeVerificador,
    )).rejects.toBeInstanceOf(BadRequestException);

    expect(integranteRepository.manager.transaction).not.toHaveBeenCalled();
  });
});
