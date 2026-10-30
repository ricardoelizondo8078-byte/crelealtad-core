import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import { colors, moduleThemes, radius, spacing, touchTargets } from '../../../theme/tokens';
import { ConclusionesResumen } from '../ConclusionesResumen';
import { NO_SABE_DOMICILIO_RECOLECCION_VALUE } from '../verificacion-entrevista.catalog';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('@expo/vector-icons/FontAwesome', () => ({
  __esModule: true,
  default: 'FontAwesome',
}));

jest.mock('../../../context/ProcessingContext', () => ({
  useProcessingAction: (action: unknown) => action,
}));

const integrantesGrupo = [
  { id: 'integrante-1', nombre: 'Ana López' },
  { id: 'integrante-2', nombre: 'Beatriz García' },
];

const historialCrelealtad = {
  totalCycles: 2,
  maximum: { authorizedAmount: 22000, cycleNumbers: [2] },
  minimum: { authorizedAmount: 18000, cycleNumbers: [1] },
  recentCycles: [
    { cycleNumber: 2, authorizedAmount: 22000 },
    { cycleNumber: 1, authorizedAmount: 18000 },
  ],
};

const historialOtraFinanciera = {
  tieneOtroCreditoGrupal: 'Sí',
  financieraCreditoGrupal: 'Compartamos Banco',
  creditoGrupalAnteriorActivo: 'Sí',
  valorFichaCreditoGrupal: '2500',
  montoUltimoPrestamoCreditoGrupal: '18000',
  semanaActualCreditoGrupal: '13',
  mesDesembolsoCreditoGrupal: 'Julio',
  mesUltimoPagoCreditoGrupal: '',
  anioUltimoPagoCreditoGrupal: '',
  semanasDesdeUltimoPagoCreditoGrupal: null,
  numeroCiclosCreditoGrupal: '3',
  tasaCreditoGrupal: '74',
  motivoNoRenovacionCreditoGrupal: '',
  fotografiasGuardadas: 2,
  fotografiasPendientes: 0,
  fotografiasCalificables: 2,
  fotografiasCalificadas: {
    verdes: 1,
    amarillas: 1,
    rojas: 0,
  },
  fechaCapturaEntrevista: '2026-10-08T18:00:00.000Z',
  clasificacionFinanciera: 'OBJETIVO' as const,
};

const calificacionSemanaCredito = {
  id: 1,
  verde_desde: 1,
  verde_hasta: 10,
  amarillo_desde: 11,
  amarillo_hasta: 13,
  rojo_desde: 14,
  rojo_hasta: 16,
  updated_at: '2026-10-11T12:00:00.000Z',
};

const calificacionCiclosCredito = {
  id: 1,
  verde_desde: 3,
  verde_hasta: 40,
  amarillo_desde: 2,
  amarillo_hasta: 2,
  rojo_desde: 1,
  rojo_hasta: 1,
  updated_at: '2026-10-11T12:00:00.000Z',
};

const toleranciaSemanaDesembolso = {
  id: 1,
  verde_desde: 0,
  verde_hasta: 0,
  amarillo_desde: 1,
  amarillo_hasta: 3,
  rojo_desde: 4,
  rojo_hasta: 10,
  updated_at: '2026-10-11T12:00:00.000Z',
};

const concordanciaFicha = {
  id: 1,
  verde_desde: 0,
  verde_hasta: 5,
  amarillo_desde: 6,
  amarillo_hasta: 10,
  rojo_desde: 11,
  rojo_hasta: 100,
  updated_at: '2026-10-11T12:00:00.000Z',
};

const concordanciaPrestamo = {
  ...concordanciaFicha,
  verde_desde: 6,
  verde_hasta: 10,
  amarillo_desde: 0,
  amarillo_hasta: 5,
};

const calificacionPromedioEvidencias = {
  id: 1,
  verde_desde: 67,
  verde_hasta: 100,
  amarillo_desde: 34,
  amarillo_hasta: 66,
  rojo_desde: 0,
  rojo_hasta: 33,
  updated_at: '2026-10-12T12:00:00.000Z',
};

