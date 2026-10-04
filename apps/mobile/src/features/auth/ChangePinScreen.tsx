import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  AppHeader,
  Card,
  PrimaryButton,
  ScreenContainer,
  ScreenTitleBar,
  SecondaryButton,
} from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { ApiError, api } from '../../services/api-client';
import { colors, spacing, typography } from '../../theme/tokens';
import { PinKeypad } from './PinKeypad';

type PinStep = 0 | 1 | 2;

interface CambioPinResponse {
  requiere_cambio_pin: false;
}

const STEP_CONTENT: Record<PinStep, { title: string; message: string }> = {
  0: {
    title: 'Confirma tu PIN actual',
    message: 'Es el PIN que usaste para iniciar sesión.',
  },
  1: {
    title: 'Captura tu nuevo PIN',
    message: 'Debe tener cuatro dígitos y ser diferente al PIN actual.',
  },
  2: {
    title: 'Repite tu nuevo PIN',
    message: 'Captúralo nuevamente para confirmar que está correcto.',
  },
};

const errorMessage = (error: unknown): string => {
  if (!(error instanceof ApiError)) {
    return 'No se pudo cambiar el PIN. Intenta nuevamente.';
  }
  if (error.status === 0) return error.message;
  if (error.status === 400 && error.message === 'El PIN actual es incorrecto') {
    return 'El PIN actual no coincide. Captúralo nuevamente.';
  }
  if (error.status === 429) return 'Demasiados intentos. Espera un minuto e intenta nuevamente.';
  return error.message || 'No se pudo cambiar el PIN. Intenta nuevamente.';
};

export function ChangePinScreen() {
  const { usuario, actualizarUsuario, logout } = useAuth();
  const [step, setStep] = useState<PinStep>(0);
  const [pinActual, setPinActual] = useState('');
  const [nuevoPin, setNuevoPin] = useState('');
  const [confirmacionPin, setConfirmacionPin] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  if (!usuario) return null;

  const value = step === 0 ? pinActual : step === 1 ? nuevoPin : confirmacionPin;
  const setValue = step === 0 ? setPinActual : step === 1 ? setNuevoPin : setConfirmacionPin;
  const content = STEP_CONTENT[step];

  const submit = async () => {
    if (confirmacionPin !== nuevoPin) {
      setConfirmacionPin('');
      setError('Los dos PIN nuevos no coinciden. Repite la confirmación.');
      return;
    }

    setSending(true);
    setError('');
    try {
      const response = await api.post<CambioPinResponse>('/auth/cambiar-pin', {
        pin_actual: pinActual,
        nuevo_pin: nuevoPin,
        confirmacion_pin: confirmacionPin,
      }, { showProcessing: false });
      await actualizarUsuario({
        ...usuario,
        requiere_cambio_pin: response.requiere_cambio_pin,
      });
      setPinActual('');
      setNuevoPin('');
      setConfirmacionPin('');
    } catch (submitError) {
      if (
        submitError instanceof ApiError
        && submitError.status === 400
        && submitError.message === 'El PIN actual es incorrecto'
      ) {
        setStep(0);
        setPinActual('');
      }
      setError(errorMessage(submitError));
    } finally {
      setSending(false);
    }
  };

  const continueFlow = (): void | Promise<void> => {
    if (value.length !== 4) {
      setError('Captura los cuatro dígitos para continuar.');
      return;
    }
    if (step === 0) {
      setStep(1);
      setError('');
      return;
    }
    if (step === 1) {
      if (nuevoPin === pinActual) {
        setNuevoPin('');
        setError('El nuevo PIN debe ser diferente al PIN actual.');
        return;
      }
      setStep(2);
      setError('');
      return;
    }
    return submit();
  };

  const goBack = () => {
    setError('');
    if (step === 2) {
      setConfirmacionPin('');
      setStep(1);
      return;
    }
    setNuevoPin('');
    setConfirmacionPin('');
    setStep(0);
  };

  return (
    <ScreenContainer moduleTheme="general" scroll contentStyle={styles.screenContent}>
      <AppHeader moduleTheme="general" showPendingIndicator={false} />
      <ScreenTitleBar title="Cambio obligatorio de PIN" moduleTheme="general" />
      <View style={styles.content}>
        <Card>
          <Text allowFontScaling={false} style={styles.progress}>Paso {step + 1} de 3</Text>
          <Text allowFontScaling={false} style={styles.title}>{content.title}</Text>
          <Text allowFontScaling={false} style={styles.message}>{content.message}</Text>

          <PinKeypad
            value={value}
            disabled={sending}
            onChange={(nextValue) => {
              setValue(nextValue);
              setError('');
            }}
          />

          {error ? (
            <Text accessibilityRole="alert" allowFontScaling={false} style={styles.error}>
              {error}
            </Text>
          ) : (
            <View style={styles.errorPlaceholder} />
          )}

          <View style={styles.actions}>
            <PrimaryButton
              title={step === 2 ? 'Guardar nuevo PIN' : 'Continuar'}
              moduleTheme="general"
              disabled={sending || value.length !== 4}
              onPress={continueFlow}
              style={styles.button}
            />
            <SecondaryButton
              title={step === 0 ? 'Cerrar sesión' : 'Atrás'}
              tone={step === 0 ? 'danger' : 'default'}
              disabled={sending}
              onPress={step === 0 ? logout : goBack}
              style={styles.button}
            />
          </View>
        </Card>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  progress: {
    ...typography.captionStrong,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.contextTitle,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  error: {
    ...typography.bodyStrong,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  errorPlaceholder: {
    minHeight: spacing.xxl,
  },
  actions: {
    gap: spacing.md,
  },
  button: {
    flex: 0,
  },
});
