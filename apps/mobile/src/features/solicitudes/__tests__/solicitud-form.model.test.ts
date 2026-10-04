import { describe, expect, it } from '@jest/globals';
import {
  getMontoSolicitadoError,
  isSolicitudStepComplete,
  normalizeCurpInput,
  validateSolicitudStep,
  type SolicitudFormData,
} from '../solicitud-form.model';
import type { DocumentoRequerido } from '../solicitud-documentos';

const pasoUnoValido = (): SolicitudFormData => ({
  nombres: 'PERSONA',
  apellido_pat: 'PRUEBA',
  apellido_mat: 'SISTEMA',
  telefonoInicial: '8112345678',
  fecha_nac: '2000-01-01',
  curp: 'AAAA000101HNLBBB09',
  genero: 'MUJER',
  estado_civil: 'SOLTERA',
  ocupacion: 'COMERCIO',
  nivel_estudio: 'SECUNDARIA',
  nacionalidad: 'MEXICANA',
  estado_nacimiento: 'NUEVO LEÓN',
} as SolicitudFormData);

const documento = (
  id: string,
  obligatorio: boolean,
  status: DocumentoRequerido['status'],
): DocumentoRequerido => ({
  id,
  nombre: id,
  obligatorio,
  status,
});

describe('reglas puras del formulario de Solicitud', () => {
  it('normaliza y limita la CURP antes de validarla', () => {
    expect(normalizeCurpInput(' aaaa 000101hnlbbb09 extra')).toBe('AAAA000101HNLBBB09');
  });

  it('acepta un paso de información personal válido', () => {
    const form = pasoUnoValido();

    expect(validateSolicitudStep(1, form, 50000)).toEqual({});
    expect(isSolicitudStepComplete(1, form, [], 50000)).toBe(true);
  });

  it('reporta teléfono, fecha y CURP inválidos sin ocultar campos obligatorios', () => {
    const errors = validateSolicitudStep(1, {
      ...pasoUnoValido(),
      telefonoInicial: '8112',
      fecha_nac: '2025-02-30',
      curp: 'CURP INVALIDA',
      ocupacion: '',
    }, 50000);

    expect(errors).toMatchObject({
      telefonoInicial: 'Debe tener 10 dígitos',
      fecha_nac: 'Fecha inválida',
      curp: 'CURP inválida',
      ocupacion: 'Campo obligatorio',
    });
  });

  it('rechaza montos vacíos, no positivos o superiores al máximo', () => {
    expect(getMontoSolicitadoError('', 50000)).toBe('Campo obligatorio');
    expect(getMontoSolicitadoError('0', 50000)).toBe('Captura un monto mayor a $0');
    expect(getMontoSolicitadoError('50001', 50000)).toContain('$ 50,000');
    expect(getMontoSolicitadoError('50000', 50000)).toBeUndefined();
  });

  it('sólo completa Documentación cuando toda evidencia obligatoria fue confirmada', () => {
    const form = {} as SolicitudFormData;
    const pendientes = [
      documento('ine', true, 'SINCRONIZADO'),
      documento('comprobante', true, 'ERROR'),
      documento('opcional', false, 'OPCIONAL'),
    ];
    const sincronizados = pendientes.map((item) => (
      item.obligatorio ? { ...item, status: 'SINCRONIZADO' as const } : item
    ));

    expect(isSolicitudStepComplete(7, form, pendientes, 50000)).toBe(false);
    expect(isSolicitudStepComplete(7, form, sincronizados, 50000)).toBe(true);
  });
});
