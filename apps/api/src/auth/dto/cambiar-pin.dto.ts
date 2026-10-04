import { Matches } from 'class-validator';

const PIN_PATTERN = /^\d{4}$/;

export class CambiarPinDto {
  @Matches(PIN_PATTERN, { message: 'El PIN actual debe tener exactamente 4 dígitos' })
  pin_actual: string;

  @Matches(PIN_PATTERN, { message: 'El nuevo PIN debe tener exactamente 4 dígitos' })
  nuevo_pin: string;

  @Matches(PIN_PATTERN, { message: 'La confirmación debe tener exactamente 4 dígitos' })
  confirmacion_pin: string;
}
