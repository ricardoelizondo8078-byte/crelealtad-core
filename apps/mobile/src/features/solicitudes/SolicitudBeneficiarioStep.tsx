import React from 'react';
import {
  StyleSheet,
  TextInput,
} from 'react-native';
import {
  Card,
  FormField,
  SelectorField,
} from '../../components/ui';
import { PARENTESCO_OPTIONS } from '../../catalogs';
import { colors, radius, spacing } from '../../theme/tokens';
import { normalizeUppercaseText } from '../../utils/input';
import { PhoneFieldWithCall } from './PhoneFieldWithCall';

interface SolicitudBeneficiarioStepProps {
  nombreCompleto: string;
  parentesco: string;
  telefono: string;
  direccion: string;
  errors: {
    nombreCompleto?: string;
    parentesco?: string;
    telefono?: string;
    direccion?: string;
  };
  onNombreCompletoChange: (value: string) => void;
  onParentescoChange: (value: string) => void;
  onTelefonoChange: (value: string) => void;
  onDireccionChange: (value: string) => void;
}

export const SolicitudBeneficiarioStep: React.FC<SolicitudBeneficiarioStepProps> = ({
  nombreCompleto,
  parentesco,
  telefono,
  direccion,
  errors,
  onNombreCompletoChange,
  onParentescoChange,
  onTelefonoChange,
  onDireccionChange,
}) => (
  <>
    <FormField label="Nombre completo" required errorText={errors.nombreCompleto}>
      <TextInput
        allowFontScaling={false}
        style={styles.input}
        placeholder="Nombre completo"
        value={nombreCompleto}
        onChangeText={(value) => onNombreCompletoChange(normalizeUppercaseText(value))}
        autoCapitalize="characters"
      />
    </FormField>

    <Card style={styles.optionCard}>
      <SelectorField
        label="Parentesco"
        required
        helperText="Selecciona una opción"
        value={parentesco}
        placeholder="Seleccionar opción"
        options={PARENTESCO_OPTIONS}
        errorText={errors.parentesco}
        onSelect={onParentescoChange}
      />
    </Card>

    <FormField label="Teléfono" required helperText="10 dígitos" errorText={errors.telefono}>
      <PhoneFieldWithCall
        value={telefono}
        onChange={onTelefonoChange}
        placeholder="Teléfono"
        nombre={nombreCompleto || 'Beneficiario'}
        relacion={parentesco ? `Beneficiario - Parentesco: ${parentesco}` : 'Beneficiario'}
      />
    </FormField>

    <FormField label="Dirección" required errorText={errors.direccion}>
      <TextInput
        allowFontScaling={false}
        style={styles.input}
        placeholder="Dirección"
        value={direccion}
        onChangeText={(value) => onDireccionChange(normalizeUppercaseText(value))}
        autoCapitalize="characters"
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
});
