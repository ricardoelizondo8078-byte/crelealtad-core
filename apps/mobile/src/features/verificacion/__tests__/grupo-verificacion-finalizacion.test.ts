import { evaluarFinalizacionGrupo } from '../grupo-verificacion-finalizacion';

describe('evaluarFinalizacionGrupo', () => {
  it('habilita al alcanzar el número requerido aunque existan otras integrantes pendientes', () => {
    expect(evaluarFinalizacionGrupo(3, 3)).toEqual({ habilitado: true, faltantes: 0 });
  });

  it('indica cuántas revisiones concluidas faltan', () => {
    expect(evaluarFinalizacionGrupo(2, 5)).toEqual({ habilitado: false, faltantes: 3 });
  });

  it('bloquea si el parámetro no está configurado o no es válido', () => {
    expect(evaluarFinalizacionGrupo(5, null)).toEqual({ habilitado: false, faltantes: null });
    expect(evaluarFinalizacionGrupo(5, 13)).toEqual({ habilitado: false, faltantes: null });
  });

  it('habilita desde el inicio cuando Administración publica cero', () => {
    expect(evaluarFinalizacionGrupo(0, 0)).toEqual({ habilitado: true, faltantes: 0 });
  });
});
