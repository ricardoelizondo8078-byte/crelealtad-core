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
import { DEFAULT_STATE, NUEVO_LEON_MUNICIPALITIES } from '../../catalogs';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { normalizeDigits, normalizeUppercaseText } from '../../utils/input';
import { PhoneFieldWithCall } from './PhoneFieldWithCall';
import type { SelectorFieldKey } from './solicitud-form.model';

interface SolicitudDomicilioStepProps {
  values: {
    calle: string;
    numeroExterior: string;
    numeroInterior: string;
    entreCalles: string;
    codigoPostal: string;
    colonia: string;
    municipio: string;
    telefono: string;
    telefonoSecundario: string;
  };
  errors: Record<string, string | undefined>;
  coloniasDisponibles: string[];
  loadingColonias: boolean;
  nombreIntegrante: string;
  onFieldChange: (field: string, value: string) => void;
  onSelect: (field: SelectorFieldKey, value: string) => void;
}

export const SolicitudDomicilioStep: React.FC<SolicitudDomicilioStepProps> = ({
  values,
  errors,
  coloniasDisponibles,
  loadingColonias,
  nombreIntegrante,
  onFieldChange,
  onSelect,
}) => {
  const renderSelect = (
    field: SelectorFieldKey,
    label: string,
    value: string,
    options: readonly string[],
    error?: string,
    helperText = 'Selecciona una opción',
    placeholder = 'Seleccionar opción',
  ) => (
    <Card style={styles.optionCard}>
      <SelectorField
        label={label}
        required
        helperText={helperText}
        value={value}
        placeholder={placeholder}
        options={options}
        errorText={error}
        onSelect={(nextValue) => onSelect(field, nextValue)}
      />
    </Card>
  );

  return (
    <>
      <FormField label="Calle" required errorText={errors.calle}>
        <TextInput
          allowFontScaling={false}
          style={styles.input}
          placeholder="Calle"
          value={values.calle}
          onChangeText={(value) => onFieldChange('calle', normalizeUppercaseText(value))}
          autoCapitalize="characters"
        />
      </FormField>

      <FormField label="Número exterior" required errorText={errors.numeroExterior}>
        <TextInput
          allowFontScaling={false}
          style={styles.input}
          placeholder="Número exterior"
          value={values.numeroExterior}
          onChangeText={(value) => onFieldChange('numeroExterior', normalizeUppercaseText(value))}
          autoCapitalize="characters"
        />
      </FormField>

      <FormField label="Número interior" helperText="Opcional">
        <TextInput
          allowFontScaling={false}
          style={styles.input}
          placeholder="Número interior"
          value={values.numeroInterior}
          onChangeText={(value) => onFieldChange('numeroInterior', normalizeUppercaseText(value))}
          autoCapitalize="characters"
        />
      </FormField>

      <FormField label="Entre calles" required errorText={errors.entreCalles}>
        <TextInput
          allowFontScaling={false}
          style={styles.input}
          placeholder="Entre calles"
          value={values.entreCalles}
          onChangeText={(value) => onFieldChange('entreCalles', normalizeUppercaseText(value))}
          autoCapitalize="characters"
        />
      </FormField>

      <FormField
        label="Código postal"
        required
        helperText={loadingColonias
          ? 'Buscando colonias...'
          : values.codigoPostal.length === 5 && coloniasDisponibles.length === 0
            ? 'Código postal no encontrado'
            : '5 dígitos'}
        errorText={errors.codigoPostal}
      >
        <TextInput
          allowFontScaling={false}
          style={styles.input}
          placeholder="Código postal"
          value={values.codigoPostal}
          onChangeText={(value) => onFieldChange('codigoPostal', normalizeDigits(value, 5))}
          keyboardType="numeric"
          maxLength={5}
        />
      </FormField>

      {coloniasDisponibles.length > 0
        ? renderSelect(
            'colonia',
            'Colonia',
            values.colonia,
            coloniasDisponibles,
            errors.colonia,
            `${coloniasDisponibles.length} colonias disponibles`,
            'Seleccionar colonia',
          )
        : (
          <FormField label="Colonia" required errorText={errors.colonia}>
            <TextInput
              allowFontScaling={false}
              style={styles.input}
              placeholder="Colonia"
              value={values.colonia}
              onChangeText={(value) => onFieldChange('colonia', normalizeUppercaseText(value))}
              autoCapitalize="characters"
            />
          </FormField>
        )}

      {renderSelect(
        'municipio',
        'Municipio',
        values.municipio,
        NUEVO_LEON_MUNICIPALITIES,
        errors.municipio,
        'Selecciona un municipio',
        'Seleccionar municipio',
      )}

      <FormField label="Estado">
        <View style={styles.readOnlyField}>
          <Text allowFontScaling={false} style={styles.valueText}>{DEFAULT_STATE}</Text>
        </View>
      </FormField>

      <FormField label="Teléfono" required helperText="10 dígitos">
        <PhoneFieldWithCall
          value={values.telefono}
          onChange={(value) => onFieldChange('telefonoInicial', value)}
          placeholder="Teléfono"
          nombre={nombreIntegrante}
          relacion="Integrante - Teléfono Principal"
        />
      </FormField>

      <FormField label="Teléfono secundario" helperText="Opcional, 10 dígitos">
        <PhoneFieldWithCall
          value={values.telefonoSecundario}
          onChange={(value) => onFieldChange('telefonoSecundario', value)}
          placeholder="Teléfono secundario (opcional)"
          nombre={nombreIntegrante}
          relacion="Integrante - Teléfono Secundario"
        />
      </FormField>
    </>
  );
};

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
});
