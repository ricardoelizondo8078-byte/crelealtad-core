import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Card,
  DatePickerField,
  FormField,
  SelectorField,
} from '../../components/ui';
import {
  ESTADO_CIVIL_OPTIONS,
  ESTADOS_MEXICO_OPTIONS,
  GENERO_OPTIONS,
  NACIONALIDADES_OPTIONS,
  NIVEL_ESTUDIO_OPTIONS,
} from '../../catalogs';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import {
  formatPhone,
  normalizePhone,
  normalizeUppercaseLettersOnly,
  normalizeUppercaseText,
  toISODateFromDDMMYYYY,
} from '../../utils/input';
import type { SelectorFieldKey } from './solicitud-form.model';

interface SolicitudInformacionPersonalStepProps {
  values: {
    nombres: string;
    apellidoPat: string;
    apellidoMat: string;
    telefono: string;
    fechaNacimientoInput: string;
    curp: string;
    genero: string;
    estadoCivil: string;
    nivelEstudio: string;
    nacionalidad: string;
    estadoNacimiento: string;
    ocupacion: string;
  };
  errors: Record<string, string | undefined>;
  onFieldChange: (field: string, value: string) => void;
  onFechaNacimientoChange: (displayValue: string, isoValue: string | null) => void;
  onCurpChange: (value: string) => void;
  onCurpBlur: () => void;
  onSelect: (field: SelectorFieldKey, value: string) => void;
}

const MONTH_MAP: Record<string, string> = {
  ENE: '01',
  FEB: '02',
  MAR: '03',
  ABR: '04',
  MAY: '05',
  JUN: '06',
  JUL: '07',
  AGO: '08',
  SEP: '09',
  OCT: '10',
  NOV: '11',
  DIC: '12',
};

export const SolicitudInformacionPersonalStep: React.FC<
  SolicitudInformacionPersonalStepProps
> = ({
  values,
  errors,
  onFieldChange,
  onFechaNacimientoChange,
  onCurpChange,
  onCurpBlur,
  onSelect,
}) => {
  const renderSelect = (
    field: SelectorFieldKey,
    label: string,
    value: string,
    options: readonly string[],
    error?: string,
    placeholder = 'Seleccionar opción',
  ) => (
    <Card style={styles.optionCard}>
      <SelectorField
        label={label}
        required
        helperText="Selecciona una opción"
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
      <FormField label="Nombre(s)" required errorText={errors.nombres}>
        <TextInput
          allowFontScaling={false}
          style={styles.input}
          placeholder="Nombre(s) completo(s)"
          value={values.nombres}
          onChangeText={(value) => onFieldChange('nombres', normalizeUppercaseLettersOnly(value))}
          autoCapitalize="characters"
        />
      </FormField>

      <FormField label="Apellido paterno" required errorText={errors.apellido_pat}>
        <TextInput
          allowFontScaling={false}
          style={styles.input}
          placeholder="Apellido paterno"
          value={values.apellidoPat}
          onChangeText={(value) => onFieldChange('apellido_pat', normalizeUppercaseLettersOnly(value))}
          autoCapitalize="characters"
        />
      </FormField>

      <FormField label="Apellido materno" required errorText={errors.apellido_mat}>
        <TextInput
          allowFontScaling={false}
          style={styles.input}
          placeholder="Apellido materno"
          value={values.apellidoMat}
          onChangeText={(value) => onFieldChange('apellido_mat', normalizeUppercaseLettersOnly(value))}
          autoCapitalize="characters"
        />
      </FormField>

      <FormField label="Teléfono" required helperText="10 dígitos" errorText={errors.telefonoInicial}>
        <TextInput
          allowFontScaling={false}
          style={styles.input}
          placeholder="Teléfono"
          value={formatPhone(values.telefono)}
          onChangeText={(value) => onFieldChange('telefonoInicial', normalizePhone(value))}
          keyboardType="numeric"
          maxLength={14}
        />
      </FormField>

      <DatePickerField
        label="Fecha de nacimiento"
        required
        value={values.fechaNacimientoInput}
        onChange={(value) => {
          const parts = value.split('-');
          const isoValue = parts.length === 3
            ? toISODateFromDDMMYYYY(
                `${parts[0]}/${MONTH_MAP[parts[1]] || '01'}/${parts[2]}`,
              )
            : null;
          onFechaNacimientoChange(value, isoValue);
        }}
        errorText={errors.fecha_nac}
      />

      <FormField label="CURP" required helperText="18 caracteres" errorText={errors.curp}>
        <TextInput
          allowFontScaling={false}
          style={styles.input}
          placeholder="CURP"
          value={values.curp}
          onChangeText={onCurpChange}
          onBlur={onCurpBlur}
          autoCapitalize="characters"
          maxLength={18}
        />
      </FormField>

      {renderSelect('genero', 'Género', values.genero, GENERO_OPTIONS, errors.genero)}
      {renderSelect('estado_civil', 'Estado civil', values.estadoCivil, ESTADO_CIVIL_OPTIONS, errors.estado_civil)}
      {renderSelect('nivel_estudio', 'Nivel de estudios', values.nivelEstudio, NIVEL_ESTUDIO_OPTIONS, errors.nivel_estudio)}
      {renderSelect('nacionalidad', 'Nacionalidad', values.nacionalidad, NACIONALIDADES_OPTIONS, errors.nacionalidad)}

      {values.nacionalidad === 'MEXICANA'
        ? renderSelect(
            'estado_nacimiento',
            'Estado de nacimiento',
            values.estadoNacimiento,
            ESTADOS_MEXICO_OPTIONS,
            errors.estado_nacimiento,
            'Seleccionar estado',
          )
        : (
          <FormField label="Estado de nacimiento" helperText="No aplica para nacionalidad extranjera">
            <View style={styles.readOnlyField}>
              <Text allowFontScaling={false} style={styles.valueText}>NO APLICA</Text>
            </View>
          </FormField>
        )}

      <FormField label="Ocupación" required errorText={errors.ocupacion}>
        <TextInput
          allowFontScaling={false}
          style={styles.input}
          placeholder="Ocupación"
          value={values.ocupacion}
          onChangeText={(value) => onFieldChange('ocupacion', normalizeUppercaseText(value))}
          autoCapitalize="characters"
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
