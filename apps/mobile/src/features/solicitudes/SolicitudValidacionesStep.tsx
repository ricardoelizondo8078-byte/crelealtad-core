import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Card,
  FormField,
  SelectorField,
} from '../../components/ui';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import type {
  ComparacionMontoPaso6,
  MontoReferencia,
} from './solicitud-form.model';
import { yesNoOptions } from './solicitud-form.model';

interface SolicitudValidacionesStepProps {
  tieneMedidorLuzSinAdeudo: string;
  viveMaximo5KmTesorera: string;
  fechaNacimiento: string;
  montoReferencia: MontoReferencia | null;
  comparacionMonto: ComparacionMontoPaso6;
  montoMaximoSolicitable: number;
  montoSolicitado: string;
  errors: {
    tieneMedidorLuzSinAdeudo?: string;
    viveMaximo5KmTesorera?: string;
    montoSolicitado?: string;
  };
  onTieneMedidorChange: (value: string) => void;
  onViveMaximo5KmChange: (value: string) => void;
  onMontoSolicitadoChange: (value: string) => void;
}

const calcularEdadTexto = (fechaNacimiento: string): string => {
  if (!fechaNacimiento) return 'Sin fecha de nacimiento';

  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mesActual = hoy.getMonth();
  const mesNacimiento = nacimiento.getMonth();
  if (
    mesActual < mesNacimiento
    || (mesActual === mesNacimiento && hoy.getDate() < nacimiento.getDate())
  ) {
    edad -= 1;
  }

  return `${edad} años`;
};

export const SolicitudValidacionesStep: React.FC<SolicitudValidacionesStepProps> = ({
  tieneMedidorLuzSinAdeudo,
  viveMaximo5KmTesorera,
  fechaNacimiento,
  montoReferencia,
  comparacionMonto,
  montoMaximoSolicitable,
  montoSolicitado,
  errors,
  onTieneMedidorChange,
  onViveMaximo5KmChange,
  onMontoSolicitadoChange,
}) => (
  <>
    <Card style={styles.optionCard}>
      <SelectorField
        label="¿Tiene medidor de luz sin adeudo?"
        required
        helperText="Selecciona una opción"
        value={tieneMedidorLuzSinAdeudo}
        placeholder="Seleccionar opción"
        options={yesNoOptions}
        errorText={errors.tieneMedidorLuzSinAdeudo}
        onSelect={onTieneMedidorChange}
      />
    </Card>

    <Card style={styles.optionCard}>
      <SelectorField
        label="¿La integrante vive a máximo 5 km de la tesorera?"
        required
        helperText="Selecciona una opción"
        value={viveMaximo5KmTesorera}
        placeholder="Seleccionar opción"
        options={yesNoOptions}
        errorText={errors.viveMaximo5KmTesorera}
        onSelect={onViveMaximo5KmChange}
      />
    </Card>

    <Card style={styles.optionCard}>
      <FormField
        label="Edad calculada"
        helperText="El sistema la obtiene automáticamente de la fecha de nacimiento."
      >
        <View style={styles.readOnlyField}>
          <Text allowFontScaling={false} style={styles.valueText}>
            {calcularEdadTexto(fechaNacimiento)}
          </Text>
        </View>
      </FormField>
    </Card>

    <FormField
      label={montoReferencia
        ? <>
            {`${montoReferencia.origen === 'CICLO_ANTERIOR' ? 'Monto ciclo anterior' : 'Monto solicitado'}: ${montoReferencia.monto == null ? 'Sin dato' : formatCurrency(montoReferencia.monto)}`}
            {comparacionMonto ? (
              <Text
                allowFontScaling={false}
                accessibilityLabel={comparacionMonto.tendencia === 'AUMENTA'
                  ? `El monto solicitado aumenta ${formatCurrency(comparacionMonto.diferencia)}`
                  : `El monto solicitado disminuye ${formatCurrency(comparacionMonto.diferencia)}`}
                style={comparacionMonto.tendencia === 'AUMENTA'
                  ? styles.increases
                  : styles.decreases}
              >
                {comparacionMonto.tendencia === 'AUMENTA' ? '  ↑ ' : '  ↓ '}
                {formatCurrency(comparacionMonto.diferencia)}
              </Text>
            ) : null}
          </>
        : 'Monto solicitado'}
      required
      helperText={`Captura el monto para este ciclo. Máximo ${formatCurrency(montoMaximoSolicitable)}`}
      errorText={errors.montoSolicitado}
    >
      <TextInput
        allowFontScaling={false}
        style={styles.input}
        placeholder="Capturar monto solicitado"
        value={montoSolicitado ? formatCurrency(montoSolicitado) : ''}
        onChangeText={onMontoSolicitadoChange}
        keyboardType="numeric"
      />
    </FormField>
  </>
);

const styles = StyleSheet.create({
  optionCard: {
    marginVertical: spacing.sm,
    paddingVertical: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  valueText: {
    color: colors.textPrimary,
    ...typography.body,
  },
  readOnlyField: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    backgroundColor: colors.borderSoft,
  },
  increases: {
    color: colors.success,
    fontWeight: '800',
  },
  decreases: {
    color: colors.danger,
    fontWeight: '800',
  },
});
