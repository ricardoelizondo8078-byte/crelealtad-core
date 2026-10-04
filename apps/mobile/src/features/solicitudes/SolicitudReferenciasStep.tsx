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
import { PARENTESCO_OPTIONS } from '../../catalogs';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import { normalizeUppercaseText } from '../../utils/input';
import { PhoneFieldWithCall } from './PhoneFieldWithCall';
import type { SelectorFieldKey } from './solicitud-form.model';

interface ReferenciaValues {
  nombreCompleto: string;
  parentesco: string;
  telefono: string;
  direccion: string;
}

interface SolicitudReferenciasStepProps {
  referencia1: ReferenciaValues;
  referencia2: ReferenciaValues;
  pareja: {
    nombreCompleto: string;
    actividadEconomica: string;
    ingresoSemanal: string;
  };
  errors: Record<string, string | undefined>;
  onFieldChange: (field: string, value: string) => void;
  onPhoneChange: (
    field: 'referencia1Telefono' | 'referencia2Telefono',
    value: string,
  ) => void;
  onMoneyChange: (field: 'pareja_ingreso_semanal', value: string) => void;
  onSelect: (field: SelectorFieldKey, value: string) => void;
}

export const SolicitudReferenciasStep: React.FC<SolicitudReferenciasStepProps> = ({
  referencia1,
  referencia2,
  pareja,
  errors,
  onFieldChange,
  onPhoneChange,
  onMoneyChange,
  onSelect,
}) => {
  const renderReference = (
    index: 1 | 2,
    reference: ReferenciaValues,
  ) => {
    const prefix = `referencia${index}`;
    const phoneField = index === 1 ? 'referencia1Telefono' : 'referencia2Telefono';
    const parentescoField = index === 1
      ? 'referencia1Parentesco'
      : 'referencia2Parentesco';

    return (
      <>
        <View style={styles.sectionRow}>
          <Text allowFontScaling={false} style={styles.sectionTitle}>REFERENCIA {index}</Text>
        </View>

        <FormField
          label="Nombre completo"
          required
          errorText={errors[`${prefix}NombreCompleto`]}
        >
          <TextInput
            allowFontScaling={false}
            style={styles.input}
            placeholder="Nombre completo"
            value={reference.nombreCompleto}
            onChangeText={(value) => onFieldChange(
              `${prefix}NombreCompleto`,
              normalizeUppercaseText(value),
            )}
            autoCapitalize="characters"
          />
        </FormField>

        <Card style={styles.optionCard}>
          <SelectorField
            label="Parentesco"
            required
            helperText="Selecciona una opción"
            value={reference.parentesco}
            placeholder="Seleccionar opción"
            options={PARENTESCO_OPTIONS}
            errorText={errors[`${prefix}Parentesco`]}
            onSelect={(value) => onSelect(parentescoField, value)}
          />
        </Card>

        <FormField
          label="Teléfono"
          required
          helperText="10 dígitos"
          errorText={errors[`${prefix}Telefono`]}
        >
          <PhoneFieldWithCall
            value={reference.telefono}
            onChange={(value) => onPhoneChange(phoneField, value)}
            placeholder="Teléfono"
            nombre={reference.nombreCompleto || `Referencia ${index}`}
            relacion={reference.parentesco
              ? `Referencia ${index} - Parentesco: ${reference.parentesco}`
              : `Referencia ${index}`}
          />
        </FormField>

        <FormField label="Dirección" required errorText={errors[`${prefix}Direccion`]}>
          <TextInput
            allowFontScaling={false}
            style={styles.input}
            placeholder="Dirección"
            value={reference.direccion}
            onChangeText={(value) => onFieldChange(
              `${prefix}Direccion`,
              normalizeUppercaseText(value),
            )}
            autoCapitalize="characters"
          />
        </FormField>
      </>
    );
  };

  return (
    <>
      {renderReference(1, referencia1)}
      {renderReference(2, referencia2)}

      <View style={styles.sectionRow}>
        <Text allowFontScaling={false} style={styles.sectionTitle}>DATOS DE SU PAREJA</Text>
      </View>

      <FormField label="Nombre completo" helperText="Opcional">
        <TextInput
          allowFontScaling={false}
          style={styles.input}
          placeholder="Nombre completo"
          value={pareja.nombreCompleto}
          onChangeText={(value) => onFieldChange(
            'parejaNombreCompleto',
            normalizeUppercaseText(value),
          )}
          autoCapitalize="characters"
        />
      </FormField>

      <FormField label="Actividad económica" helperText="Opcional">
        <TextInput
          allowFontScaling={false}
          style={styles.input}
          placeholder="Actividad económica"
          value={pareja.actividadEconomica}
          onChangeText={(value) => onFieldChange(
            'parejaActividadEconomica',
            normalizeUppercaseText(value),
          )}
          autoCapitalize="characters"
        />
      </FormField>

      <FormField label="Ingreso semanal" helperText="Solo números">
        <TextInput
          allowFontScaling={false}
          style={styles.input}
          placeholder="$ 0"
          value={pareja.ingresoSemanal ? formatCurrency(pareja.ingresoSemanal) : ''}
          onChangeText={(value) => onMoneyChange('pareja_ingreso_semanal', value)}
          keyboardType="numeric"
        />
      </FormField>
    </>
  );
};

const styles = StyleSheet.create({
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
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
});
