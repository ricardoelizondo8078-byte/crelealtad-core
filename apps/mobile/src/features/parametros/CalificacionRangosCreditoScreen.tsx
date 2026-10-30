import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  AppHeader,
  BottomActionBar,
  Card,
  PickerField,
  ScreenContainer,
  ScreenState,
  ScreenTitleBar,
  SectionTitle,
} from '../../components/ui';
import { ApiError } from '../../services/api-client';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import type {
  ParametroConclusionesSemanaCredito,
  RangoSemanaCreditoEditable,
} from './parametros-conclusiones.api';

interface CalificacionRangosCreditoScreenProps {
  canUpdate: boolean;
  onBack: () => void;
  screenTitle: string;
  sectionTitle: string;
  instructions: string;
  helperText: string;
  entitySingular: string;
  unidad?: string;
  minimo?: number;
  maximo: number;
  initialRange: RangoSemanaCreditoEditable;
  validate: (range: RangoSemanaCreditoEditable) => boolean;
  load: () => Promise<{ parametro: ParametroConclusionesSemanaCredito }>;
  save: (
    range: RangoSemanaCreditoEditable,
  ) => Promise<{ parametro: ParametroConclusionesSemanaCredito }>;
}

type ColorRango = 'verde' | 'amarillo' | 'rojo';
type LimiteRango = 'desde' | 'hasta';

const coloresRango = {
  verde: { label: 'Verde', fill: colors.successSoft, border: colors.success },
  amarillo: { label: 'Amarillo', fill: colors.warningLight, border: colors.warning },
  rojo: { label: 'Rojo', fill: colors.dangerSoft, border: colors.danger },
} as const;

const errorMessage = (error: unknown): string => error instanceof ApiError
  ? error.message
  : error instanceof Error
    ? error.message
    : 'No fue posible completar la operación. Intenta nuevamente.';

const extraerRango = (
  parametro: ParametroConclusionesSemanaCredito,
): RangoSemanaCreditoEditable => ({
  verde_desde: parametro.verde_desde,
  verde_hasta: parametro.verde_hasta,
  amarillo_desde: parametro.amarillo_desde,
  amarillo_hasta: parametro.amarillo_hasta,
  rojo_desde: parametro.rojo_desde,
  rojo_hasta: parametro.rojo_hasta,
});

const rangosIguales = (
  left: RangoSemanaCreditoEditable,
  right: RangoSemanaCreditoEditable,
): boolean => (
  left.verde_desde === right.verde_desde
  && left.verde_hasta === right.verde_hasta
  && left.amarillo_desde === right.amarillo_desde
  && left.amarillo_hasta === right.amarillo_hasta
  && left.rojo_desde === right.rojo_desde
  && left.rojo_hasta === right.rojo_hasta
);

export const CalificacionRangosCreditoScreen: React.FC<
  CalificacionRangosCreditoScreenProps
