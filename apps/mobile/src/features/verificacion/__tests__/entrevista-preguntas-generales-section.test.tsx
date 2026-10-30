import { render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import { EntrevistaPreguntasGeneralesSection } from '../EntrevistaPreguntasGeneralesSection';

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

const renderSection = (
  abrirComoConocioAsesora: boolean,
  comoConocioAsesora = 'Por otra integrante',
) => render(
  <EntrevistaPreguntasGeneralesSection
    guardando={false}
    errorGuardado={null}
    entrevistaCargada
    entrevistaConfirmada
    guardadoLocalPendiente={false}
    conoceAsesora="Sí"
    comoConocioAsesora={comoConocioAsesora}
    abrirComoConocioAsesora={abrirComoConocioAsesora}
    conoceIntegrantes="No"
    tiempoConoceIntegrantes=""
    sabeMontosCompaneras="Sí"
    acuerdoMontos="Sí"
    integrantesGrupo={[]}
    integranteId="00000000-0000-4000-8000-000000000001"
    montoTotalSolicitadoGrupo={null}
    companerasMontoNoAcordadoIds={[]}
    motivosDesacuerdoMontosPorIntegrante={{}}
    conoceTesoreraDelGrupo="No"
    quienEsTesorera=""
    domicilioRecoleccion="NO_SABE"
    tieneFamiliarGrupo="No"
    familiaresGrupoIds={[]}
    onRecuperarEntrevista={noop}
    onReintentarGuardado={noop}
    onConoceAsesoraChange={noop}
    onComoConocioAsesoraChange={noop}
    onConoceIntegrantesChange={noop}
    onTiempoConoceIntegrantesChange={noop}
    onSabeMontosCompanerasChange={noop}
    onAcuerdoMontosChange={noop}
    onCompanerasMontoNoAcordadoChange={noop}
    onMotivosDesacuerdoChange={noop}
    onConoceTesoreraChange={noop}
    onQuienEsTesoreraChange={noop}
    onDomicilioRecoleccionChange={noop}
    onTieneFamiliarGrupoChange={noop}
    onFamiliaresGrupoChange={noop}
  />,
);

describe('preguntas generales de Entrevista', () => {
  it('no abre cómo conoció a la asesora sólo por restaurar una respuesta', async () => {
    const view = await renderSection(false);

    expect(view.queryByText('¿Cómo conoció a la asesora?')).toBeNull();
  });

  it('no lo autoabre si la respuesta ya está completa aunque exista una orden anterior', async () => {
    const view = await renderSection(true);

    expect(view.queryByText('¿Cómo conoció a la asesora?')).toBeNull();
  });

  it('permite abrir el selector después de una elección nueva de Sí sin respuesta previa', async () => {
    const view = await renderSection(true, '');

    expect(view.getByText('¿Cómo conoció a la asesora?')).toBeTruthy();
  });
});
