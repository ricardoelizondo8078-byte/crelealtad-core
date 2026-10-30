import { ForbiddenException } from '@nestjs/common';
import { Usuario } from '../catalogos/entities/usuario.entity';
import {
  depurarAliases,
  exigirAdministradorParametros,
  normalizarTextoCatalogo,
} from './parametros-financieras.policy';

const usuario = (rol: string): Usuario => ({
  id: '11111111-1111-4111-8111-111111111111',
  rol: { nombre: rol },
} as Usuario);

describe('política de financieras competidoras', () => {
  it('normaliza acentos, mayúsculas y espacios para detectar duplicados', () => {
    expect(normalizarTextoCatalogo('  Crédito   Sí  ')).toBe('CREDITO SI');
  });

  it('elimina aliases repetidos y conserva el alias aunque coincida con el nombre oficial', () => {
    expect(depurarAliases(
      ['Crédito Sí', ' credito  si ', 'AFIRME', 'Afirme'],
    )).toEqual({
      originales: ['Crédito Sí', 'AFIRME'],
      normalizados: ['CREDITO SI', 'AFIRME'],
    });
  });

  it('reserva la definición y publicación directa a Administración', () => {
    expect(() => exigirAdministradorParametros(usuario('ADMINISTRADOR'))).not.toThrow();
    expect(() => exigirAdministradorParametros(usuario('GERENTE')))
      .toThrow(ForbiddenException);
  });
});
