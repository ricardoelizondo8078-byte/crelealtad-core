import { validate } from 'class-validator';
import { CalificarEvidenciaIntegranteDto } from './calificar-evidencia-integrante.dto';

const dto = (calificacion: string) => Object.assign(
  new CalificarEvidenciaIntegranteDto(),
  { calificacion },
);

describe('CalificarEvidenciaIntegranteDto', () => {
  it.each(['TACHA', 'AMARILLO', 'PALOMITA'])(
    'acepta la calificación %s',
    async (calificacion) => {
      await expect(validate(dto(calificacion))).resolves.toEqual([]);
    },
  );

  it('rechaza una calificación fuera del catálogo', async () => {
    await expect(validate(dto('AZUL'))).resolves.not.toEqual([]);
  });
});
