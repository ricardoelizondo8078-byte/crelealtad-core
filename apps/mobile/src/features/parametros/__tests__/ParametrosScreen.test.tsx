import { fireEvent, render } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ParametrosScreen } from '../ParametrosScreen';
import {
  listarFinancierasCompetidoras,
  obtenerHistorialFinancieraCompetidora,
  publicarCambioFinanciera,
} from '../parametros-financieras.api';
import {
  actualizarParametroToleranciaSemanaDesembolso,
  obtenerParametroConcordanciaFicha,
  obtenerParametroConcordanciaPrestamo,
  obtenerParametroPromedioEvidencias,
  obtenerParametroCiclosCredito,
  obtenerParametroSemanaCredito,
  obtenerParametroToleranciaSemanaDesembolso,
} from '../parametros-conclusiones.api';

jest.mock('../parametros-financieras.api', () => ({
  listarFinancierasCompetidoras: jest.fn(),
  obtenerHistorialFinancieraCompetidora: jest.fn(),
  publicarCambioFinanciera: jest.fn(),
}));

jest.mock('../parametros-evidencia-motivos.api', () => ({
  listarMotivosClasificacionEvidencia: jest.fn(() => Promise.resolve({ items: [] })),
  crearMotivoClasificacionEvidencia: jest.fn(),
  cambiarEstadoMotivoClasificacionEvidencia: jest.fn(),
}));

jest.mock('../parametros-entrevista.api', () => ({
  listarParametrosEntrevista: jest.fn(() => Promise.resolve({ items: [] })),
  crearParametroEntrevista: jest.fn(),
  actualizarParametroEntrevista: jest.fn(),
  cambiarEstadoParametroEntrevista: jest.fn(),
  reordenarParametrosEntrevista: jest.fn(),
}));

jest.mock('../parametros-conclusiones.api', () => ({
  obtenerParametroSemanaCredito: jest.fn(),
  actualizarParametroSemanaCredito: jest.fn(),
  obtenerCalificacionSemanaCreditoVerificacion: jest.fn(),
  obtenerParametroCiclosCredito: jest.fn(),
  actualizarParametroCiclosCredito: jest.fn(),
  obtenerCalificacionCiclosCreditoVerificacion: jest.fn(),
  obtenerParametroToleranciaSemanaDesembolso: jest.fn(),
  actualizarParametroToleranciaSemanaDesembolso: jest.fn(),
  obtenerToleranciaSemanaDesembolsoVerificacion: jest.fn(),
  obtenerParametroConcordanciaFicha: jest.fn(),
  actualizarParametroConcordanciaFicha: jest.fn(),
  obtenerConcordanciaFichaVerificacion: jest.fn(),
  obtenerParametroConcordanciaPrestamo: jest.fn(),
  actualizarParametroConcordanciaPrestamo: jest.fn(),
  obtenerConcordanciaPrestamoVerificacion: jest.fn(),
  obtenerParametroPromedioEvidencias: jest.fn(),
  actualizarParametroPromedioEvidencias: jest.fn(),
  obtenerPromedioEvidenciasVerificacion: jest.fn(),
}));

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ usuario: null }),
}));

jest.mock('../../../context/PendingReviewsContext', () => ({
  usePendingReviews: () => ({ totalPending: 0, openInbox: jest.fn() }),
}));

jest.mock('../../../context/ProcessingContext', () => ({
  useProcessingAction: (action: unknown) => action,
}));

jest.mock('../../../services/api-client', () => ({
  ApiError: class ApiError extends Error {},
}));

const listarMock = listarFinancierasCompetidoras as jest.MockedFunction<
  typeof listarFinancierasCompetidoras
>;
const historialMock = obtenerHistorialFinancieraCompetidora as jest.MockedFunction<
  typeof obtenerHistorialFinancieraCompetidora
>;
const publicarMock = publicarCambioFinanciera as jest.MockedFunction<
  typeof publicarCambioFinanciera
