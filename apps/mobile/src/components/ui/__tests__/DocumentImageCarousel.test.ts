import { describe, expect, it } from '@jest/globals';
import {
  getDocumentImageCarouselPageAction,
  type DocumentImageCarouselPage,
} from '../DocumentImageCarousel';

describe('acciones del DocumentImageCarousel', () => {
  it('cierra el visor antes de editar los integrantes de la evidencia', async () => {
    const events: string[] = [];
    const page: DocumentImageCarouselPage = {
      uri: 'file:///evidencia.jpg',
      label: 'Evidencia 1',
      leftAction: {
        title: 'Integrantes',
        onPress: () => {
          events.push('editar');
        },
      },
    };

    const action = getDocumentImageCarouselPageAction(page, () => {
      events.push('cerrar');
    });
    await action?.onPress();

    expect(action?.title).toBe('Integrantes');
    expect(events).toEqual(['cerrar', 'editar']);
  });

  it('no agrega una acción a fotografías que no son editables', () => {
    expect(getDocumentImageCarouselPageAction({
      uri: 'file:///comprobante.jpg',
      label: 'Frente',
    }, () => undefined)).toBeUndefined();
  });
});
