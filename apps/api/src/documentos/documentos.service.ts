import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentoEntity, DocumentoTipo, DocumentoEstado } from './documento.entity';
import { IntegrantesService } from '../integrantes/integrantes.service';

@Injectable()
export class DocumentosService {
  constructor(
    @InjectRepository(DocumentoEntity)
    private readonly documentoRepository: Repository<DocumentoEntity>,
    @Inject(forwardRef(() => IntegrantesService))
    private readonly integrantesService: IntegrantesService,
  ) {}

  async listBySolicitante(solicitanteId: string): Promise<DocumentoEntity[]> {
    try {
      const documentos = await this.documentoRepository.find({
        where: { solicitanteId },
      });

      // Si no hay documentos, retornar los 4 tipos base como PENDIENTE
      // (NO los creamos en BD todavía)
      if (documentos.length === 0) {
        return Object.values(DocumentoTipo).map((tipo) => ({
          id: '', // Temporal, no guardado
          solicitanteId,
          tipo,
          estado: DocumentoEstado.PENDIENTE,
          archivoBase64: null,
          archivoNombre: null,
          fechaCarga: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })) as DocumentoEntity[];
      }

      // Retornar los que existen + llenar los faltantes como PENDIENTE
      const tiposExistentes = new Set(documentos.map((d) => d.tipo));
      const faltantes = Object.values(DocumentoTipo)
        .filter((tipo) => !tiposExistentes.has(tipo))
        .map((tipo) => ({
          id: '', // Temporal
          solicitanteId,
          tipo,
          estado: DocumentoEstado.PENDIENTE,
          archivoBase64: null,
          archivoNombre: null,
          fechaCarga: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })) as DocumentoEntity[];

      return [...documentos, ...faltantes];
    } catch (error) {
      console.error('Error al cargar documentos:', error);
      // Retornar array vacío en caso de error para no romper el flujo
      return [];
    }
  }

  async updateStatus(
    solicitanteId: string,
    tipo: DocumentoTipo,
    estado: DocumentoEstado,
  ): Promise<DocumentoEntity> {
    const existing = await this.documentoRepository.findOne({
      where: { solicitanteId, tipo },
    });

    if (existing) {
      existing.estado = estado;
      existing.updatedAt = new Date();
      return this.documentoRepository.save(existing);
    }

    // Crear nuevo documento
    const documento = this.documentoRepository.create({
      solicitanteId,
      tipo,
      estado,
    });

    return this.documentoRepository.save(documento);
  }

  async cargarDocumento(
    solicitanteId: string,
    tipo: DocumentoTipo,
    archivoBase64: string,
    archivoNombre: string,
  ): Promise<DocumentoEntity> {
    // Buscar si ya existe un documento de este tipo
    const existing = await this.documentoRepository.findOne({
      where: { solicitanteId, tipo },
    });

    if (existing) {
      // Actualizar el existente
      existing.archivoBase64 = archivoBase64;
      existing.archivoNombre = archivoNombre;
      existing.estado = DocumentoEstado.CARGADO;
      existing.fechaCarga = new Date();
      const savedDoc = await this.documentoRepository.save(existing);

      // TODO: Recalcular estado del integrante
      // await this.integrantesService.recalcularEstado(solicitanteId);

      return savedDoc;
    }

    // Crear nuevo documento
    const documento = this.documentoRepository.create({
      solicitanteId,
      tipo,
      archivoBase64,
      archivoNombre,
      estado: DocumentoEstado.CARGADO,
      fechaCarga: new Date(),
    });

    const savedDoc = await this.documentoRepository.save(documento);

    // TODO: Recalcular estado del integrante
    // await this.integrantesService.recalcularEstado(solicitanteId);

    return savedDoc;
  }

  async verificarDocumento(documentoId: string): Promise<DocumentoEntity> {
    const documento = await this.documentoRepository.findOne({
      where: { id: documentoId },
    });

    if (!documento) {
      throw new Error(`Documento con ID ${documentoId} no encontrado`);
    }

    documento.estado = DocumentoEstado.VERIFICADO;
    return this.documentoRepository.save(documento);
  }
}
