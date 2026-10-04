import { validate } from 'class-validator';
import { CambiarPinDto } from './cambiar-pin.dto';

const dto = (values: Partial<CambiarPinDto>): CambiarPinDto =>
  Object.assign(new CambiarPinDto(), values);

describe('CambiarPinDto', () => {
  it('acepta tres PIN numéricos de cuatro dígitos', async () => {
    await expect(validate(dto({
      pin_actual: '1234',
      nuevo_pin: '5678',
      confirmacion_pin: '5678',
    }))).resolves.toHaveLength(0);
  });

  it.each(['123', '12345', '12A4', ''])('rechaza el formato inválido %p', async (pin) => {
    const errors = await validate(dto({
      pin_actual: pin,
      nuevo_pin: pin,
      confirmacion_pin: pin,
    }));
    expect(errors).toHaveLength(3);
  });
});