> = ({
  canUpdate,
  onBack,
  screenTitle,
  sectionTitle,
  instructions,
  helperText,
  entitySingular,
  unidad = '',
  minimo = 1,
  maximo,
  initialRange,
  validate,
  load,
  save,
}) => {
  const [rango, setRango] = useState<RangoSemanaCreditoEditable>(initialRange);
  const [guardado, setGuardado] = useState<RangoSemanaCreditoEditable | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const opciones = useMemo(
    () => Array.from(
      { length: maximo - minimo + 1 },
      (_, index) => `${index + minimo}${unidad}`,
    ),
    [maximo, minimo, unidad],
  );

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await load();
      const actual = extraerRango(response.parametro);
      setRango(actual);
      setGuardado(actual);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    let active = true;
    void load()
      .then((response) => {
        if (!active) return;
        const actual = extraerRango(response.parametro);
        setRango(actual);
        setGuardado(actual);
      })
      .catch((requestError) => {
        if (active) setError(errorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [load]);

  const valido = validate(rango);
  const cambiar = (color: ColorRango, limite: LimiteRango, value: string) => {
    setSuccess(null);
    setRango((actual) => ({
      ...actual,
      [`${color}_${limite}`]: Number(value.replace(unidad, '')),
    }));
  };

  const guardar = async () => {
    if (!canUpdate || !valido) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const solicitado = { ...rango };
      const response = await save(solicitado);
      const devuelto = extraerRango(response.parametro);
      if (!rangosIguales(devuelto, solicitado)) {
        throw new Error('El servidor devolvió una configuración distinta. El cambio no se confirmó.');
      }
      const confirmado = extraerRango((await load()).parametro);
      if (!rangosIguales(confirmado, solicitado)) {
        throw new Error('El servidor no conservó la configuración. El cambio no se confirmó.');
      }
      setRango(confirmado);
      setGuardado(confirmado);
      setSuccess('Los rangos quedaron guardados y publicados.');
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const renderRango = (color: ColorRango) => {
    const presentacion = coloresRango[color];
    return (
      <View key={color} style={styles.rangeRow}>
        <View style={styles.colorColumn}>
          <View
            accessible
            accessibilityLabel={`Clasificación ${presentacion.label}`}
            style={[
              styles.colorCircle,
              { backgroundColor: presentacion.fill, borderColor: presentacion.border },
            ]}
          />
          <Text allowFontScaling={false} style={styles.colorLabel}>{presentacion.label}</Text>
        </View>
        <View style={styles.pickerColumn}>
          <PickerField
            label={`Desde ${presentacion.label.toLowerCase()}`}
            value={`${rango[`${color}_desde`]}${unidad}`}
            options={opciones}
            onSelect={(value) => cambiar(color, 'desde', value)}
            moduleTheme="parameters"
            confirmSelection
            disabled={!canUpdate || saving}
          />
        </View>
        <View style={styles.pickerColumn}>
          <PickerField
            label={`Hasta ${presentacion.label.toLowerCase()}`}
            value={`${rango[`${color}_hasta`]}${unidad}`}
            options={opciones}
            onSelect={(value) => cambiar(color, 'hasta', value)}
            moduleTheme="parameters"
            confirmSelection
            disabled={!canUpdate || saving}
          />
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenContainer moduleTheme="parameters">
        <AppHeader showBackButton onBackPress={onBack} moduleTheme="parameters" />
        <ScreenTitleBar title={screenTitle} moduleTheme="parameters" />
        <ScreenState title="Cargando rangos" loading />
      </ScreenContainer>
    );
  }

  if (error && !guardado) {
    return (
      <ScreenContainer moduleTheme="parameters">
        <AppHeader showBackButton onBackPress={onBack} moduleTheme="parameters" />
        <ScreenTitleBar title={screenTitle} moduleTheme="parameters" />
        <ScreenState title="No fue posible cargar el parámetro" message={error} actionLabel="Reintentar" onAction={() => void cargar()} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer moduleTheme="parameters">
      <AppHeader showBackButton onBackPress={onBack} moduleTheme="parameters" />
      <ScreenTitleBar title={screenTitle} moduleTheme="parameters" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <SectionTitle title={sectionTitle} />
          <Text allowFontScaling={false} style={styles.instructions}>{instructions}</Text>
          {(['verde', 'amarillo', 'rojo'] as const).map(renderRango)}
          {!valido ? (
            <Text allowFontScaling={false} style={styles.validationError}>
              Cada rango debe iniciar antes de terminar y un mismo {entitySingular} no puede pertenecer a dos colores.
            </Text>
          ) : null}
          {error ? <Text allowFontScaling={false} style={styles.validationError}>{error}</Text> : null}
          {success ? <Text allowFontScaling={false} style={styles.success}>{success}</Text> : null}
        </Card>
      </ScrollView>
      <BottomActionBar
        primaryLabel={saving ? 'Guardando…' : 'Guardar y publicar'}
        secondaryLabel="Cancelar"
        onPrimary={guardar}
        onSecondary={onBack}
        primaryDisabled={!canUpdate || saving || !valido}
        helperText={helperText}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  card: { gap: spacing.lg },
  instructions: { ...typography.body, color: colors.textSecondary },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  colorColumn: { width: 72, alignItems: 'center', gap: spacing.xs },
  colorCircle: { width: 42, height: 42, borderRadius: radius.pill, borderWidth: 2 },
  colorLabel: { ...typography.captionStrong, color: colors.textPrimary },
  pickerColumn: { flex: 1, minWidth: 0 },
  validationError: { ...typography.body, color: colors.danger },
  success: { ...typography.bodyStrong, color: colors.primary },
});