describe('resumen de Conclusiones', () => {
  it('resume una integrante nueva, desacuerdos y respuestas positivas o negativas', async () => {
    const onVerEvidencias = jest.fn();
    const onVerFotografiasCasa = jest.fn();
    const onVerFotografiasNegocio = jest.fn();
    const view = await render(
      <ConclusionesResumen
        ciclosIndividualesRegistrados={1}
        esNuevaConNosotros={false}
        sabeMontosCompaneras="Si"
        acuerdoMontos="No"
        companerasMontoNoAcordadoIds={['integrante-1', 'integrante-2']}
        conoceTesoreraDelGrupo="Sí"
        quienEsTesorera="integrante-1"
        domicilioRecoleccion={NO_SABE_DOMICILIO_RECOLECCION_VALUE}
        integrantesGrupo={integrantesGrupo}
        tieneHistorialCrelealtad
        historialCrelealtad={historialCrelealtad}
        historialOtraFinanciera={historialOtraFinanciera}
        calificacionSemanaCredito={calificacionSemanaCredito}
        calificacionCiclosCredito={calificacionCiclosCredito}
        toleranciaSemanaDesembolso={toleranciaSemanaDesembolso}
        calificacionPromedioEvidencias={calificacionPromedioEvidencias}
        onVerEvidenciasOtraFinanciera={onVerEvidencias}
        fotografiasCasa={3}
        fotografiasNegocio={2}
        onVerFotografiasCasa={onVerFotografiasCasa}
        onVerFotografiasNegocio={onVerFotografiasNegocio}
      />,
    );

    expect(view.getByText('1 CICLO')).toHaveStyle({ fontWeight: '700' });
    expect(view.queryByText('!')).toBeNull();
    expect(view.getByText('SÍ SABE CUÁNTO PIDIERON SUS COMPAÑERAS')).toBeTruthy();
    expect(view.getByText('NO ESTÁ DE ACUERDO')).toBeTruthy();
    expect(view.getByText('Ana López · Beatriz García')).toBeTruthy();
    expect(view.getByText('SÍ CONOCE A LA TESORERA')).toBeTruthy();
    expect(view.getByText('NO SÉ DÓNDE SE RECOLECTARÁ')).toBeTruthy();
    expect(view.getByText('HISTORIAL CRELEALTAD')).toBeTruthy();
    expect(view.getByText('CON CRELEALTAD')).toBeTruthy();
    expect(view.getByText('HISTORIAL OTRAS FINANCIERAS')).toBeTruthy();
    expect(view.getByText('Compartamos Banco')).toBeTruthy();
    expect(view.queryByText(/OBJETIVO/)).toBeNull();
    expect(view.queryByText(/SIN CLASIFICAR/)).toBeNull();
    expect(view.getByTestId('summary-detail-value-positive-0')).toHaveStyle({
      backgroundColor: colors.successSoft,
      borderColor: colors.success,
    });
    expect(view.getByText('$ 2,500')).toBeTruthy();
    expect(view.getByLabelText(
      'ÚLT. PRÉSTAMO: $ 18,000, cálculo: $ 33,783, diferencia: 88%',
    )).toBeTruthy();
    expect(view.getByText('9 - 14 SEM')).toBeTruthy();
    expect(view.getByTestId('summary-detail-trailing-positive-3')).toHaveStyle({
      backgroundColor: colors.successSoft,
      borderColor: colors.success,
    });
    expect(view.getByTestId('summary-detail-primary-positive-3')).toHaveStyle({
      backgroundColor: colors.successSoft,
      borderColor: colors.success,
    });
    expect(view.getByTestId('summary-detail-row-0').props.accessibilityLabel).toContain('FINANCIERA');
    expect(view.getByTestId('summary-detail-row-1').props.accessibilityLabel)
      .toBe('ESTADO: 3 CICLOS, ACTIVO');
    expect(view.getByTestId('summary-detail-middle-positive-1')).toHaveStyle({
      backgroundColor: colors.successSoft,
      borderColor: colors.success,
    });
    expect(view.getByTestId('summary-detail-row-2').props.accessibilityLabel)
      .toBe('SEMANA ACTUAL: 13');
    expect(view.getByTestId('summary-detail-value-warning-2')).toHaveStyle({
      backgroundColor: colors.warningLight,
      borderColor: colors.warning,
    });
    expect(view.getByTestId('summary-detail-row-3').props.accessibilityLabel)
      .toContain('MES DE DESEMBOLSO: Julio');
    expect(view.getByTestId('summary-detail-row-3')).toHaveStyle({
      borderBottomWidth: 2,
      borderBottomColor: moduleThemes.verification.primary,
    });
    expect(view.getByTestId('summary-detail-row-4').props.accessibilityLabel)
      .toBe('VALOR DE FICHA: $ 2,500, cálculo: $ 1,332, diferencia: 47%');
    expect(view.getByTestId('summary-detail-row-5').props.accessibilityLabel)
      .toBe('ÚLT. PRÉSTAMO: $ 18,000, cálculo: $ 33,783, diferencia: 88%');
    expect(view.getByTestId('summary-detail-row-6').props.accessibilityLabel)
      .toBe('TASA: 74');
    expect(view.getByTestId('summary-detail-table-result-4')).toHaveStyle({
      width: '40%',
      alignItems: 'center',
      justifyContent: 'center',
    });
    expect(view.getByTestId('summary-detail-table-result-5')).toHaveStyle({
      width: '40%',
      alignItems: 'center',
      justifyContent: 'center',
    });
    expect(view.getByTestId('summary-detail-table-empty-6').children).toHaveLength(0);
    expect(view.getByTestId('summary-detail-table-label-4')).toHaveStyle({
      width: '33%',
      borderRightWidth: 2,
      borderRightColor: moduleThemes.verification.primary,
    });
    expect(view.getByTestId('summary-detail-table-value-4')).toHaveStyle({
      width: '27%',
      alignItems: 'center',
      justifyContent: 'center',
      borderRightWidth: 2,
      borderRightColor: moduleThemes.verification.primary,
    });
    expect(view.getByTestId('summary-detail-table-result-4')).toHaveStyle({ width: '40%' });
    expect(view.getByText('$ 2,500')).toHaveStyle({
      flex: 0,
      textAlign: 'center',
    });
    expect(view.getByTestId('summary-detail-table-result-content-4')).toHaveStyle({
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    });
    expect(view.getByTestId('summary-detail-table-result-value-4')).toBeTruthy();
    expect(view.getByTestId('summary-detail-table-result-detail-4')).toBeTruthy();
    expect(view.getByText('$ 1,332')).toBeTruthy();
    expect(view.getByText('$ 33,783')).toBeTruthy();
    expect(view.getByText('47%')).toBeTruthy();
    expect(view.getByText('88%')).toBeTruthy();
    expect(view.getByTestId('summary-detail-row-6')).toHaveStyle({
      borderBottomWidth: 2,
      borderBottomColor: moduleThemes.verification.primary,
    });
    expect(view.queryByText('ASESORA')).toBeNull();
    expect(view.queryByText('TELÉFONO DE LA ASESORA')).toBeNull();
    expect(view.getByText('3 CICLOS')).toBeTruthy();
    expect(view.getByText('REVISAR EVIDENCIA')).toBeTruthy();
    expect(view.getByTestId('summary-detail-action-segments-7')).toHaveStyle({
      minHeight: spacing.xxxl,
      flexDirection: 'row',
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: colors.textPrimary,
      borderRadius: radius.pill,
    });
    expect(view.getByTestId('summary-detail-action-segment-positive-7')).toHaveStyle({
      backgroundColor: colors.successSoft,
    });
    expect(view.getByTestId('summary-detail-action-segment-warning-7')).toHaveStyle({
      backgroundColor: colors.warningLight,
    });
    expect(view.getByTestId('summary-detail-action-segment-negative-7')).toHaveStyle({
      backgroundColor: colors.dangerSoft,
    });
    expect(view.getByTestId('summary-detail-action-segment-value-positive-7'))
      .toHaveTextContent('1');
    expect(view.getByTestId('summary-detail-action-segment-value-warning-7'))
      .toHaveTextContent('1');
    expect(view.getByTestId('summary-detail-action-segment-value-negative-7'))
      .toHaveTextContent('0');
    expect(view.getByLabelText('1 fotografías calificadas en verde')).toBeTruthy();
    expect(view.getByLabelText('1 fotografías calificadas en amarillo')).toBeTruthy();
    expect(view.getByLabelText('0 fotografías calificadas en rojo')).toBeTruthy();
    expect(view.getByText('75')).toHaveStyle({
      color: colors.textPrimary,
    });
    expect(view.getByLabelText('Promedio de calificación: 75 de 100')).toBeTruthy();
    expect(view.getByTestId('summary-detail-action-indicator-7')).toHaveStyle({
      width: touchTargets.minimum,
      height: touchTargets.minimum,
      borderWidth: 2,
      borderColor: colors.success,
      borderRadius: radius.pill,
      backgroundColor: colors.successSoft,
    });
    expect(view.getByTestId('summary-detail-action-container-7')).toHaveStyle({
      flex: 0.85,
    });
    expect(view.getByText('2 FOTOS')).toBeTruthy();
    expect(view.getByTestId('summary-detail-action-icon-camera-7')).toHaveProp(
      'color',
      moduleThemes.verification.primaryText,
    );
    const evidenceButton = view.getByLabelText(
      'Revisar evidencia de otra financiera: 2 fotos guardadas',
    );
    expect(evidenceButton).toBe(view.getByTestId('summary-detail-action-button-7'));
    expect(evidenceButton).toHaveStyle({
      minHeight: touchTargets.primary,
      borderWidth: 2,
      borderRadius: radius.md,
      borderColor: moduleThemes.verification.primary,
      backgroundColor: moduleThemes.verification.primary,
    });
    expect(view.getByText('2 FOTOS')).toHaveStyle({
      color: moduleThemes.verification.primaryText,
    });
    expect(view.getByLabelText('ESTADO: 3 CICLOS, ACTIVO')).toHaveStyle({ alignItems: 'center' });
    fireEvent.press(view.getByTestId('summary-detail-row-7'));
    fireEvent.press(view.getByTestId('summary-detail-action-indicator-7'));
    expect(onVerEvidencias).not.toHaveBeenCalled();
    fireEvent.press(evidenceButton);
    expect(onVerEvidencias).toHaveBeenCalledTimes(1);

    expect(view.getByText('FOTOGRAFÍAS')).toBeTruthy();
    const casaButton = view.getByLabelText(
      'Abrir fotografías de casa. 3 fotografías disponibles',
    );
    const negocioButton = view.getByLabelText(
      'Abrir fotografías de negocio. 2 fotografías disponibles',
    );
    expect(view.getByText('Casa')).toBeTruthy();
    expect(view.getByText('Negocio')).toBeTruthy();
    expect(casaButton).toHaveStyle({
      borderRadius: radius.md,
      backgroundColor: moduleThemes.verification.primary,
    });
    expect(negocioButton).toHaveStyle({
      borderRadius: radius.md,
      backgroundColor: moduleThemes.verification.primary,
    });
    expect(view.getByText('Casa')).toHaveStyle({
      color: moduleThemes.verification.primaryText,
    });
    expect(view.getByText('Negocio')).toHaveStyle({
      color: moduleThemes.verification.primaryText,
    });
    expect(view.getByTestId('conclusiones-fotografias-casa-icon')).toHaveProp('name', 'home');
    expect(view.getByTestId('conclusiones-fotografias-casa-icon')).toHaveProp(
      'color',
      moduleThemes.verification.primaryText,
    );
    expect(view.getByTestId('conclusiones-fotografias-negocio-icon')).toHaveProp(
      'name',
      'briefcase',
    );
    expect(view.getByTestId('conclusiones-fotografias-negocio-icon')).toHaveProp(
      'color',
      moduleThemes.verification.primaryText,
    );

    expect(view.getByLabelText(/Resultado positivo: SÍ CONOCE A LA TESORERA/)).toHaveStyle({
      backgroundColor: colors.successSoft,
      borderColor: colors.success,
    });
    expect(view.getByLabelText(/Resultado negativo: NO SÉ DÓNDE SE RECOLECTARÁ/)).toHaveStyle({
      backgroundColor: colors.dangerSoft,
      borderColor: colors.danger,
    });
  });

  it('mantiene el signo de interrogación mientras falte una fotografía por calificar', async () => {
    const view = await render(
      <ConclusionesResumen
        ciclosIndividualesRegistrados={2}
        esNuevaConNosotros={false}
        sabeMontosCompaneras="Sí"
        acuerdoMontos="Sí"
        companerasMontoNoAcordadoIds={[]}
        conoceTesoreraDelGrupo="Sí"
        quienEsTesorera="integrante-1"
        domicilioRecoleccion="integrante-1"
        integrantesGrupo={integrantesGrupo}
        tieneHistorialCrelealtad
        historialCrelealtad={historialCrelealtad}
        historialOtraFinanciera={{
          ...historialOtraFinanciera,
          fotografiasCalificadas: {
            verdes: 1,
            amarillas: 0,
            rojas: 0,
          },
        }}
        calificacionPromedioEvidencias={calificacionPromedioEvidencias}
        onVerEvidenciasOtraFinanciera={jest.fn()}
      />,
    );

    expect(view.getByText('?')).toBeTruthy();
    expect(view.getByLabelText(
      'Promedio pendiente: faltan fotografías por calificar',
    )).toBeTruthy();
    expect(view.getByTestId('summary-detail-action-indicator-7')).toHaveStyle({
      borderColor: colors.textPrimary,
      backgroundColor: colors.white,
    });
  });

  it('redondea al entero más cercano el promedio completo en escala de cien', async () => {
    const view = await render(
      <ConclusionesResumen
        ciclosIndividualesRegistrados={2}
        esNuevaConNosotros={false}
        sabeMontosCompaneras="Sí"
        acuerdoMontos="Sí"
        companerasMontoNoAcordadoIds={[]}
        conoceTesoreraDelGrupo="Sí"
        quienEsTesorera="integrante-1"
        domicilioRecoleccion="integrante-1"
        integrantesGrupo={integrantesGrupo}
        tieneHistorialCrelealtad
        historialCrelealtad={historialCrelealtad}
        historialOtraFinanciera={{
          ...historialOtraFinanciera,
          fotografiasGuardadas: 3,
          fotografiasCalificables: 3,
          fotografiasCalificadas: {
            verdes: 2,
            amarillas: 0,
            rojas: 1,
          },
        }}
        calificacionPromedioEvidencias={calificacionPromedioEvidencias}
        onVerEvidenciasOtraFinanciera={jest.fn()}
      />,
    );

    expect(view.getByText('67')).toBeTruthy();
    expect(view.getByLabelText('Promedio de calificación: 67 de 100')).toBeTruthy();
    expect(view.getByTestId('summary-detail-action-indicator-7')).toHaveStyle({
      borderColor: colors.success,
      backgroundColor: colors.successSoft,
    });
  });

  it('muestra sólo el nombre con fondo blanco y marco oscuro cuando no hay clasificación', async () => {
    const view = await render(
      <ConclusionesResumen
        ciclosIndividualesRegistrados={2}
        esNuevaConNosotros={false}
        sabeMontosCompaneras="Sí"
        acuerdoMontos="Sí"
        companerasMontoNoAcordadoIds={[]}
        conoceTesoreraDelGrupo="Sí"
        quienEsTesorera="integrante-1"
        domicilioRecoleccion="integrante-1"
        integrantesGrupo={integrantesGrupo}
        tieneHistorialCrelealtad
        historialCrelealtad={historialCrelealtad}
        historialOtraFinanciera={{
          ...historialOtraFinanciera,
          clasificacionFinanciera: null,
        }}
      />,
    );

    expect(view.getByText('Compartamos Banco')).toBeTruthy();
    expect(view.queryByText(/SIN CLASIFICAR/)).toBeNull();
    expect(view.getByTestId('summary-detail-value-neutral-0')).toHaveStyle({
      backgroundColor: colors.white,
      borderColor: colors.textPrimary,
    });
    expect(view.getByLabelText(
      'FINANCIERA: Compartamos Banco. Sin clasificación configurada',
    )).toBeTruthy();
  });

  it('calcula sólo la tasa en la tercera columna cuando la tasa declarada está vacía', async () => {
    const view = await render(
      <ConclusionesResumen
        ciclosIndividualesRegistrados={2}
        esNuevaConNosotros={false}
        sabeMontosCompaneras="Sí"
        acuerdoMontos="Sí"
        companerasMontoNoAcordadoIds={[]}
        conoceTesoreraDelGrupo="Sí"
        quienEsTesorera="integrante-1"
        domicilioRecoleccion="integrante-1"
        integrantesGrupo={integrantesGrupo}
        tieneHistorialCrelealtad
        historialCrelealtad={historialCrelealtad}
        historialOtraFinanciera={{
          ...historialOtraFinanciera,
          montoUltimoPrestamoCreditoGrupal: '50000',
          tasaCreditoGrupal: '',
        }}
      />,
    );

    expect(view.getByTestId('summary-detail-row-4').props.accessibilityLabel)
      .toBe('VALOR DE FICHA: $ 2,500');
    expect(view.getByTestId('summary-detail-row-5').props.accessibilityLabel)
      .toBe('ÚLT. PRÉSTAMO: $ 50,000');
    expect(view.getByTestId('summary-detail-row-6').props.accessibilityLabel)
      .toBe('TASA: ——, cálculo: 50');
    expect(view.getByTestId('summary-detail-table-empty-4').children).toHaveLength(0);
    expect(view.getByTestId('summary-detail-table-empty-5').children).toHaveLength(0);
    expect(view.getByTestId('summary-detail-table-result-6')).toBeTruthy();
    expect(view.getByText('——')).toBeTruthy();
    expect(view.getByText('50')).toBeTruthy();
  });

  it('usa la tolerancia publicada cuando la semana queda fuera del rango estimado', async () => {
    const view = await render(
      <ConclusionesResumen
        ciclosIndividualesRegistrados={2}
        esNuevaConNosotros={false}
        sabeMontosCompaneras="Sí"
        acuerdoMontos="Sí"
        companerasMontoNoAcordadoIds={[]}
        conoceTesoreraDelGrupo="Sí"
        quienEsTesorera="integrante-1"
        domicilioRecoleccion="integrante-1"
        integrantesGrupo={integrantesGrupo}
        tieneHistorialCrelealtad
        historialCrelealtad={historialCrelealtad}
        historialOtraFinanciera={{
          ...historialOtraFinanciera,
          semanaActualCreditoGrupal: '15',
        }}
        calificacionSemanaCredito={calificacionSemanaCredito}
        toleranciaSemanaDesembolso={toleranciaSemanaDesembolso}
      />,
    );

    expect(view.getByTestId('summary-detail-value-negative-2')).toHaveStyle({
      backgroundColor: colors.dangerSoft,
      borderColor: colors.danger,
    });
    expect(view.getByTestId('summary-detail-trailing-warning-3')).toHaveStyle({
      backgroundColor: colors.warningLight,
      borderColor: colors.warning,
    });
    expect(view.getByTestId('summary-detail-primary-warning-3')).toHaveStyle({
      backgroundColor: colors.warningLight,
      borderColor: colors.warning,
    });
  });

  it('aplica de forma independiente la concordancia porcentual de ficha y préstamo', async () => {
    const view = await render(
      <ConclusionesResumen
        ciclosIndividualesRegistrados={2}
        esNuevaConNosotros={false}
        sabeMontosCompaneras="Sí"
        acuerdoMontos="Sí"
        companerasMontoNoAcordadoIds={[]}
        conoceTesoreraDelGrupo="Sí"
        quienEsTesorera="integrante-1"
        domicilioRecoleccion="integrante-1"
        integrantesGrupo={integrantesGrupo}
        tieneHistorialCrelealtad
        historialCrelealtad={historialCrelealtad}
        historialOtraFinanciera={{
          ...historialOtraFinanciera,
          valorFichaCreditoGrupal: '1050',
          montoUltimoPrestamoCreditoGrupal: '10000',
          tasaCreditoGrupal: '100',
        }}
        concordanciaFicha={concordanciaFicha}
        concordanciaPrestamo={concordanciaPrestamo}
      />,
    );

    expect(view.queryByTestId('summary-detail-table-value-tone-positive-4')).toBeNull();
    expect(view.getByText('$ 1,050')).toHaveStyle({ flex: 0, textAlign: 'center' });
    expect(view.getByTestId('summary-detail-table-result-tone-positive-4')).toHaveStyle({
      backgroundColor: colors.successSoft,
      borderColor: colors.success,
    });
    expect(view.queryByTestId('summary-detail-table-value-tone-warning-5')).toBeNull();
    expect(view.getByText('$ 10,000')).toHaveStyle({ flex: 0, textAlign: 'center' });
    expect(view.getByTestId('summary-detail-table-result-tone-warning-5')).toHaveStyle({
      backgroundColor: colors.warningLight,
      borderColor: colors.warning,
    });
  });

  it('muestra los ciclos y el domicilio identificado sin convertirlos en preguntas', async () => {
    const view = await render(
      <ConclusionesResumen
        ciclosIndividualesRegistrados={3}
        esNuevaConNosotros={false}
        sabeMontosCompaneras="No"
        acuerdoMontos="Sí"
        companerasMontoNoAcordadoIds={[]}
        conoceTesoreraDelGrupo="No"
        quienEsTesorera=""
        domicilioRecoleccion="integrante-2"
        integrantesGrupo={integrantesGrupo}
        tieneHistorialCrelealtad={false}
        historialCrelealtad={null}
        historialOtraFinanciera={{
          ...historialOtraFinanciera,
          tieneOtroCreditoGrupal: 'No',
        }}
      />,
    );

    expect(view.getByText('3 CICLOS')).toBeTruthy();
    expect(view.getByText('NO SABE CUÁNTO PIDIERON SUS COMPAÑERAS')).toBeTruthy();
    expect(view.getByText('ESTÁ DE ACUERDO CON LOS MONTOS')).toBeTruthy();
    expect(view.getByText('NO CONOCE A LA TESORERA')).toBeTruthy();
    expect(view.getByText('SÍ SABE DÓNDE SE RECOLECTARÁ')).toBeTruthy();
    expect(view.getByText('Beatriz García')).toBeTruthy();
    expect(view.getByText('SIN HISTORIAL')).toBeTruthy();
    expect(view.getByText('SIN HISTORIAL EN OTRAS FINANCIERAS')).toBeTruthy();
    expect(view.getByLabelText('Resultado negativo: SIN HISTORIAL')).toHaveStyle({
      backgroundColor: colors.dangerSoft,
      borderColor: colors.danger,
    });
  });

  it('resume el historial finalizado sin convertir una fuente interna desconocida en ausencia', async () => {
    const view = await render(
      <ConclusionesResumen
        ciclosIndividualesRegistrados={null}
        esNuevaConNosotros={false}
        sabeMontosCompaneras=""
        acuerdoMontos=""
        companerasMontoNoAcordadoIds={[]}
        conoceTesoreraDelGrupo=""
        quienEsTesorera=""
        domicilioRecoleccion=""
        integrantesGrupo={integrantesGrupo}
        tieneHistorialCrelealtad={null}
        historialCrelealtad={null}
        historialOtraFinanciera={{
          ...historialOtraFinanciera,
          creditoGrupalAnteriorActivo: 'No',
          semanaActualCreditoGrupal: '',
          mesDesembolsoCreditoGrupal: '',
          mesUltimoPagoCreditoGrupal: 'Enero',
          anioUltimoPagoCreditoGrupal: '2026',
          semanasDesdeUltimoPagoCreditoGrupal: 35,
          numeroCiclosCreditoGrupal: '1',
          motivoNoRenovacionCreditoGrupal: 'Terminó el grupo',
        }}
      />,
    );

    expect(view.getByText('HISTORIAL CRELEALTAD NO DISPONIBLE')).toBeTruthy();
    expect(view.getByText('FINALIZADO')).toBeTruthy();
    expect(view.getByText('ÚLTIMO PAGO')).toBeTruthy();
    expect(view.getByText('Enero 2026')).toBeTruthy();
    expect(view.getByText('35 SEMANAS')).toBeTruthy();
    expect(view.getByText('1 CICLO')).toBeTruthy();
    expect(view.getByText('Terminó el grupo')).toBeTruthy();
  });

  it('abre por separado las fotografías de casa y negocio', async () => {
    const onVerFotografiasCasa = jest.fn();
    const onVerFotografiasNegocio = jest.fn();
    const view = await render(
      <ConclusionesResumen
        ciclosIndividualesRegistrados={2}
        esNuevaConNosotros={false}
        sabeMontosCompaneras="Sí"
        acuerdoMontos="Sí"
        companerasMontoNoAcordadoIds={[]}
        conoceTesoreraDelGrupo="Sí"
        quienEsTesorera="integrante-1"
        domicilioRecoleccion="integrante-1"
        integrantesGrupo={integrantesGrupo}
        tieneHistorialCrelealtad
        historialCrelealtad={historialCrelealtad}
        historialOtraFinanciera={historialOtraFinanciera}
        fotografiasCasa={3}
        fotografiasNegocio={2}
        onVerFotografiasCasa={onVerFotografiasCasa}
        onVerFotografiasNegocio={onVerFotografiasNegocio}
      />,
    );

    fireEvent.press(view.getByLabelText(
      'Abrir fotografías de casa. 3 fotografías disponibles',
    ));
    fireEvent.press(view.getByLabelText(
      'Abrir fotografías de negocio. 2 fotografías disponibles',
    ));
    expect(onVerFotografiasCasa).toHaveBeenCalledTimes(1);
    expect(onVerFotografiasNegocio).toHaveBeenCalledTimes(1);
  });
});
