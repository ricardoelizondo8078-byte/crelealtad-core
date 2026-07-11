import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolicitanteEntity, SolicitanteEstado } from './solicitante.entity';
import { DocumentoTipo, DocumentoEstado } from '../documentos/documento.entity';

@Injectable()
export class SolicitantesService {
  constructor(
    @InjectRepository(SolicitanteEntity)
    private readonly solicitanteRepository: Repository<SolicitanteEntity>,
  ) {}

  async listByExpediente(expedienteId: string): Promise<SolicitanteEntity[]> {
    return this.solicitanteRepository.find({
      where: { expedienteId },
    });
  }

  async getById(id: string): Promise<any> {
    const solicitante = await this.solicitanteRepository.findOne({
      where: { id },
      relations: {
        solicitud: true,
        documentos: true,
      },
    });

    if (!solicitante) {
      return null;
    }

    // Transformar la respuesta para incluir documentos en formato resumido
    return {
      ...solicitante,
      documentos: solicitante.documentos.map((doc) => ({
        tipo: doc.tipo,
        estado: doc.estado,
        fechaCarga: doc.fechaCarga,
      })),
    };
  }

  async createForExpediente(dto: {
    expedienteId: string;
    nombre: string;
    nombres?: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
    telefono: string;
    telefonoSecundario?: string;
    montoSolicitado: number;
  }): Promise<SolicitanteEntity> {
    const solicitante = this.solicitanteRepository.create({
      expedienteId: dto.expedienteId,
      nombre: dto.nombre,
      nombres: dto.nombres,
      apellidoPaterno: dto.apellidoPaterno,
      apellidoMaterno: dto.apellidoMaterno,
      telefono: dto.telefono,
      telefonoSecundario: dto.telefonoSecundario,
      montoSolicitado: dto.montoSolicitado,
      estado: SolicitanteEstado.DOCUMENTANDO,
    });

    return this.solicitanteRepository.save(solicitante);
  }

  async updateEstadoManual(id: string, estado: SolicitanteEstado): Promise<SolicitanteEntity> {
    const solicitante = await this.solicitanteRepository.findOne({
      where: { id },
    });

    if (!solicitante) {
      throw new Error(`Solicitante con ID ${id} no encontrado`);
    }

    // Solo permitir cambios manuales a estos estados
    const estadosPermitidos = [
      SolicitanteEstado.EN_VERIFICACION,
      SolicitanteEstado.AUTORIZADA,
      SolicitanteEstado.RECHAZADA,
    ];

    if (!estadosPermitidos.includes(estado)) {
      throw new Error(`Solo se permiten cambios manuales a: ${estadosPermitidos.join(', ')}`);
    }

    solicitante.estado = estado;
    return this.solicitanteRepository.save(solicitante);
  }

  private async calcularYActualizarEstado(solicitanteId: string): Promise<void> {
    const solicitante = await this.solicitanteRepository.findOne({
      where: { id: solicitanteId },
      relations: {
        solicitud: true,
        documentos: true,
      },
    });

    if (!solicitante) {
      return;
    }

    // No cambiar estados manuales
    const estadosInmutables = [
      SolicitanteEstado.EN_VERIFICACION,
      SolicitanteEstado.AUTORIZADA,
      SolicitanteEstado.RECHAZADA,
    ];

    if (estadosInmutables.includes(solicitante.estado)) {
      return;
    }

    // Verificar si cumple criterios para SUJETA_CREDITO
    const cumpleCriterios = this.cumpleCriteriosSujetaCredito(solicitante);

    // Actualizar estado solo si es necesario
    if (cumpleCriterios && solicitante.estado !== SolicitanteEstado.SUJETA_CREDITO) {
      solicitante.estado = SolicitanteEstado.SUJETA_CREDITO;
      await this.solicitanteRepository.save(solicitante);
    } else if (!cumpleCriterios && solicitante.estado === SolicitanteEstado.SUJETA_CREDITO) {
      solicitante.estado = SolicitanteEstado.DOCUMENTANDO;
      await this.solicitanteRepository.save(solicitante);
    }
  }

  private cumpleCriteriosSujetaCredito(solicitante: SolicitanteEntity): boolean {
    // 1. Datos personales completos
    const datosCompletos =
      !!solicitante.nombres &&
      solicitante.nombres.trim() !== '' &&
      !!solicitante.apellidoPaterno &&
      solicitante.apellidoPaterno.trim() !== '' &&
      !!solicitante.apellidoMaterno &&
      solicitante.apellidoMaterno.trim() !== '' &&
      !!solicitante.telefono &&
      solicitante.telefono.trim() !== '';

    // 2. Monto solicitado mayor a 0
    const montoValido = solicitante.montoSolicitado > 0;

    // 3. Al menos 1 documento INE CARGADO
    const tieneINE = solicitante.documentos.some(
      (doc) => doc.tipo === DocumentoTipo.INE && doc.estado === DocumentoEstado.CARGADO,
    );

    return datosCompletos && montoValido && tieneINE;
  }

  // Método público para ser llamado desde solicitudes.service
  async recalcularEstado(solicitanteId: string): Promise<void> {
    await this.calcularYActualizarEstado(solicitanteId);
  }
}
