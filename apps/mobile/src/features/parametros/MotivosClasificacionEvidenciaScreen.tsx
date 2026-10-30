import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  AppHeader,
  Card,
  PrimaryButton,
  ScreenContainer,
  ScreenState,
  ScreenTitleBar,
  SecondaryButton,
  SectionTitle,
  StickySectionHeader,
  StatusBadge,
  TextInput,
} from '../../components/ui';
import { ApiError } from '../../services/api-client';
import { colors, moduleThemes, spacing, touchTargets, typography } from '../../theme/tokens';
import {
  actualizarMotivoClasificacionEvidencia,
  cambiarEstadoMotivoClasificacionEvidencia,
  crearMotivoClasificacionEvidencia,
  type ClasificacionMotivoEvidencia,
  listarMotivosClasificacionEvidencia,
  reordenarMotivosClasificacionEvidencia,
  type MotivoClasificacionEvidencia,
} from './parametros-evidencia-motivos.api';

interface MotivosClasificacionEvidenciaScreenProps {
  clasificacion: ClasificacionMotivoEvidencia;
  canUpdate: boolean;
  onBack: () => void;
}

const etiquetas: Record<ClasificacionMotivoEvidencia, string> = {
  VERDE: 'verde',
  AMARILLO: 'amarilla',
  ROJO: 'roja',
};

const mensajeError = (error: unknown): string => error instanceof ApiError
  ? error.message
  : 'No fue posible completar la operación. Intenta nuevamente.';

export const MotivosClasificacionEvidenciaScreen: React.FC<
  MotivosClasificacionEvidenciaScreenProps
