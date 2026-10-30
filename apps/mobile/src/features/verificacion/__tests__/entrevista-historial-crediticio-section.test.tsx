import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import { Alert } from 'react-native';
import { EntrevistaHistorialCrediticioSection } from '../EntrevistaHistorialCrediticioSection';

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

jest.mock('../../../context/ProcessingContext', () => ({
  useProcessingAction: (action: unknown) => action,
}));

const noop = () => undefined;

describe('historial crediticio de Entrevista', () => {
  it('no abre el selector de financiera al restaurar una entrevista contestada', async () => {
    const view = await render(
      <EntrevistaHistorialCrediticioSection
        tieneOtroCreditoGrupal="Sí"
        financieraCreditoGrupal="CrediMujer"
        creditoGrupalAnteriorActivo="Sí"
        valorFichaCreditoGrupal="$ 1,000"
        montoUltimoPrestamoCreditoGrupal="$ 18,000"
        semanaActualCreditoGrupal="1"
        mesDesembolsoCreditoGrupal="Enero"
        mesUltimoPagoCreditoGrupal=""
        anioUltimoPagoCreditoGrupal=""
        semanasDesdeUltimoPagoCreditoGrupal={null}
        numeroCiclosCreditoGrupal="1"
        tasaCreditoGrupal="65"
        nombreAsesoraCreditoGrupal=""
        telefonoAsesoraCreditoGrupal=""
        motivoNoRenovacionCreditoGrupal=""
        tipoEvidenciaActual={null}
        tipoEvidenciaGuardando={null}
        loadingEvidencias={false}
        loadingComprobante={false}
        evidenciasPendientes={0}
        fotografiasGuardadas={0}
        paginasEvidencias={[]}
        opcionesIntegrantesEvidencia={[]}
        motivosClasificacionEvidencia={[]}
        errorMotivosClasificacionEvidencia={null}
        integrantesEvidenciaSeleccionadas={[]}
        evidenciaPendienteClasificacion={null}
        evidenciaPendienteDeAsignar={false}
        errorEvidencias={null}
        errorComprobante={null}
        onTieneOtroCreditoGrupalChange={noop}
        onFinancieraCreditoGrupalChange={noop}
        onCreditoGrupalAnteriorActivoChange={noop}
        onValorFichaCreditoGrupalChange={noop}
        onMontoUltimoPrestamoCreditoGrupalChange={noop}
        onSemanaActualCreditoGrupalChange={noop}
        onMesDesembolsoCreditoGrupalChange={noop}
        onUltimoPagoCreditoGrupalChange={noop}
        onNumeroCiclosCreditoGrupalChange={noop}
        onTasaCreditoGrupalChange={noop}
        onNombreAsesoraCreditoGrupalChange={noop}
        onTelefonoAsesoraCreditoGrupalChange={noop}
        onMotivoNoRenovacionCreditoGrupalChange={noop}
        onLimpiarCreditoGrupal={noop}
        onLimpiarRutaCreditoGrupal={noop}
        onReintentarComprobante={noop}
        onCapturarEvidencia={noop}
        onSeleccionarEvidenciaCarrete={noop}
        onIntegrantesEvidenciaChange={noop}
        onGuardarEvidenciaParaIntegrantes={noop}
        onClasificarEvidencia={noop}
        onDescartarEvidenciaPendiente={noop}
        onReintentarEvidencias={noop}
      />,
    );

    expect(view.queryByText('¿Con qué financiera tuvo su último crédito grupal?')).toBeNull();
    expect(view.getByText('¿Qué monto fue su último préstamo? *')).toBeTruthy();
    expect(view.getByText('¿Qué tasa maneja?')).toBeTruthy();
    expect(view.queryByText('¿Qué tasa maneja? *')).toBeNull();
    expect(view.getByDisplayValue('$ 18,000')).toBeTruthy();
  }, 30_000);

  it('permite elegir cámara o carrete al agregar evidencia de otra financiera', async () => {
    const onCapturarEvidencia = jest.fn();
    const onSeleccionarEvidenciaCarrete = jest.fn();
    const alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const view = await render(
      <EntrevistaHistorialCrediticioSection
        tieneOtroCreditoGrupal="Sí"
        financieraCreditoGrupal="CrediMujer"
        creditoGrupalAnteriorActivo="Sí"
        valorFichaCreditoGrupal="$ 1,000"
        montoUltimoPrestamoCreditoGrupal="$ 18,000"
        semanaActualCreditoGrupal="1"
        mesDesembolsoCreditoGrupal="Enero"
        mesUltimoPagoCreditoGrupal=""
        anioUltimoPagoCreditoGrupal=""
        semanasDesdeUltimoPagoCreditoGrupal={null}
        numeroCiclosCreditoGrupal="1"
        tasaCreditoGrupal="65"
        nombreAsesoraCreditoGrupal=""
        telefonoAsesoraCreditoGrupal=""
        motivoNoRenovacionCreditoGrupal=""
        tipoEvidenciaActual="HISTORIAL_CREDITO_ACTIVO"
        tipoEvidenciaGuardando={null}
        loadingEvidencias={false}
        loadingComprobante={false}
        evidenciasPendientes={0}
        fotografiasGuardadas={0}
        paginasEvidencias={[]}
        opcionesIntegrantesEvidencia={[{
          label: 'Integrante disponible',
          value: '11111111-1111-4111-8111-111111111111',
        }]}
        motivosClasificacionEvidencia={[]}
        errorMotivosClasificacionEvidencia={null}
        integrantesEvidenciaSeleccionadas={[]}
        evidenciaPendienteClasificacion={null}
        evidenciaPendienteDeAsignar={false}
        errorEvidencias={null}
        errorComprobante={null}
        onTieneOtroCreditoGrupalChange={noop}
        onFinancieraCreditoGrupalChange={noop}
        onCreditoGrupalAnteriorActivoChange={noop}
        onValorFichaCreditoGrupalChange={noop}
        onMontoUltimoPrestamoCreditoGrupalChange={noop}
        onSemanaActualCreditoGrupalChange={noop}
        onMesDesembolsoCreditoGrupalChange={noop}
        onUltimoPagoCreditoGrupalChange={noop}
        onNumeroCiclosCreditoGrupalChange={noop}
        onTasaCreditoGrupalChange={noop}
        onNombreAsesoraCreditoGrupalChange={noop}
        onTelefonoAsesoraCreditoGrupalChange={noop}
        onMotivoNoRenovacionCreditoGrupalChange={noop}
        onLimpiarCreditoGrupal={noop}
        onLimpiarRutaCreditoGrupal={noop}
        onReintentarComprobante={noop}
        onCapturarEvidencia={onCapturarEvidencia}
        onSeleccionarEvidenciaCarrete={onSeleccionarEvidenciaCarrete}
        onIntegrantesEvidenciaChange={noop}
        onGuardarEvidenciaParaIntegrantes={noop}
        onClasificarEvidencia={noop}
        onDescartarEvidenciaPendiente={noop}
        onReintentarEvidencias={noop}
      />,
    );

    await fireEvent.press(view.getByText('Agregar evidencia'));
    const acciones = alerta.mock.calls[0]?.[2] ?? [];
    acciones.find((accion) => accion.text === 'Tomar foto')?.onPress?.();
    acciones.find((accion) => accion.text === 'Elegir del carrete')?.onPress?.();

    expect(onCapturarEvidencia).toHaveBeenCalledWith('HISTORIAL_CREDITO_ACTIVO');
    expect(onSeleccionarEvidenciaCarrete).toHaveBeenCalledWith('HISTORIAL_CREDITO_ACTIVO');
    alerta.mockRestore();
  }, 30_000);
});
