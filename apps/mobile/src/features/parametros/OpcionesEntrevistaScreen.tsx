import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppHeader, Card, PrimaryButton, ScreenContainer, ScreenState, ScreenTitleBar, SecondaryButton, StatusBadge, TextInput } from '../../components/ui';
import { ApiError } from '../../services/api-client';
import { colors, moduleThemes, radius, spacing, touchTargets, typography } from '../../theme/tokens';
import { actualizarParametroEntrevista, cambiarEstadoParametroEntrevista, crearParametroEntrevista, FamiliaParametroEntrevista, listarParametrosEntrevista, ParametroEntrevistaOpcion, reordenarParametrosEntrevista } from './parametros-entrevista.api';

interface Props {
  familia: FamiliaParametroEntrevista;
  titulo: string;
  extensible: boolean;
  canUpdate: boolean;
  onBack: () => void;
}

const mensajeError = (error: unknown) => error instanceof ApiError
  ? error.message : 'No fue posible completar la operación. Intenta nuevamente.';

export const OpcionesEntrevistaScreen: React.FC<Props> = ({ familia, titulo, extensible, canUpdate, onBack }) => {
  const [items, setItems] = useState<ParametroEntrevistaOpcion[]>([]);
  const [texto, setTexto] = useState('');
  const [editando, setEditando] = useState<ParametroEntrevistaOpcion | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const limpio = useMemo(() => texto.trim().replace(/\s+/g, ' '), [texto]);

  const cargar = useCallback(async () => {
    setLoading(true); setError(null);
    try { setItems((await listarParametrosEntrevista(familia)).items); }
    catch (e) { setError(mensajeError(e)); }
    finally { setLoading(false); }
  }, [familia]);
  useEffect(() => {
    let activo = true;
    const cargarInicial = async () => {
      try {
        const response = await listarParametrosEntrevista(familia);
        if (activo) setItems(response.items);
      } catch (e) {
        if (activo) setError(mensajeError(e));
      } finally {
        if (activo) setLoading(false);
      }
    };
    void cargarInicial();
    return () => { activo = false; };
  }, [familia]);

  const ejecutar = async (accion: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true); setError(null);
    try { await accion(); setTexto(''); setEditando(null); await cargar(); }
    catch (e) { setError(mensajeError(e)); }
    finally { setBusy(false); }
  };

  const mover = async (index: number, delta: -1 | 1) => {
    const destino = index + delta;
    if (destino < 0 || destino >= items.length) return;
    const orden = [...items];
    [orden[index], orden[destino]] = [orden[destino], orden[index]];
    await ejecutar(() => reordenarParametrosEntrevista(familia, orden.map((x) => x.id)));
  };

  return (
    <ScreenContainer moduleTheme="parameters">
      <AppHeader showBackButton onBackPress={onBack} moduleTheme="parameters" />
      <ScreenTitleBar title={titulo} moduleTheme="parameters" />
      {loading && items.length === 0 ? <ScreenState title="Consultando opciones" loading /> : error && items.length === 0 ? (
        <ScreenState title="No se pudieron consultar" message={error} actionLabel="Reintentar" onAction={cargar} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          refreshing={loading}
          onRefresh={cargar}
          ListHeaderComponent={(
            <View style={styles.header}>
              <Card variant="outlined" moduleTheme="parameters" style={styles.infoCard}>
                <Text allowFontScaling={false} style={styles.help}>
                  Puedes editar el texto, activar, desactivar y ordenar. El código interno permanece estable para proteger respuestas guardadas.
                </Text>
              </Card>
              {canUpdate && extensible && !editando ? (
                <Card variant="outlined" moduleTheme="parameters" style={styles.formCard}>
                  <TextInput label="Nueva opción" value={texto} onChangeText={setTexto} maxLength={120} moduleTheme="parameters" strongBorder />
                  <PrimaryButton title="Agregar opción" moduleTheme="parameters" disabled={limpio.length < 2 || busy} onPress={() => void ejecutar(() => crearParametroEntrevista(familia, limpio))} />
                </Card>
              ) : null}
              {error ? <Text allowFontScaling={false} style={styles.error}>{error}</Text> : null}
            </View>
          )}
          renderItem={({ item, index }) => (
            <Card style={styles.itemCard}>
              {editando?.id === item.id ? (
                <>
                  <TextInput label="Editar opción" value={texto} onChangeText={setTexto} maxLength={120} moduleTheme="parameters" strongBorder />
                  <View style={styles.actions}>
                    <PrimaryButton title="Guardar" moduleTheme="parameters" disabled={limpio.length < 2 || busy} onPress={() => void ejecutar(() => actualizarParametroEntrevista(item.id, limpio))} style={styles.flexButton} />
                    <SecondaryButton title="Cancelar" moduleTheme="parameters" onPress={() => { setEditando(null); setTexto(''); }} style={styles.flexButton} />
                  </View>
                </>
              ) : (
                <View style={styles.itemLayout}>
                  <View style={styles.positionSlot}>
                    <View accessible accessibilityLabel={`Posición ${item.orden}`} style={styles.positionBadge}>
                      <Text allowFontScaling={false} style={styles.positionText}>{item.orden}</Text>
                    </View>
                  </View>
                  <View style={styles.itemBody}>
                    <View style={styles.heading}>
                      <Text allowFontScaling={false} style={styles.label}>{item.etiqueta}</Text>
                      <StatusBadge label={item.activo ? 'ACTIVO' : 'INACTIVO'} tone={item.activo ? 'success' : 'progress'} />
                    </View>
                    {canUpdate ? (
                      <View style={styles.actions}>
                        <Pressable accessibilityRole="button" accessibilityLabel={`Subir ${item.etiqueta}`} disabled={busy || index === 0} onPress={() => void mover(index, -1)} style={styles.order}><Text style={styles.arrow}>↑</Text></Pressable>
                        <Pressable accessibilityRole="button" accessibilityLabel={`Bajar ${item.etiqueta}`} disabled={busy || index === items.length - 1} onPress={() => void mover(index, 1)} style={styles.order}><Text style={styles.arrow}>↓</Text></Pressable>
                        <SecondaryButton title="Editar" moduleTheme="parameters" disabled={busy} onPress={() => { setEditando(item); setTexto(item.etiqueta); }} style={styles.flexButton} />
                        <SecondaryButton title={item.activo ? 'Desactivar' : 'Reactivar'} moduleTheme="parameters" disabled={busy} onPress={() => void ejecutar(() => cambiarEstadoParametroEntrevista(item.id, !item.activo))} style={styles.flexButton} />
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
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  header: { gap: spacing.md, marginBottom: spacing.md }, infoCard: { gap: spacing.sm }, formCard: { gap: spacing.md },
  help: { ...typography.body, color: colors.textSecondary }, error: { ...typography.body, color: colors.danger },
  itemCard: { gap: spacing.md, padding: spacing.md },
  itemLayout: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.sm },
  itemBody: { flex: 1, gap: spacing.sm },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  positionSlot: { width: 52, alignItems: 'center', justifyContent: 'center' },
  positionBadge: { width: 48, height: 48, borderWidth: 2, borderColor: moduleThemes.parameters.primary, borderRadius: 24, backgroundColor: moduleThemes.parameters.headerAccent, alignItems: 'center', justifyContent: 'center' },
  positionText: { ...typography.metricValue, color: moduleThemes.parameters.primary }, label: { ...typography.bodyStrong, color: colors.textPrimary, flex: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  flexButton: { flex: 1, minWidth: 0, minHeight: touchTargets.minimum, paddingVertical: spacing.xs },
  order: { width: touchTargets.minimum, height: touchTargets.minimum, borderWidth: 1, borderColor: colors.gray[400], borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  arrow: { ...typography.sectionTitle, color: colors.gray[800] },
});
