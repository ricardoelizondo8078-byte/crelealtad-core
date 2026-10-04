import { describe, expect, it } from '@jest/globals';
import {
  buildAutoSavePayload,
  buildIntegrantePayload,
  buildSolicitudStepPayload,
} from '../solicitud-payload.mapper';

describe('mapeo de Solicitud hacia la API', () => {
  it('usa nombres snake_case y no permite relaciones controladas por servidor', () => {
    const payload = buildSolicitudStepPayload({
      calle: 'CALLE PRUEBA',
      numeroExterior: '10',
      numeroInterior: '',
      entreCalles: 'UNO Y DOS',
      colonia: 'CENTRO',
      municipio: 'MONTERREY',
      estado: 'NUEVO LEÓN',
      codigoPostal: '64000',
      telefonoInicial: '8112345678',
      persona_id: 'NO-DEBE-SALIR',
      grupo_id: 'NO-DEBE-SALIR',
    }, 2);

    expect(payload).toMatchObject({
      dom_calle: 'CALLE PRUEBA',
      dom_num_ext: '10',
      dom_codigo_postal: '64000',
      dom_telefono: '8112345678',
    });
    expect(payload).not.toHaveProperty('persona_id');
    expect(payload).not.toHaveProperty('grupo_id');
  });

  it('omite monto inválido y valores vacíos durante el autoguardado', () => {
    const payload = buildAutoSavePayload({
      nombres: 'PERSONA',
      apellido_pat: 'PRUEBA',
      apellido_mat: 'SISTEMA',
      telefonoInicial: '8112345678',
      telefonoSecundario: '',
      montoSolicitado: '60000',
    }, 50000);

    expect(payload).toMatchObject({ nombres: 'PERSONA' });
    expect(payload).not.toHaveProperty('monto_solicitado');
    expect(Object.values(payload)).not.toContain('');
    expect(buildIntegrantePayload({
      telefonoInicial: '8112345678',
      telefonoSecundario: '',
    }, false)).toEqual({
      telefono: '8112345678',
      telefonoSecundario: '',
    });
  });
});
