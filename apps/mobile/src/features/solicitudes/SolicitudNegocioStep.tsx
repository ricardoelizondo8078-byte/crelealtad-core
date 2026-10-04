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
import {
  ANTIGUEDAD_NEGOCIO_OPTIONS,
  DEFAULT_STATE,
  NUEVO_LEON_MUNICIPALITIES,
} from '../../catalogs';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import { normalizeDigits, normalizeUppercaseText } from '../../utils/input';
import type { SelectorFieldKey } from './solicitud-form.model';

interface SolicitudNegocioStepProps {
  values: {
    calle: string;
    numeroExterior: string;
    numeroInterior: string;
    codigoPostal: string;
    colonia: string;
    municipio: string;
    desdeCuando: string;
    giro: string;
    ingresoSemanal: string;
    otrosIngresos: string;
    gastos: string;
    total: string;
  };
  errors: Record<string, string | undefined>;
  coloniasDisponibles: string[];
  loadingColonias: boolean;
  onFieldChange: (field: string, value: string) => void;
  onMoneyChange: (
    field: 'negocio_ingreso_semanal' | 'negocio_otros_ingresos' | 'negocio_gastos',
    value: string,
  ) => void;
  onSelect: (field: SelectorFieldKey, value: string) => void;
}

export const SolicitudNegocioStep: React.FC<SolicitudNegocioStepProps> = ({
  values,
  errors,
  coloniasDisponibles,
  loadingColonias,
  onFieldChange,
  onMoneyChange,
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
      <FormField label="Calle" required errorText={errors.negocioCalle}>
        <TextInput
          allowFontScaling={false}
          style={styles.input}
          placeholder="Calle"
          value={values.calle}
          onChangeText={(value) => onFieldChange('negocioCalle', normalizeUppercaseText(value))}
          autoCapitalize="characters"
        />
      </FormField>

      <FormField label="Número exterior" required errorText={errors.negocioNumeroExterior}>
        <TextInput
          allowFontScaling={false}
          style={styles.input}
          placeholder="Número exterior"
          value={values.numeroExterior}
          onChangeText={(value) => onFieldChange(
            'negocioNumeroExterior',
            normalizeUppercaseText(value),
          )}
          autoCapitalize="characters"
        />
      </FormField>

      <FormField label="Número interior" helperText="Opcional">
        <TextInput
          allowFontScaling={false}
          style={styles.input}
          placeholder="Número interior"
          value={values.numeroInterior}
          onChangeText={(value) => onFieldChange(
            'negocioNumeroInterior',
            normalizeUppercaseText(value),
          )}
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
        errorText={errors.negocioCodigoPostal}
      >
        <TextInput
          allowFontScaling={false}
          style={styles.input}
          placeholder="Código postal"
          value={values.codigoPostal}
          onChangeText={(value) => onFieldChange('negocioCodigoPostal', normalizeDigits(value, 5))}
          keyboardType="numeric"
          maxLength={5}
        />
      </FormField>

      {coloniasDisponibles.length > 0
        ? renderSelect(
            'negocio_colonia',
            'Colonia',
            values.colonia,
            coloniasDisponibles,
            errors.negocio_colonia,
            `${coloniasDisponibles.length} colonias disponibles`,
            'Seleccionar colonia',
          )
        : (
          <FormField label="Colonia" required errorText={errors.negocio_colonia}>
            <TextInput
              allowFontScaling={false}
              style={styles.input}
              placeholder="Colonia"
              value={values.colonia}
              onChangeText={(value) => onFieldChange(
                'negocio_colonia',
                normalizeUppercaseText(value),
              )}
              autoCapitalize="characters"
            />
          </FormField>
        )}

      {renderSelect(
        'negocio_municipio',
        'Municipio',
        values.municipio,
        NUEVO_LEON_MUNICIPALITIES,
        errors.negocio_municipio,
        'Selecciona un municipio',
        'Seleccionar municipio',
      )}

      <FormField label="Estado">
        <View style={styles.readOnlyField}>
          <Text allowFontScaling={false} style={styles.valueText}>{DEFAULT_STATE}</Text>
        </View>
      </FormField>

      {renderSelect(
        'negocioDesdeCuando',
        'Desde cuándo tiene su negocio o trabajo actual',
        values.desdeCuando,
        ANTIGUEDAD_NEGOCIO_OPTIONS,
        errors.negocioDesdeCuando,
      )}

      <FormField label="Giro del negocio o trabajo" required errorText={errors.negocio_giro}>
        <TextInput
          allowFontScaling={false}
          style={styles.input}
          placeholder="Giro"
          value={values.giro}
          onChangeText={(value) => onFieldChange('negocio_giro', normalizeUppercaseText(value))}
          autoCapitalize="characters"
        />
      </FormField>

      <FormField
        label="Ingreso semanal"
        required
        helperText="Solo números"
        errorText={errors.negocio_ingreso_semanal}
      >
        <TextInput
          allowFontScaling={false}
          style={styles.input}
          placeholder="$ 0"
          value={values.ingresoSemanal ? formatCurrency(values.ingresoSemanal) : ''}
          onChangeText={(value) => onMoneyChange('negocio_ingreso_semanal', value)}
          keyboardType="numeric"
        />
      </FormField>

      <FormField label="Otros ingresos" helperText="Opcional, solo números">
        <TextInput
          allowFontScaling={false}
          style={styles.input}
          placeholder="$ 0"
          value={values.otrosIngresos ? formatCurrency(values.otrosIngresos) : ''}
          onChangeText={(value) => onMoneyChange('negocio_otros_ingresos', value)}
          keyboardType="numeric"
        />
      </FormField>

      <FormField
        label="Gastos"
        required
        helperText="Solo números"
        errorText={errors.negocio_gastos}
      >
        <TextInput
          allowFontScaling={false}
          style={styles.input}
          placeholder="$ 0"
          value={values.gastos ? formatCurrency(values.gastos) : ''}
          onChangeText={(value) => onMoneyChange('negocio_gastos', value)}
          keyboardType="numeric"
        />
      </FormField>

      <FormField
        label="Total"
        required
        helperText="Calculado automáticamente"
        errorText={errors.negocio_total}
      >
        <View style={styles.readOnlyField}>
          <Text allowFontScaling={false} style={styles.valueText}>
            {formatCurrency(Number(values.total || 0))}
          </Text>
        </View>
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
