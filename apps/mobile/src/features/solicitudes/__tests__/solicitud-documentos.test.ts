import {
  crearDocumentosRequeridos,
  reconciliarDocumentosRequeridos,
} from '../solicitud-documentos';

jest.mock('../../../services/document-upload', () => ({
  uploadDocumentFiles: jest.fn(),
}));

describe('documentos requeridos de Solicitud', () => {
  it('no exige Control de pagos CRELEALTAD a una integrante nueva', () => {
    const documentos = crearDocumentosRequeridos(false);

    expect(documentos.some((documento) => documento.id === 'control_pagos_crelealtad')).toBe(false);
    expect(documentos.filter((documento) => documento.obligatorio)).toHaveLength(3);
  });

  it('coloca primero y exige dos imágenes del control desde ciclo 2', () => {
    const documentos = crearDocumentosRequeridos(true);

    expect(documentos[0]).toMatchObject({
      id: 'control_pagos_crelealtad',
      nombre: 'Control de pagos CRELEALTAD',
      obligatorio: true,
      status: 'PENDIENTE',
      cantidadImagenesRequerida: 2,
    });
    expect(documentos.filter((documento) => documento.obligatorio)).toHaveLength(4);
  });

  it('incorpora la nueva regla al recuperar un borrador anterior', () => {
    const borradorAnterior = crearDocumentosRequeridos(false);
    const reconciliados = reconciliarDocumentosRequeridos(borradorAnterior, true);

    expect(reconciliados[0]).toMatchObject({
      id: 'control_pagos_crelealtad',
      obligatorio: true,
      status: 'PENDIENTE',
    });
  });
});
