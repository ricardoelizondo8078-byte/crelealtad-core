import { render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import { EntrevistaEncuestasSection } from '../EntrevistaEncuestasSection';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    mergeItem: jest.fn(),
    clear: jest.fn(),
    getAllKeys: jest.fn(),
    multiGet: jest.fn(),
    multiSet: jest.fn(),
    multiRemove: jest.fn(),
    multiMerge: jest.fn(),
  },
}));

const noop = () => undefined;

describe('encuesta de servicio de Entrevista', () => {
  it('mantiene visible la oportunidad de mejora sin marcarla como obligatoria', async () => {
    const pregunta = '¿En qué cree usted que podemos mejorar?';
    const view = await render(
      <EntrevistaEncuestasSection
        mostrarControlTesorera={false}
        mostrarEncuestaServicio
        tieneControlPagos=""
        motivoSinControl=""
        asesoraAcudioSemanalmente=""
        firmabanControlSemanalmente=""
        tratoAsesoraTesorera=""
        conocePremioTesorera=""
        opinionCredito=""
        tratoDesembolso=""
        rapidezDesembolso=""
        informacionCreditoClara=""
        recomendaria=""
        razonRecomendacion=""
        motivoRecomendacion=""
        guardandoEvidencia={null}
        fotoControlPagos={null}
        fotoControlPagosPendiente={null}
        fotoFolleto={null}
        fotoFolletoPendiente={null}
        onTieneControlPagosChange={noop}
        onMotivoSinControlChange={noop}
        onAsesoraAcudioSemanalmenteChange={noop}
        onFirmabanControlSemanalmenteChange={noop}
        onTratoAsesoraTesoreraChange={noop}
        onConocePremioTesoreraChange={noop}
        onOpinionCreditoChange={noop}
        onTratoDesembolsoChange={noop}
        onRapidezDesembolsoChange={noop}
        onInformacionCreditoClaraChange={noop}
        onRecomendariaChange={noop}
        onRazonRecomendacionChange={noop}
        onMotivoRecomendacionChange={noop}
        onAbrirControlPagos={noop}
        onCapturarControlPagos={noop}
        onReintentarControlPagos={noop}
        onAbrirFolleto={noop}
        onCapturarFolleto={noop}
        onReintentarFolleto={noop}
      />,
    );

    expect(view.getByText(pregunta)).toBeTruthy();
    expect(view.queryByText(`${pregunta} *`)).toBeNull();
  });
});
