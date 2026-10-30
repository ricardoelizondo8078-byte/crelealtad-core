import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import {
  AppHeader,
  BottomActionBar,
  Card,
  ConfirmDialog,
  PickerField,
  ScreenContainer,
  ScreenState,
  ScreenTitleBar,
  SectionTitle,
} from '../../components/ui';
import { ApiError } from '../../services/api-client';
import { colors, spacing, typography } from '../../theme/tokens';
import {
  obtenerParametroIntegrantesVerificadas,
  publicarParametroIntegrantesVerificadas,
  type ParametroIntegrantesVerificadas,
} from './parametros-verificacion-cierre.api';

interface IntegrantesVerificadasParametroScreenProps {
  canUpdate: boolean;
  onBack: () => void;
}

const mensajeError = (error: unknown): string => error instanceof ApiError
  ? error.message
  : 'No fue posible completar la operación. Intenta nuevamente.';

const OPCIONES_INTEGRANTES_REQUERIDAS = Array.from(
  { length: 13 },
  (_, index) => String(index),
);

export const IntegrantesVerificadasParametroScreen: React.FC<
  IntegrantesVerificadasParametroScreenProps
> = ({ canUpdate, onBack }) => {
  const [parametro, setParametro] = useState<ParametroIntegrantesVerificadas | null>(null);
  const [valor, setValor] = useState('');
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [consultaRealizada, setConsultaRealizada] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await obtenerParametroIntegrantesVerificadas();
      setParametro(response.parametro);
      setValor(response.parametro
        ? String(response.parametro.integrantes_verificadas_requeridas)
        : '');
      setConsultaRealizada(true);
    } catch (requestError) {
      setError(mensajeError(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // La carga remota actualiza el formulario cuando la promesa termina.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar();
  }, [cargar]);

  const numero = valor === '' ? null : Number(valor);
  const valido = numero != null
    && Number.isInteger(numero)
    && numero >= 0
    && numero <= 12;
  const hayCambios = valido
    && numero !== parametro?.integrantes_verificadas_requeridas;

  const publicar = async () => {
    if (!canUpdate || !valido || !hayCambios || guardando) return;
    setConfirmar(false);
    setGuardando(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await publicarParametroIntegrantesVerificadas(
        numero as number,
        parametro?.revision ?? 0,
      );
      setParametro(response.parametro);
      setValor(String(response.parametro.integrantes_verificadas_requeridas));
      setSuccess('La cantidad quedó guardada y publicada.');
    } catch (requestError) {
      setError(mensajeError(requestError));
    } finally {
      setGuardando(false);
    }
  };

  if (loading && !consultaRealizada) {
    return (
      <ScreenContainer moduleTheme="parameters">
        <AppHeader showBackButton onBackPress={onBack} moduleTheme="parameters" />
        <ScreenTitleBar title="Integrantes para finalizar" moduleTheme="parameters" />
        <ScreenState title="Consultando parámetro" loading />
      </ScreenContainer>
    );
  }

  if (error && !consultaRealizada) {
    return (
      <ScreenContainer moduleTheme="parameters">
        <AppHeader showBackButton onBackPress={onBack} moduleTheme="parameters" />
        <ScreenTitleBar title="Integrantes para finalizar" moduleTheme="parameters" />
        <ScreenState
          title="No se pudo consultar"
          message={error}
          actionLabel="Reintentar"
          onAction={() => void cargar()}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer moduleTheme="parameters">
      <AppHeader showBackButton onBackPress={onBack} moduleTheme="parameters" />
      <ScreenTitleBar title="Integrantes para finalizar" moduleTheme="parameters" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <SectionTitle title="Finalizar verificación de grupo" />
          <Text allowFontScaling={false} style={styles.helpText}>
            Define cuántas integrantes deben tener una revisión concluida para habilitar el botón
            Finalizar Verificación de Grupo. Cuentan tanto las aprobadas como las rechazadas.
          </Text>
          <PickerField
            label="Integrantes verificadas requeridas"
            value={valor}
            options={OPCIONES_INTEGRANTES_REQUERIDAS}
            onSelect={(nextValue) => {
              setValor(nextValue);
              setSuccess(null);
            }}
            moduleTheme="parameters"
            disabled={!canUpdate || guardando}
            confirmSelection
            required
            placeholder="Selecciona de 0 a 12"
            helperText="Desliza y selecciona una cantidad entre 0 y 12 integrantes."
          />
        </Card>
        {error ? <Text allowFontScaling={false} style={styles.error}>{error}</Text> : null}
        {success ? (
          <Text
            accessibilityLiveRegion="polite"
            allowFontScaling={false}
            style={styles.success}
          >
            {success}
          </Text>
        ) : null}
      </ScrollView>

      <BottomActionBar
        primaryLabel={guardando ? 'Publicando…' : canUpdate ? 'Guardar y publicar' : 'Sólo lectura'}
        secondaryLabel="Cancelar"
        onPrimary={() => setConfirmar(true)}
        onSecondary={onBack}
        primaryDisabled={!canUpdate || !hayCambios || guardando}
        secondaryDisabled={guardando}
        helperText={parametro
          ? `Versión publicada ${parametro.revision}`
          : 'Sin configuración publicada: el botón de cierre permanece bloqueado.'}
      />

      <ConfirmDialog
        visible={confirmar}
        title="Publicar cantidad requerida"
        message={numero === 0
          ? 'El botón de finalizar quedará habilitado sin exigir revisiones individuales concluidas.'
          : `El botón de finalizar se habilitará al concluir ${numero} ${numero === 1 ? 'revisión' : 'revisiones'} individuales.`}
        confirmLabel="Guardar y publicar"
        cancelLabel="Cancelar"
        onConfirm={() => void publicar()}
        onCancel={() => setConfirmar(false)}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  card: { gap: spacing.md },
  helpText: { ...typography.body, color: colors.textSecondary },
  error: { ...typography.body, color: colors.danger, textAlign: 'center' },
  success: { ...typography.bodyStrong, color: colors.primary, textAlign: 'center' },
});
