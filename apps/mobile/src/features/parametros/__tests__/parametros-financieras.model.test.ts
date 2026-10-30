import {
  CLASIFICACIONES_FINANCIERA,
  clasificacionDesdeEtiqueta,
  construirOpcionesFinancierasCreditoGrupal,
  FINANCIERAS_COMPETIDORAS_INICIALES,
  financieraApareceEnPopup,
  normalizarNombreFinanciera,
  OPCIONES_SEMAFORO_FINANCIERA,
} from '../parametros-financieras.model';

describe('clasificación de financieras competidoras', () => {
  it('mantiene el semáforo institucional aprobado', () => {
    expect(CLASIFICACIONES_FINANCIERA.OBJETIVO.summaryTone).toBe('positive');
    expect(CLASIFICACIONES_FINANCIERA.REVISION.summaryTone).toBe('warning');
    expect(CLASIFICACIONES_FINANCIERA.NO_PRIORITARIA.summaryTone).toBe('negative');
    expect(OPCIONES_SEMAFORO_FINANCIERA.map(({ tone }) => tone)).toEqual([
      'positive',
      'warning',
      'negative',
    ]);
  });

  it('resuelve la etiqueta visible sin depender del color', () => {
    expect(clasificacionDesdeEtiqueta('Cartera objetivo')).toBe('OBJETIVO');
    expect(clasificacionDesdeEtiqueta('Requiere revisión')).toBe('REVISION');
    expect(clasificacionDesdeEtiqueta('Desconocida')).toBeNull();
  });

  it('normaliza nombres y alias para asociar una entrevista', () => {
    expect(normalizarNombreFinanciera('  Crédito   Sí (Afirme) '))
      .toBe('CREDITO SI (AFIRME)');
  });

  it('usa las trece financieras iniciales sólo como respaldo sin conexión', () => {
    const options = construirOpcionesFinancierasCreditoGrupal([], false);

    expect(options).toHaveLength(FINANCIERAS_COMPETIDORAS_INICIALES.length + 1);
    expect(options).toContain('CrediMujer');
    expect(options.at(-1)).toBe('Otra');
  });

  it('muestra el alias operativo del catálogo cuando la API respondió', () => {
    const options = construirOpcionesFinancierasCreditoGrupal(
      [{ nombre: 'Financiera Agregada, S.A. de C.V.', alias_captura: 'La Agregada' }],
      true,
    );

    expect(options).toEqual(['La Agregada', 'Otra']);
    expect(options).not.toContain('CrediMujer');
    expect(options).not.toContain('Financiera Agregada, S.A. de C.V.');
  });

  it('usa el nombre oficial como respaldo si todavía no existe alias', () => {
    expect(construirOpcionesFinancierasCreditoGrupal(
      [{ nombre: 'Financiera sin alias', alias_captura: '' }],
      true,
    )).toEqual(['Financiera sin alias', 'Otra']);
  });

  it('conserva una selección histórica aunque ya no esté en el catálogo activo', () => {
    expect(construirOpcionesFinancierasCreditoGrupal([], true, 'Financiera anterior'))
      .toEqual(['Financiera anterior', 'Otra']);
  });

  it('separa el catálogo según la disponibilidad que ya está publicada', () => {
    expect(financieraApareceEnPopup({ catalogo_base: true, vigente: null })).toBe(true);
    expect(financieraApareceEnPopup({ catalogo_base: false, vigente: null })).toBe(false);
    expect(financieraApareceEnPopup({
      catalogo_base: false,
      vigente: { activa: true },
    })).toBe(true);
    expect(financieraApareceEnPopup({
      catalogo_base: true,
      vigente: { activa: false },
    })).toBe(false);
  });
});
