import { Injectable } from '@nestjs/common';
import { DocumentoClave, DocumentoEntity, DocumentoEstado } from './documentos.entity';

const DOCUMENTOS_BASE: Array<Pick<DocumentoEntity, 'clave' | 'nombre' | 'requerido'>> = [
  { clave: 'solicitud_fisica', nombre: 'Solicitud fisica', requerido: true },
  { clave: 'ine', nombre: 'INE', requerido: true },
  { clave: 'comprobante_domicilio', nombre: 'Comprobante domicilio', requerido: true },
  { clave: 'comprobante_credito_externo', nombre: 'Comprobante credito externo', requerido: false },
];

@Injectable()
export class DocumentosService {
  private documentos: DocumentoEntity[] = [
    {
      id: 'doc-sol-demo-completa-solicitud_fisica',
      solicitanteId: 'sol-demo-completa',
      clave: 'solicitud_fisica',
      nombre: 'Solicitud fisica',
      requerido: true,
      estado: 'Capturado',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'doc-sol-demo-completa-ine',
      solicitanteId: 'sol-demo-completa',
      clave: 'ine',
      nombre: 'INE',
      requerido: true,
      estado: 'Capturado',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'doc-sol-demo-completa-comprobante_domicilio',
      solicitanteId: 'sol-demo-completa',
      clave: 'comprobante_domicilio',
      nombre: 'Comprobante domicilio',
      requerido: true,
      estado: 'Capturado',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'doc-sol-demo-completa-comprobante_credito_externo',
      solicitanteId: 'sol-demo-completa',
      clave: 'comprobante_credito_externo',
      nombre: 'Comprobante credito externo',
      requerido: false,
      estado: 'Pendiente',
      updatedAt: new Date().toISOString(),
    },
  ];

  listBySolicitante(solicitanteId: string): DocumentoEntity[] {
    this.ensureDefaults(solicitanteId);

    return this.documentos.filter((documento) => documento.solicitanteId === solicitanteId);
  }

  updateStatus(solicitanteId: string, clave: DocumentoClave, estado: DocumentoEstado): DocumentoEntity | undefined {
    this.ensureDefaults(solicitanteId);

    const documento = this.documentos.find(
      (currentDocumento) => currentDocumento.solicitanteId === solicitanteId && currentDocumento.clave === clave,
    );

    if (!documento) {
      return undefined;
    }

    documento.estado = estado;
    documento.updatedAt = new Date().toISOString();
    return documento;
  }

  private ensureDefaults(solicitanteId: string) {
    const existing = this.documentos.filter((documento) => documento.solicitanteId === solicitanteId);
    if (existing.length > 0) {
      return;
    }

    const now = new Date().toISOString();
    this.documentos.push(
      ...DOCUMENTOS_BASE.map((documentoBase) => ({
        id: `doc-${solicitanteId}-${documentoBase.clave}`,
        solicitanteId,
        clave: documentoBase.clave,
        nombre: documentoBase.nombre,
        requerido: documentoBase.requerido,
        estado: 'Pendiente' as DocumentoEstado,
        updatedAt: now,
      })),
    );
  }
}