>;
const obtenerSemanaMock = obtenerParametroSemanaCredito as jest.MockedFunction<
  typeof obtenerParametroSemanaCredito
>;
const obtenerCiclosMock = obtenerParametroCiclosCredito as jest.MockedFunction<
  typeof obtenerParametroCiclosCredito
>;
const obtenerToleranciaMock = obtenerParametroToleranciaSemanaDesembolso as jest.MockedFunction<
  typeof obtenerParametroToleranciaSemanaDesembolso
>;
const actualizarToleranciaMock = actualizarParametroToleranciaSemanaDesembolso as jest.MockedFunction<
  typeof actualizarParametroToleranciaSemanaDesembolso
>;
const obtenerConcordanciaFichaMock = obtenerParametroConcordanciaFicha as jest.MockedFunction<
  typeof obtenerParametroConcordanciaFicha
>;
const obtenerConcordanciaPrestamoMock = obtenerParametroConcordanciaPrestamo as jest.MockedFunction<
  typeof obtenerParametroConcordanciaPrestamo
>;
const obtenerPromedioEvidenciasMock = obtenerParametroPromedioEvidencias as jest.MockedFunction<
  typeof obtenerParametroPromedioEvidencias
>;

describe('ParametrosScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listarMock.mockResolvedValue({
      items: [{
        id: 'financiera-1',
        nombre: 'Banco BanFeliz',
        catalogo_base: true,
        created_at: '2026-10-08T12:00:00.000Z',
        ultima_revision: 1,
        vigente: {
          id: 'version-1',
          revision: 1,
          nombre_oficial: 'Banco BanFeliz',
          clasificacion: 'REVISION',
          motivo: null,
          aliases: ['BanFeliz'],
          activa: true,
          vigencia_desde: '2026-10-08',
          vigencia_hasta: null,
          semanas: null,
          tasa: null,
          seguro: null,
          apertura: null,
          retencion: null,
          base: null,
          refinanciamiento: null,
          descripcion: null,
          sucursales: [],
        },
        programada: null,
        propuesta: null,
      }],
    });
    historialMock.mockResolvedValue({
      financiera: { id: 'financiera-1', nombre: 'Banco BanFeliz' },
      versiones: [],
    });
    publicarMock.mockResolvedValue({ id: 'version-2' } as never);
    obtenerSemanaMock.mockResolvedValue({
      parametro: {
        id: 1,
        verde_desde: 1,
        verde_hasta: 10,
        amarillo_desde: 11,
        amarillo_hasta: 13,
        rojo_desde: 14,
        rojo_hasta: 16,
        updated_at: '2026-10-11T12:00:00.000Z',
      },
    });
    obtenerCiclosMock.mockResolvedValue({
      parametro: {
        id: 1,
        verde_desde: 1,
        verde_hasta: 10,
        amarillo_desde: 11,
        amarillo_hasta: 13,
        rojo_desde: 14,
        rojo_hasta: 16,
        updated_at: '2026-10-11T12:00:00.000Z',
      },
    });
    obtenerToleranciaMock.mockResolvedValue({
      parametro: {
        id: 1,
        verde_desde: 0,
        verde_hasta: 0,
        amarillo_desde: 1,
        amarillo_hasta: 3,
        rojo_desde: 4,
        rojo_hasta: 10,
        updated_at: '2026-10-11T12:00:00.000Z',
      },
    });
    actualizarToleranciaMock.mockResolvedValue({
      parametro: {
        id: 1,
        verde_desde: 0,
        verde_hasta: 0,
        amarillo_desde: 1,
        amarillo_hasta: 3,
        rojo_desde: 4,
        rojo_hasta: 10,
        updated_at: '2026-10-11T12:01:00.000Z',
      },
    });
    const concordancia = {
      id: 1,
      verde_desde: 0,
      verde_hasta: 5,
      amarillo_desde: 6,
      amarillo_hasta: 10,
      rojo_desde: 11,
      rojo_hasta: 100,
      updated_at: '2026-10-11T12:00:00.000Z',
    };
    obtenerConcordanciaFichaMock.mockResolvedValue({ parametro: concordancia });
    obtenerConcordanciaPrestamoMock.mockResolvedValue({ parametro: concordancia });
    obtenerPromedioEvidenciasMock.mockResolvedValue({
      parametro: {
        id: 1,
        verde_desde: 67,
        verde_hasta: 100,
        amarillo_desde: 34,
        amarillo_hasta: 66,
        rojo_desde: 0,
        rojo_hasta: 33,
        updated_at: '2026-10-12T12:00:00.000Z',
      },
    });
  });

  it('agrupa los catálogos por módulo y deja visibles los módulos aún no configurados', async () => {
    const view = await render(<ParametrosScreen canUpdate onBack={() => undefined} />);

    expect(view.getByText('Selecciona un módulo')).toBeTruthy();
    expect(view.getByText('Verificación')).toBeTruthy();
    expect(view.getByText('Desembolsos')).toBeTruthy();
    expect(view.queryByText('Financieras competidoras')).toBeNull();
    expect(view.getAllByText('Sin parámetros')).toHaveLength(8);
    expect(view.getByLabelText(
      'Desembolsos. Condiciones para entrega. Sin parámetros',
    ).props.accessibilityState.disabled).toBe(true);

    await fireEvent.press(view.getByText('Verificación'));

    expect(await view.findByText('Parámetros de verificación')).toBeTruthy();
    expect(view.getByText('Integrantes para finalizar')).toBeTruthy();
    expect(view.getByText('Entrevista')).toBeTruthy();
    expect(view.getByText('Visita al vecino')).toBeTruthy();
    expect(view.getByText('Conclusiones')).toBeTruthy();
    expect(view.queryByText('Financieras competidoras')).toBeNull();

    await fireEvent.press(view.getByText('Entrevista'));

    expect(await view.findByText('Parámetros de entrevista')).toBeTruthy();
    expect(view.getByText('Financieras competidoras')).toBeTruthy();
    expect(view.getByText('Motivos verdes')).toBeTruthy();
    expect(view.getByText('Motivos amarillos')).toBeTruthy();
    expect(view.getByText('Motivos rojos')).toBeTruthy();
    expect(view.getByText('Razones para recomendarnos')).toBeTruthy();
    expect(view.getByText('Razones para no recomendarnos')).toBeTruthy();
    expect(view.queryByText('Tiempo de conocer al grupo')).toBeNull();
    expect(view.queryByText('Tipo de domicilio')).toBeNull();
    expect(view.queryByText('Familiar propietario')).toBeNull();
    expect(view.queryByText('Antigüedad en domicilio')).toBeNull();
    expect(view.queryByText('Personas en casa')).toBeNull();
    expect(view.queryByText('Convivientes')).toBeNull();
    expect(view.queryByText('Fuentes de ingreso')).toBeNull();
    expect(view.queryByText('Antigüedad laboral')).toBeNull();
    expect(view.queryByText('Frecuencia del servicio')).toBeNull();
    expect(view.queryByText('Calificación del servicio')).toBeNull();
    expect(view.queryByText('Rapidez de desembolso')).toBeNull();
    expect(view.getByRole('button', {
      name: 'Financieras competidoras. Clasificación, vigencias e historial',
    })).toBeTruthy();
  }, 60_000);

  it('abre los catálogos separados de Sí y No para la visita al vecino', async () => {
    const view = await render(<ParametrosScreen canUpdate onBack={() => undefined} />);

    await fireEvent.press(view.getByText('Verificación'));
    await fireEvent.press(view.getByText('Visita al vecino'));

    expect(await view.findByText('Parámetros de visita al vecino')).toBeTruthy();
    expect(view.getByText('Opciones cuando responde Sí')).toBeTruthy();
    expect(view.getByText('Opciones cuando responde No')).toBeTruthy();

    await fireEvent.press(view.getByText('Opciones cuando responde Sí'));
    expect(await view.findByText('Nueva opción')).toBeTruthy();
    expect(view.getByText('Agregar opción')).toBeTruthy();
  });

  it('abre el primer parámetro independiente de Conclusiones', async () => {
    const view = await render(<ParametrosScreen canUpdate onBack={() => undefined} />);

    await fireEvent.press(view.getByText('Verificación'));
    await fireEvent.press(view.getByText('Conclusiones'));

    expect(await view.findByText('Parámetros de conclusiones')).toBeTruthy();
    expect(view.getByText('Calificar semana del crédito')).toBeTruthy();
    expect(view.getByText('Calificar número de ciclos')).toBeTruthy();
    expect(view.getByText('Calificar semana de desembolso')).toBeTruthy();
    expect(view.getByText('Calificar concordancia en ficha')).toBeTruthy();
    expect(view.getByText('Calificar concordancia en préstamo')).toBeTruthy();
    expect(view.getByText('Calificar promedio de fotografías')).toBeTruthy();

    await fireEvent.press(view.getByText('Calificar semana del crédito'));

    expect(await view.findByText('Semana del crédito en otra financiera')).toBeTruthy();
    expect(view.getByLabelText('Clasificación Verde')).toBeTruthy();
    expect(view.getByLabelText('Clasificación Amarillo')).toBeTruthy();
    expect(view.getByLabelText('Clasificación Rojo')).toBeTruthy();
    expect(view.getByLabelText('Desde verde. 1')).toBeTruthy();
    expect(view.getByLabelText('Hasta rojo. 16')).toBeTruthy();
    expect(view.queryByText('Parámetros de entrevista')).toBeNull();
  }, 30_000);

  it('abre el parámetro de ciclos con las opciones de Entrevista hasta 40', async () => {
    const view = await render(<ParametrosScreen canUpdate onBack={() => undefined} />);

    await fireEvent.press(view.getByText('Verificación'));
    await fireEvent.press(view.getByText('Conclusiones'));
    await fireEvent.press(view.getByText('Calificar número de ciclos'));

    expect(await view.findByText('Ciclos en otra financiera')).toBeTruthy();
    fireEvent.press(view.getByLabelText('Hasta verde. 10'));
    expect(await view.findByText('40')).toBeTruthy();
  }, 30_000);

  it('abre la tolerancia de desembolso con scroll de 0 a 10', async () => {
    const view = await render(<ParametrosScreen canUpdate onBack={() => undefined} />);

    await fireEvent.press(view.getByText('Verificación'));
    await fireEvent.press(view.getByText('Conclusiones'));
    await fireEvent.press(view.getByText('Calificar semana de desembolso'));

    expect(await view.findByText('Tolerancia de semana de desembolso')).toBeTruthy();
    expect(view.getByLabelText('Desde verde. 0')).toBeTruthy();
    fireEvent.press(view.getByLabelText('Hasta rojo. 10'));
    expect((await view.findAllByText('0')).length).toBeGreaterThan(0);
    expect(view.getAllByText('10').length).toBeGreaterThan(0);
  }, 30_000);

  it('permite publicar la tolerancia verde 0 a 0 aunque ya esté almacenada', async () => {
    const view = await render(<ParametrosScreen canUpdate onBack={() => undefined} />);

    await fireEvent.press(view.getByText('Verificación'));
    await fireEvent.press(view.getByText('Conclusiones'));
    await fireEvent.press(view.getByText('Calificar semana de desembolso'));

    const guardar = await view.findByRole('button', { name: 'Guardar y publicar' });
    expect(guardar.props.accessibilityState.disabled).toBe(false);
    fireEvent.press(guardar);

    expect(actualizarToleranciaMock).toHaveBeenCalledWith({
      verde_desde: 0,
      verde_hasta: 0,
      amarillo_desde: 1,
      amarillo_hasta: 3,
      rojo_desde: 4,
      rojo_hasta: 10,
    });
    expect(await view.findByText('Los rangos quedaron guardados y publicados.')).toBeTruthy();
  }, 30_000);

  it.each([
    ['Calificar concordancia en ficha', 'Concordancia en ficha'],
    ['Calificar concordancia en préstamo', 'Concordancia en préstamo'],
  ])('abre %s con porcentajes de 0 a 100', async (opcion, titulo) => {
    const view = await render(<ParametrosScreen canUpdate onBack={() => undefined} />);

    await fireEvent.press(view.getByText('Verificación'));
    await fireEvent.press(view.getByText('Conclusiones'));
    await fireEvent.press(view.getByText(opcion));

    expect(await view.findByText(titulo)).toBeTruthy();
    expect(view.getByLabelText('Desde verde. 0%')).toBeTruthy();
    fireEvent.press(view.getByLabelText('Hasta rojo. 100%'));
    expect((await view.findAllByText('0%')).length).toBeGreaterThan(0);
    expect(view.getAllByText('100%').length).toBeGreaterThan(0);
  }, 30_000);

  it('abre el promedio de fotografías con valores de 0 a 100', async () => {
    const view = await render(<ParametrosScreen canUpdate onBack={() => undefined} />);

    await fireEvent.press(view.getByText('Verificación'));
    await fireEvent.press(view.getByText('Conclusiones'));
    await fireEvent.press(view.getByText('Calificar promedio de fotografías'));

    expect(await view.findByText('Promedio de fotografías')).toBeTruthy();
    expect(view.getByLabelText('Desde verde. 67')).toBeTruthy();
    fireEvent.press(view.getByLabelText('Hasta verde. 100'));
    expect((await view.findAllByText('0')).length).toBeGreaterThan(0);
    expect(view.getAllByText('100').length).toBeGreaterThan(0);
  }, 30_000);

  it('abre directamente el formulario al tocar el renglón de una financiera', async () => {
    const view = await render(<ParametrosScreen canUpdate onBack={() => undefined} />);

    await fireEvent.press(view.getByText('Verificación'));
    await fireEvent.press(view.getByText('Entrevista'));
    await fireEvent.press(view.getByText('Financieras competidoras'));
    await fireEvent.press(await view.findByTestId('financiera-row-financiera-1'));

    expect(await view.findByText('Parámetros de financiera')).toBeTruthy();
    expect(view.queryByText('Detalle de financiera')).toBeNull();
    expect(view.getByText('¿Se muestran en el pop-up?')).toBeTruthy();
    expect(view.getByDisplayValue(/^\d{2}-(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)-\d{4}$/))
      .toBeTruthy();
    expect(view.getByText('Debe ser hoy o una fecha futura. Usa el formato DD-MMM-AAAA.'))
      .toBeTruthy();
    expect(view.getByLabelText(
      'Atención. Requiere atención antes de decidir',
    ).props.accessibilityState.selected)
      .toBe(true);
    expect(view.getByText('Historial')).toBeTruthy();
  }, 30_000);

  it.each([
    ['Motivos verdes', 'Motivos de evidencia verde'],
    ['Motivos amarillos', 'Motivos de evidencia amarilla'],
    ['Motivos rojos', 'Motivos de evidencia roja'],
  ])('abre la pantalla independiente de %s', async (opcion, titulo) => {
    const view = await render(<ParametrosScreen canUpdate onBack={() => undefined} />);

    await fireEvent.press(view.getByText('Verificación'));
    await fireEvent.press(view.getByText('Entrevista'));
    await fireEvent.press(view.getByText(opcion));

    expect(await view.findByText(titulo)).toBeTruthy();
  });

  it('permite agregar una opción en Cómo conoció a la asesora', async () => {
    const view = await render(<ParametrosScreen canUpdate onBack={() => undefined} />);

    await fireEvent.press(view.getByText('Verificación'));
    await fireEvent.press(view.getByText('Entrevista'));
    await fireEvent.press(view.getByText('Cómo conoció a la asesora'));

    expect(await view.findByText('Nueva opción')).toBeTruthy();
    expect(view.getByText('Agregar opción')).toBeTruthy();
  });
});
