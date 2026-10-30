import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PublicarCambioFinancieraDto } from './publicar-cambio-financiera.dto';

describe('PublicarCambioFinancieraDto', () => {
  it('no exige nombre, alias, clasificación, motivo, vigencia ni disponibilidad', async () => {
    await expect(validate(new PublicarCambioFinancieraDto())).resolves.toEqual([]);
  });

  it('valida las sucursales como datos opcionales estructurados', async () => {
    const dto = plainToInstance(PublicarCambioFinancieraDto, {
      semanas: '12 a 16',
      tasa: '65%',
      sucursales: [{
        zona: 'Norte',
        direccion: 'Centro',
        numero_asesoras: 8,
        valor_sucursal: '$1,250,000',
      }],
    });

    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('rechaza más de diez sucursales y cantidades negativas de asesoras', async () => {
    const dto = plainToInstance(PublicarCambioFinancieraDto, {
      sucursales: Array.from({ length: 11 }, () => ({ numero_asesoras: -1 })),
    });

    const errores = await validate(dto);
    expect(errores.some((error) => error.property === 'sucursales')).toBe(true);
  });

  it('admite una descripción libre extensa y limita cargas desproporcionadas', async () => {
    const valida = plainToInstance(PublicarCambioFinancieraDto, {
      descripcion: `Descripción extensa\n${'detalle '.repeat(1000)}`,
    });
    await expect(validate(valida)).resolves.toEqual([]);

    const excesiva = plainToInstance(PublicarCambioFinancieraDto, {
      descripcion: 'x'.repeat(10001),
    });
    const errores = await validate(excesiva);
    expect(errores.some((error) => error.property === 'descripcion')).toBe(true);
  });
});
