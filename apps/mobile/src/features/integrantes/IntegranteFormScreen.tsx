import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { AppHeader, Card, FormField, PrimaryButton, ScreenContainer, ScreenTitleBar } from '../../components/ui';
import { api } from '../../services/api-client';
import { MAX_SOLICITUD_AMOUNT } from '../../config/parameters';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import { formatPhone, normalizeDigits, normalizePhone, normalizeUppercaseLettersOnly, validatePhone10 } from '../../utils/input';

interface IntegranteFormScreenProps {
  expedienteId: string;
  onSaved?: (result: CreatedIntegranteResult) => void;
  onBack?: () => void;
}

export interface CreatedIntegranteResult {
  id: string;
  es_nueva_con_nosotros: boolean;
}

interface FormErrors {
  nombres?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  telefono?: string;
  montoSolicitado?: string;
}

export const IntegranteFormScreen: React.FC<IntegranteFormScreenProps> = ({ expedienteId, onSaved, onBack }) => {
  const [nombres, setNombres] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [telefono, setTelefono] = useState('');
  const [montoSolicitado, setMontoSolicitado] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!nombres.trim()) {
      nextErrors.nombres = 'El nombre es obligatorio';
    }

    if (!apellidoPaterno.trim()) {
      nextErrors.apellidoPaterno = 'El apellido paterno es obligatorio';
    }

    if (!apellidoMaterno.trim()) {
      nextErrors.apellidoMaterno = 'El apellido materno es obligatorio';
    }

    if (!validatePhone10(telefono)) {
      nextErrors.telefono = 'El teléfono debe tener 10 dígitos';
    }

    if (!montoSolicitado.trim()) {
      nextErrors.montoSolicitado = 'El monto solicitado es obligatorio';
    } else if (Number(montoSolicitado) > MAX_SOLICITUD_AMOUNT) {
      nextErrors.montoSolicitado = `El monto máximo permitido es ${formatCurrency(MAX_SOLICITUD_AMOUNT)}`;
    }

    return nextErrors;
  };

  const handleNamePartChange = (
    value: string,
    field: 'nombres' | 'apellidoPaterno' | 'apellidoMaterno',
  ) => {
    const normalized = normalizeUppercaseLettersOnly(value);

    if (field === 'nombres') {
      setNombres(normalized);
    }

    if (field === 'apellidoPaterno') {
      setApellidoPaterno(normalized);
    }

    if (field === 'apellidoMaterno') {
      setApellidoMaterno(normalized);
    }

    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const handleTelefonoChange = (value: string) => {
    const normalized = normalizePhone(value);
    setTelefono(normalized);
    if (errors.telefono) {
      setErrors((current) => ({ ...current, telefono: undefined }));
    }
  };

  const handleMontoChange = (value: string) => {
    const normalized = normalizeDigits(value);
    setMontoSolicitado(normalized);
    if (errors.montoSolicitado) {
      setErrors((current) => ({ ...current, montoSolicitado: undefined }));
    }
  };

  const isRequiredEmpty =
    !nombres.trim() ||
    !apellidoPaterno.trim() ||
    !apellidoMaterno.trim() ||
    !telefono.trim() ||
    !montoSolicitado.trim();

  const fullName = `${nombres.trim()} ${apellidoPaterno.trim()} ${apellidoMaterno.trim()}`.replace(/\s+/g, ' ').trim();

  const handleSubmit = async () => {
    const nextErrors = validateForm();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await api.post<CreatedIntegranteResult>('/integrantes', {
        expedienteId,
        nombre: fullName,
        nombres: nombres.trim(),
        apellidoPaterno: apellidoPaterno.trim(),
        apellidoMaterno: apellidoMaterno.trim(),
        telefono: normalizePhone(telefono),
        montoSolicitado: Number(montoSolicitado),
      });

      Alert.alert('Éxito', 'Integrante guardado correctamente');
      onSaved?.(result);
    } catch (error: any) {
      const errorMessage = error.data?.message || error.message || 'Error al guardar integrante';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <AppHeader showBackButton onBackPress={onBack} moduleTheme="documentation" />
      <ScreenTitleBar title="Agregar integrante" moduleTheme="documentation" />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Card>
            <Text allowFontScaling={false} style={styles.subtitle}>Registra los datos básicos de la integrante.</Text>

            <FormField label="Nombre(s)" required errorText={errors.nombres}>
              <TextInput allowFontScaling={false}
                style={styles.input}
                placeholder="Nombre(s)"
                value={nombres}
                onChangeText={(value) => handleNamePartChange(value, 'nombres')}
                autoCapitalize="characters"
              />
            </FormField>

            <FormField label="Apellido paterno" required errorText={errors.apellidoPaterno}>
              <TextInput allowFontScaling={false}
                style={styles.input}
                placeholder="Apellido paterno"
                value={apellidoPaterno}
                onChangeText={(value) => handleNamePartChange(value, 'apellidoPaterno')}
                autoCapitalize="characters"
              />
            </FormField>

            <FormField label="Apellido materno" required errorText={errors.apellidoMaterno}>
              <TextInput allowFontScaling={false}
                style={styles.input}
                placeholder="Apellido materno"
                value={apellidoMaterno}
                onChangeText={(value) => handleNamePartChange(value, 'apellidoMaterno')}
                autoCapitalize="characters"
              />
            </FormField>

            <FormField label="Teléfono" required helperText="10 dígitos" errorText={errors.telefono}>
              <TextInput allowFontScaling={false}
                style={styles.input}
                placeholder="Teléfono"
                value={formatPhone(telefono)}
                onChangeText={handleTelefonoChange}
                keyboardType="numeric"
                maxLength={14}
              />
            </FormField>

            <FormField
              label="Monto solicitado"
              required
              helperText={`Máximo ${formatCurrency(MAX_SOLICITUD_AMOUNT)}`}
              errorText={errors.montoSolicitado}
            >
              <TextInput allowFontScaling={false}
                style={styles.input}
                placeholder="Monto solicitado"
                value={montoSolicitado ? formatCurrency(montoSolicitado) : ''}
                onChangeText={handleMontoChange}
                keyboardType="numeric"
              />
            </FormField>

            <PrimaryButton
              title={isSubmitting ? 'Guardando...' : 'Guardar'}
              onPress={handleSubmit}
              disabled={isSubmitting || isRequiredEmpty}
              moduleTheme="documentation"
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1 },
  form: { padding: spacing.lg, gap: spacing.md, paddingBottom: 300 },
  subtitle: { color: colors.textSecondary, marginBottom: spacing.sm, ...typography.body },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
});
