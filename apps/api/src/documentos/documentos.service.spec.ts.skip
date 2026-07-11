import { DocumentosService } from './documentos.service';

describe('DocumentosService', () => {
  it('returns default documents and updates a required document status', () => {
    const service = new DocumentosService();

    const initial = service.listBySolicitante('sol-1');
    const updated = service.updateStatus('sol-1', 'ine', 'Capturado');
    const current = service.listBySolicitante('sol-1');

    expect(initial).toHaveLength(4);
    expect(updated?.estado).toBe('Capturado');
    expect(current.find((documento) => documento.clave === 'ine')?.estado).toBe('Capturado');
    expect(current.find((documento) => documento.clave === 'comprobante_credito_externo')?.requerido).toBe(false);
  });
});