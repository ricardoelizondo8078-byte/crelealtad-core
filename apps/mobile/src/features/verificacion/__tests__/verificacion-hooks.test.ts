import { act, renderHook } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import { useDocumentoRevisionModal } from '../useDocumentoRevisionModal';
import { useEntrevistaForm } from '../useEntrevistaForm';
import type { DocumentoItem } from '../verificacion-individual.types';

describe('hooks de coordinación de Verificación', () => {
  it('conserva una única fuente de estado para la entrevista', async () => {
    const { result } = await renderHook(() => useEntrevistaForm());

    await act(async () => {
      result.current.setConoceAsesora('Sí');
      result.current.setFuentesIngresoPersonal(['Sueldo', 'Negocio']);
      result.current.setCapacidadPagoSemanal('850');
    });

    expect(result.current.values).toMatchObject({
      conoceAsesora: 'Sí',
      fuentesIngresoPersonal: ['Sueldo', 'Negocio'],
      capacidadPagoSemanal: '850',
    });
  });

  it('abre cada documento desde el frente y conserva la selección del lado', async () => {
    const documento = {
      clave: 'ine',
      tipo: 'ine',
      obligatorioRevision: true,
      nombre: 'INE',
      icono: '🪪',
      estado: 'Capturado',
    } satisfies DocumentoItem;
    const { result } = await renderHook(() => useDocumentoRevisionModal());

    await act(async () => result.current.abrirDocumento(documento));
    expect(result.current.showDocumentModal).toBe(true);
    expect(result.current.documentoViewing).toBe(documento);
    expect(result.current.ladoSeleccionado).toBe('frente');

    await act(async () => result.current.setLadoSeleccionado('reverso'));
    expect(result.current.ladoSeleccionado).toBe('reverso');

    await act(async () => result.current.cerrarDocumento());
    expect(result.current.showDocumentModal).toBe(false);
  });
});