> = ({ clasificacion, canUpdate, onBack }) => {
  const [items, setItems] = useState<MotivoClasificacionEvidencia[]>([]);
  const [concepto, setConcepto] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [conceptoEditado, setConceptoEditado] = useState('');
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const color = etiquetas[clasificacion];
  const conceptoLimpio = useMemo(() => concepto.trim().replace(/\s+/g, ' '), [concepto]);
  const conceptoEditadoLimpio = useMemo(
    () => conceptoEditado.trim().replace(/\s+/g, ' '),
    [conceptoEditado],
  );

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listarMotivosClasificacionEvidencia(clasificacion);
      setItems(response.items);
    } catch (requestError) {
      setError(mensajeError(requestError));
    } finally {
      setLoading(false);
    }
  }, [clasificacion]);

  useEffect(() => {
    let activo = true;
    const cargarInicial = async () => {
      try {
        const response = await listarMotivosClasificacionEvidencia(clasificacion);
        if (activo) setItems(response.items);
      } catch (requestError) {
        if (activo) setError(mensajeError(requestError));
      } finally {
        if (activo) setLoading(false);
      }
    };

    void cargarInicial();
    return () => {
      activo = false;
    };
  }, [clasificacion]);

  const agregar = async () => {
    if (!canUpdate || conceptoLimpio.length < 2 || guardando) return;
    setGuardando(true);
    setError(null);
    try {
      await crearMotivoClasificacionEvidencia(clasificacion, conceptoLimpio);
      setConcepto('');
      await cargar();
    } catch (requestError) {
      setError(mensajeError(requestError));
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (item: MotivoClasificacionEvidencia) => {
    if (!canUpdate || guardando) return;
    setGuardando(true);
    setError(null);
    try {
      await cambiarEstadoMotivoClasificacionEvidencia(item.id, !item.activo);
      await cargar();
    } catch (requestError) {
      setError(mensajeError(requestError));
    } finally {
      setGuardando(false);
    }
  };

  const iniciarEdicion = (item: MotivoClasificacionEvidencia) => {
    if (!canUpdate || guardando) return;
    setEditandoId(item.id);
    setConceptoEditado(item.concepto);
    setError(null);
  };

  const cancelarEdicion = () => {
    if (guardando) return;
    setEditandoId(null);
    setConceptoEditado('');
  };

  const guardarEdicion = async () => {
    if (!editandoId || conceptoEditadoLimpio.length < 2 || guardando) return;
    setGuardando(true);
    setError(null);
    try {
      await actualizarMotivoClasificacionEvidencia(editandoId, conceptoEditadoLimpio);
      setEditandoId(null);
      setConceptoEditado('');
      await cargar();
    } catch (requestError) {
      setError(mensajeError(requestError));
    } finally {
      setGuardando(false);
    }
  };

  const mover = async (indice: number, desplazamiento: -1 | 1) => {
    const destino = indice + desplazamiento;
    if (!canUpdate || guardando || destino < 0 || destino >= items.length) return;
    const reordenados = [...items];
    [reordenados[indice], reordenados[destino]] = [
      reordenados[destino],
      reordenados[indice],
    ];
    setGuardando(true);
    setError(null);
    try {
      const response = await reordenarMotivosClasificacionEvidencia(
        clasificacion,
        reordenados.map((item) => item.id),
      );
      setItems(response.items);
    } catch (requestError) {
      setError(mensajeError(requestError));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ScreenContainer moduleTheme="parameters">
      <AppHeader showBackButton onBackPress={onBack} moduleTheme="parameters" />
      <ScreenTitleBar title={`Motivos de evidencia ${color}`} moduleTheme="parameters" />
      {loading && items.length === 0 ? (
        <ScreenState title="Consultando motivos" loading />
      ) : error && items.length === 0 ? (
        <ScreenState
          title="No se pudieron consultar"
          message={error}
          actionLabel="Reintentar"
          onAction={cargar}
        />
      ) : (
        <SectionList
          sections={[{ title: 'CONCEPTOS REGISTRADOS', data: items }]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          stickySectionHeadersEnabled
          refreshing={loading}
          onRefresh={cargar}
          ListHeaderComponent={(
            <View style={styles.headerContent}>
              {canUpdate ? (
                <Card variant="outlined" moduleTheme="parameters" style={styles.formCard}>
                  <SectionTitle title="Agregar concepto" />
                  <TextInput
                    label={`Motivo para clasificación ${color}`}
                    value={concepto}
                    onChangeText={setConcepto}
                    moduleTheme="parameters"
                    maxLength={120}
                    helperText="Este texto aparecerá como una opción al clasificar la fotografía."
                    error={concepto.length > 0 && conceptoLimpio.length < 2
                      ? 'Escribe al menos 2 caracteres.'
                      : undefined}
                    strongBorder
                  />
                  <PrimaryButton
                    title="Agregar concepto"
                    moduleTheme="parameters"
                    disabled={conceptoLimpio.length < 2 || guardando}
                    onPress={agregar}
                  />
                </Card>
              ) : null}
              {error ? <Text allowFontScaling={false} style={styles.errorText}>{error}</Text> : null}
            </View>
          )}
          renderSectionHeader={({ section }) => (
            <View style={styles.stickyHeaderShell}>
              <StickySectionHeader
                title={section.title}
                moduleTheme="parameters"
              />
            </View>
          )}
          ListFooterComponent={items.length === 0 ? (
            <Card>
              <Text allowFontScaling={false} style={styles.emptyText}>
                Todavía no hay conceptos para la clasificación {color}.
              </Text>
            </Card>
          ) : null}
          renderItem={({ item, index }) => (
            <Card style={styles.itemCard}>
              {editandoId === item.id ? (
                <>
                  <TextInput
                    label="Editar motivo"
                    value={conceptoEditado}
                    onChangeText={setConceptoEditado}
                    moduleTheme="parameters"
                    maxLength={120}
                    helperText="Si el motivo ya fue usado, conserva el historial: desactívalo y crea otro."
                    error={conceptoEditado.length > 0 && conceptoEditadoLimpio.length < 2
                      ? 'Escribe al menos 2 caracteres.'
                      : undefined}
                    strongBorder
                  />
                  <View style={styles.actionsRow}>
                    <PrimaryButton
                      title="Guardar cambio"
                      moduleTheme="parameters"
                      disabled={conceptoEditadoLimpio.length < 2 || guardando}
                      onPress={guardarEdicion}
                      style={styles.compactButton}
                    />
                    <SecondaryButton
                      title="Cancelar"
                      moduleTheme="parameters"
                      disabled={guardando}
                      onPress={cancelarEdicion}
                      style={styles.compactButton}
                    />
                  </View>
                </>
              ) : (
                <View style={styles.itemLayout}>
                  <View style={styles.positionSlot}>
                    <View
                      accessible
                      accessibilityLabel={`Posición ${item.orden}`}
                      style={styles.positionBadge}
                    >
                      <Text allowFontScaling={false} style={styles.positionText}>
                        {item.orden}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.itemBody}>
                    <View style={styles.itemHeading}>
                      <Text allowFontScaling={false} style={styles.concepto}>{item.concepto}</Text>
                      <StatusBadge
                        label={item.activo ? 'ACTIVO' : 'INACTIVO'}
                        tone={item.activo ? 'success' : 'progress'}
                      />
                    </View>
                    {canUpdate ? (
                      <View testID={`motivo-actions-${item.id}`} style={styles.actionsRow}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Subir ${item.concepto}`}
                          accessibilityState={{ disabled: guardando || index === 0 }}
                          disabled={guardando || index === 0}
                          onPress={() => mover(index, -1)}
                          style={({ pressed }) => [
                            styles.orderButton,
                            (guardando || index === 0) && styles.disabledButton,
                            pressed && styles.pressedButton,
                          ]}
                        >
                          <Text allowFontScaling={false} style={styles.orderArrow}>↑</Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Bajar ${item.concepto}`}
                          accessibilityState={{ disabled: guardando || index === items.length - 1 }}
                          disabled={guardando || index === items.length - 1}
                          onPress={() => mover(index, 1)}
                          style={({ pressed }) => [
                            styles.orderButton,
                            (guardando || index === items.length - 1) && styles.disabledButton,
                            pressed && styles.pressedButton,
                          ]}
                        >
                          <Text allowFontScaling={false} style={styles.orderArrow}>↓</Text>
                        </Pressable>
                        <SecondaryButton
                          title="Editar"
                          moduleTheme="parameters"
                          disabled={guardando}
                          onPress={() => iniciarEdicion(item)}
                          style={styles.compactButton}
                        />
                        <SecondaryButton
                          title={item.activo ? 'Desactivar' : 'Reactivar'}
                          moduleTheme="parameters"
                          disabled={guardando}
                          onPress={() => cambiarEstado(item)}
                          style={styles.compactButton}
                        />
                      </View>
                    ) : null}
                  </View>
                </View>
              )}
            </Card>
          )}
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  headerContent: { gap: spacing.md, marginBottom: spacing.md },
  formCard: { gap: spacing.md },
  stickyHeaderShell: {
    zIndex: 2,
    marginHorizontal: -spacing.xs,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  itemCard: { gap: spacing.sm, padding: spacing.md },
  itemLayout: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  itemBody: { flex: 1, gap: spacing.sm },
  itemHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  positionSlot: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderWidth: 2,
    borderColor: moduleThemes.parameters.primary,
    borderRadius: 24,
    backgroundColor: moduleThemes.parameters.headerAccent,
  },
  positionText: { ...typography.metricValue, color: moduleThemes.parameters.primary },
  concepto: { ...typography.bodyStrong, color: colors.textPrimary, flex: 1 },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  compactButton: {
    flex: 1,
    minHeight: touchTargets.minimum,
    paddingVertical: spacing.xs,
  },
  orderButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: touchTargets.minimum,
    minHeight: touchTargets.minimum,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  orderArrow: { ...typography.sectionTitle, color: colors.textPrimary },
  disabledButton: { opacity: 0.35 },
  pressedButton: { opacity: 0.7 },
  emptyText: { ...typography.body, color: colors.textSecondary },
  errorText: { ...typography.body, color: colors.error },
});
