import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpedientesService } from '../expedientes/expedientes.service';
import { GrupoEntity, GrupoStatus } from './grupo.entity';
import { SolicitanteEstado } from '../solicitantes/solicitante.entity';

@Injectable()
export class GruposService {
  constructor(
    @InjectRepository(GrupoEntity)
    private readonly grupoRepository: Repository<GrupoEntity>,
    private readonly expedientesService: ExpedientesService,
  ) {}

  async create(dto: { name: string; advisorName?: string; createdBy?: string }) {
    const normalizedName = dto.name.trim().toUpperCase();

    const grupo = this.grupoRepository.create({
      name: normalizedName,
      advisorName: dto.advisorName,
      createdBy: dto.createdBy,
      status: GrupoStatus.FORMANDO,
    });

    const savedGrupo = await this.grupoRepository.save(grupo);

    const createdExpediente = await this.expedientesService.createForGroup({
      groupId: savedGrupo.id,
      title: normalizedName,
      status: 'En proceso',
    });

    return {
      ...savedGrupo,
      expediente: createdExpediente,
    };
  }

  async getById(id: string): Promise<any> {
    const grupo = await this.grupoRepository.findOne({
      where: { id },
      relations: {
        expedientes: {
          solicitantes: {
            documentos: true,
          },
        },
      },
    });

    if (!grupo) {
      return null;
    }

    // Obtener el expediente principal (normalmente solo hay uno por grupo)
    const expediente = grupo.expedientes?.[0];

    if (!expediente) {
      return {
        ...grupo,
        expediente: null,
        integrantes: [],
        resumen: this.calcularResumenVacio(),
        estadoCalculado: GrupoStatus.FORMANDO,
      };
    }

    // Formatear integrantes con sus documentos
    const integrantes = expediente.solicitantes.map((solicitante) => ({
      id: solicitante.id,
      nombre: solicitante.nombre,
      telefono: solicitante.telefono,
      montoSolicitado: solicitante.montoSolicitado,
      estado: solicitante.estado,
      documentos: solicitante.documentos.map((doc) => ({
        tipo: doc.tipo,
        estado: doc.estado,
      })),
    }));

    // Calcular resumen
    const resumen = this.calcularResumen(expediente.solicitantes);

    // Calcular estado del grupo
    const estadoCalculado = this.calcularEstadoGrupo(resumen, grupo.status);

    return {
      id: grupo.id,
      name: grupo.name,
      advisorName: grupo.advisorName,
      status: grupo.status,
      expediente: {
        id: expediente.id,
        title: expediente.title,
        status: expediente.status,
      },
      integrantes,
      resumen,
      estadoCalculado,
    };
  }

  private calcularResumenVacio() {
    return {
      total: 0,
      documentando: 0,
      sujetasCredito: 0,
      enVerificacion: 0,
      autorizadas: 0,
      rechazadas: 0,
      activasParaCredito: 0,
    };
  }

  private calcularResumen(solicitantes: any[]) {
    const resumen = {
      total: solicitantes.length,
      documentando: 0,
      sujetasCredito: 0,
      enVerificacion: 0,
      autorizadas: 0,
      rechazadas: 0,
      activasParaCredito: 0,
    };

    solicitantes.forEach((solicitante) => {
      switch (solicitante.estado) {
        case SolicitanteEstado.DOCUMENTANDO:
          resumen.documentando++;
          break;
        case SolicitanteEstado.SUJETA_CREDITO:
          resumen.sujetasCredito++;
          resumen.activasParaCredito++;
          break;
        case SolicitanteEstado.EN_VERIFICACION:
          resumen.enVerificacion++;
          resumen.activasParaCredito++;
          break;
        case SolicitanteEstado.AUTORIZADA:
          resumen.autorizadas++;
          resumen.activasParaCredito++;
          break;
        case SolicitanteEstado.RECHAZADA:
          resumen.rechazadas++;
          break;
      }
    });

    return resumen;
  }

  private calcularEstadoGrupo(
    resumen: { activasParaCredito: number; sujetasCredito: number; autorizadas: number },
    statusManual: GrupoStatus,
  ): GrupoStatus {
    // Si el status manual es EN_REVISION, respetar ese estado
    if (statusManual === GrupoStatus.EN_REVISION) {
      return GrupoStatus.EN_REVISION;
    }

    // AUTORIZADO: 6 o más autorizadas
    if (resumen.autorizadas >= 6) {
      return GrupoStatus.AUTORIZADO;
    }

    // LISTO_PARA_REVISION: 6 o más sujetas a crédito
    if (resumen.sujetasCredito >= 6) {
      return GrupoStatus.LISTO_PARA_REVISION;
    }

    // FORMANDO: menos de 6 activas para crédito
    return GrupoStatus.FORMANDO;
  }
}
