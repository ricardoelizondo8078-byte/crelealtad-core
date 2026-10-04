import React, { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import {
  AppHeader,
  BottomSheetSelector,
  BottomActionBar,
  Card,
  ConfirmDialog,
  ContextHeader,
  PrimaryButton,
  RequiredSelectionBar,
  ScreenContainer,
  ScreenTitleBar,
  SecondaryButton,
  SelectionIndicator,
  SingleSelectOption,
  StatusBadge,
  StickySectionHeader,
  SummaryMetricsBar,
  TextInput,
} from '../../components/ui';
import { api } from '../../services/api-client';
import { colors, spacing, typography } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';

type MotivoRetiro =
  | 'DESCANSA_RENOVACION'
  | 'DOCUMENTACION_INCOMPLETA'
  | 'DECIDIO_NO_CONTINUAR'
  | 'OTRO';

export interface IntegranteConfirmacion {
  id: string;
  nombre: string;
  montoSolicitado: number | null;
  estado: string;
  motivo_retiro?: MotivoRetiro | null;
  motivo_retiro_detalle?: string | null;
  es_tesorera?: boolean;
  overallStatus: 'Completa' | 'Pendiente' | 'Retirada';
  pasoActual: number;
}

interface ConfirmarIntegrantesScreenProps {
  expedienteId: string;
  grupoNombre?: string;
  integrantes: IntegranteConfirmacion[];
  onBack: () => void;
  onRefresh: () => Promise<void>;
  onContinueCapture: (integrante: IntegranteConfirmacion) => void;
  onSent: (expediente: unknown) => void;
}

interface ConfirmacionSection {
  key: 'participan' | 'pendientes' | 'retiradas';
  title: string;
  amountLabel: string;
  data: IntegranteConfirmacion[];
}

const motivoLabels: Record<MotivoRetiro, string> = {
  DESCANSA_RENOVACION: 'Descansa esta renovación',
  DOCUMENTACION_INCOMPLETA: 'No entregó documentación completa',
  DECIDIO_NO_CONTINUAR: 'Decidió no continuar',
  OTRO: 'Otro',
};

const motivoOptions = Object.entries(motivoLabels) as [MotivoRetiro, string][];

const sumarMontos = (integrantes: IntegranteConfirmacion[]): number => integrantes.reduce(
  (total, integrante) => total + (integrante.montoSolicitado ?? 0),
  0,
);

export const ConfirmarIntegrantesScreen: React.FC<ConfirmarIntegrantesScreenProps> = ({
  expedienteId,
  grupoNombre,
  integrantes,
  onBack,
  onRefresh,
  onContinueCapture,
  onSent,
}) => {
  const [reasonTarget, setReasonTarget] = useState<IntegranteConfirmacion | null>(null);
  const [selectedReason, setSelectedReason] = useState<MotivoRetiro | null>(null);
  const [otherReason, setOtherReason] = useState('');
  const [otherReasonError, setOtherReasonError] = useState<string | undefined>();
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);
  const [sendBusy, setSendBusy] = useState(false);
  const [tesoreraSheetVisible, setTesoreraSheetVisible] = useState(false);
  const [tesoreraCandidataId, setTesoreraCandidataId] = useState<string | null>(null);
  const [tesoreraBusy, setTesoreraBusy] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const participantes = useMemo(
    () => integrantes.filter((integrante) => integrante.estado !== 'RETIRADA' && integrante.overallStatus === 'Completa'),
    [integrantes],
  );
  const pendientes = useMemo(
    () => integrantes.filter((integrante) => integrante.estado !== 'RETIRADA' && integrante.overallStatus !== 'Completa'),
    [integrantes],
  );
  const retiradas = useMemo(
    () => integrantes.filter((integrante) => integrante.estado === 'RETIRADA'),
    [integrantes],
  );

  const sections = useMemo<ConfirmacionSection[]>(() => {
    const result: ConfirmacionSection[] = [{
      key: 'participan',
      title: 'Participarán en esta renovación',
      amountLabel: 'Monto a verificar',
      data: participantes,
    }];
    if (pendientes.length > 0) {
      result.push({
        key: 'pendientes',
        title: 'Pendientes de decidir',
        amountLabel: 'Monto pendiente',
        data: pendientes,
      });
    }
    if (retiradas.length > 0) {
      result.push({
        key: 'retiradas',
        title: 'No participarán',
        amountLabel: 'Monto excluido',
        data: retiradas,
      });
    }
    return result;
  }, [participantes, pendientes, retiradas]);

  const montoParticipantes = sumarMontos(participantes);
  const tesorera = participantes.find((integrante) => integrante.es_tesorera === true) ?? null;
  const puedeEnviar = participantes.length > 0
    && pendientes.length === 0
    && tesorera !== null
    && !sendBusy
    && !tesoreraBusy;
  const helperText = pendientes.length > 0
    ? `Resuelve ${pendientes.length} ${pendientes.length === 1 ? 'integrante pendiente' : 'integrantes pendientes'} para enviar.`
    : participantes.length === 0
      ? 'Selecciona al menos una integrante completa para enviar.'
      : !tesorera
        ? 'Selecciona quién será la tesorera antes de enviar.'
        : undefined;

  const closeReasonSheet = () => {
    if (busyMemberId) return;
    resetReasonSheet();
  };

  const resetReasonSheet = () => {
    setReasonTarget(null);
    setSelectedReason(null);
    setOtherReason('');
    setOtherReasonError(undefined);
  };

  const openReasonSheet = (integrante: IntegranteConfirmacion) => {
    setErrorMessage(null);
    setReasonTarget(integrante);
    setSelectedReason(integrante.motivo_retiro ?? null);
    setOtherReason(integrante.motivo_retiro === 'OTRO' ? integrante.motivo_retiro_detalle ?? '' : '');
    setOtherReasonError(undefined);
  };

  const saveReason = async (reason: MotivoRetiro) => {
    if (!reasonTarget || busyMemberId) return;
    const detail = reason === 'OTRO' ? otherReason.trim() : undefined;
    if (reason === 'OTRO' && !detail) {
      setOtherReasonError('Escribe por qué no participará.');
      return;
    }

    setBusyMemberId(reasonTarget.id);
    setErrorMessage(null);
    try {
      await api.patch(`/integrantes/${reasonTarget.id}/retirar`, {
        motivo_retiro: reason,
        ...(detail ? { motivo_retiro_detalle: detail } : {}),
      });
      resetReasonSheet();
      await onRefresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo guardar la decisión.');
    } finally {
      setBusyMemberId(null);
    }
  };

  const reintegrate = async (integrante: IntegranteConfirmacion) => {
    if (busyMemberId) return;
    setBusyMemberId(integrante.id);
    setErrorMessage(null);
    try {
      await api.patch(`/integrantes/${integrante.id}/reintegrar`);
      await onRefresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo reintegrar a la integrante.');
    } finally {
      setBusyMemberId(null);
    }
  };

  const openTesoreraSheet = () => {
    if (participantes.length === 0 || busyMemberId || tesoreraBusy) return;
    setErrorMessage(null);
    setTesoreraCandidataId(tesorera?.id ?? null);
    setTesoreraSheetVisible(true);
  };

  const closeTesoreraSheet = () => {
    if (tesoreraBusy) return;
    setTesoreraSheetVisible(false);
    setTesoreraCandidataId(null);
  };

  const saveTesorera = async () => {
    if (!tesoreraCandidataId || tesoreraBusy) return;
    setTesoreraBusy(true);
    setErrorMessage(null);
    try {
      await api.patch(`/expedientes/${expedienteId}/tesorera`, {
        integrante_id: tesoreraCandidataId,
      });
      setTesoreraSheetVisible(false);
      setTesoreraCandidataId(null);
      await onRefresh();
    } catch (error) {
      setTesoreraSheetVisible(false);
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo guardar la tesorera.');
    } finally {
      setTesoreraBusy(false);
    }
  };

  const sendToVerification = async () => {
    if (!puedeEnviar) return;
    setSendBusy(true);
    setErrorMessage(null);
    try {
      const expediente = await api.patch(`/expedientes/${expedienteId}/send-to-verification`);
      setConfirmVisible(false);
      onSent(expediente);
    } catch (error) {
      setConfirmVisible(false);
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo enviar a Verificación.');
    } finally {
      setSendBusy(false);
    }
  };

  const renderParticipant = (integrante: IntegranteConfirmacion) => (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: true, disabled: busyMemberId === integrante.id }}
      accessibilityLabel={`${integrante.nombre}, participa. Toca para marcar que no participará.`}
      disabled={busyMemberId !== null}
      onPress={() => openReasonSheet(integrante)}
    >
      <Card style={styles.memberCard}>
        <SelectionIndicator state="selected" />
        <View style={styles.memberContent}>
          <Text allowFontScaling={false} numberOfLines={2} style={styles.memberName}>{integrante.nombre}</Text>
          <View style={styles.memberBadges}>
            <StatusBadge label="COMPLETA" tone="success" />
            {integrante.es_tesorera ? (
              <StatusBadge label="TESORERA" leadingMark="T" tone="pending" />
            ) : null}
          </View>
        </View>
        <Text allowFontScaling={false} style={styles.amount}>{formatCurrency(integrante.montoSolicitado ?? 0)}</Text>
      </Card>
    </Pressable>
  );

  const renderPending = (integrante: IntegranteConfirmacion) => (
    <Card style={styles.memberCardStacked}>
      <View style={styles.memberRow}>
        <SelectionIndicator state="pending" />
        <View style={styles.memberContent}>
          <Text allowFontScaling={false} numberOfLines={2} style={styles.memberName}>{integrante.nombre}</Text>
          <StatusBadge label="PENDIENTE" tone="pending" />
        </View>
        <Text allowFontScaling={false} style={styles.amount}>{formatCurrency(integrante.montoSolicitado ?? 0)}</Text>
      </View>
      <View style={styles.memberActions}>
        <SecondaryButton
          title="Completar captura"
          onPress={() => onContinueCapture(integrante)}
          disabled={busyMemberId !== null}
          style={styles.inlineButton}
        />
        <SecondaryButton
          title="No participará"
          onPress={() => openReasonSheet(integrante)}
          disabled={busyMemberId !== null}
          style={styles.inlineButton}
        />
      </View>
    </Card>
  );

  const renderWithdrawn = (integrante: IntegranteConfirmacion) => {
    const reason = integrante.motivo_retiro
      ? motivoLabels[integrante.motivo_retiro]
      : 'Motivo no disponible';
    const description = integrante.motivo_retiro === 'OTRO' && integrante.motivo_retiro_detalle
      ? integrante.motivo_retiro_detalle
      : reason;

    return (
      <Card style={styles.memberCardStacked}>
        <View style={styles.memberRow}>
          <SelectionIndicator state="excluded" />
          <View style={styles.memberContent}>
            <Text allowFontScaling={false} numberOfLines={2} style={styles.memberName}>{integrante.nombre}</Text>
            <StatusBadge label="NO PARTICIPA" tone="error" />
            <Text allowFontScaling={false} style={styles.reasonText}>{description}</Text>
          </View>
          <Text allowFontScaling={false} style={styles.amount}>{formatCurrency(integrante.montoSolicitado ?? 0)}</Text>
        </View>
        <View style={styles.memberActions}>
          <SecondaryButton
            title={busyMemberId === integrante.id ? 'Incluyendo…' : 'Incluir'}
            onPress={() => reintegrate(integrante)}
            disabled={busyMemberId !== null}
            style={styles.inlineButton}
          />
          <SecondaryButton
            title="Cambiar motivo"
            onPress={() => openReasonSheet(integrante)}
            disabled={busyMemberId !== null}
            style={styles.inlineButton}
          />
        </View>
      </Card>
    );
  };

  const renderItem = (integrante: IntegranteConfirmacion, section: ConfirmacionSection) => {
    if (section.key === 'participan') return renderParticipant(integrante);
    if (section.key === 'pendientes') return renderPending(integrante);
    return renderWithdrawn(integrante);
  };

  return (
    <ScreenContainer>
      <AppHeader showBackButton onBackPress={onBack} moduleTheme="documentation" />
      <ScreenTitleBar title="Confirmar integrantes" moduleTheme="documentation" />
      <ContextHeader
        title={grupoNombre || 'Grupo'}
        moduleTheme="documentation"
        tone="brandAccent"
      />
      <SummaryMetricsBar
        primaryLabel={participantes.length === 1 ? 'Participante' : 'Participantes'}
        primaryValue={String(participantes.length)}
        secondaryLabel="Monto a verificar"
        secondaryValue={formatCurrency(montoParticipantes)}
        moduleTheme="documentation"
      />
      <RequiredSelectionBar
        label="Tesorera del grupo"
        mark="T"
        value={tesorera?.nombre}
        actionLabel={tesorera ? 'Cambiar' : 'Seleccionar'}
        moduleTheme="documentation"
        disabled={participantes.length === 0 || busyMemberId !== null || sendBusy || tesoreraBusy}
        onPress={openTesoreraSheet}
      />

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={errorMessage ? (
          <View style={styles.listHeader}>
            <View accessibilityRole="alert" style={styles.errorBanner}>
              <Text allowFontScaling={false} style={styles.errorText}>{errorMessage}</Text>
            </View>
          </View>
        ) : null}
        renderSectionHeader={({ section }) => (
          <StickySectionHeader
            title={section.title}
            moduleTheme="documentation"
            variant="solid"
            textTone={section.key === 'retiradas' ? 'withdrawn' : 'default'}
          />
        )}
        renderItem={({ item, section }) => (
          <View style={styles.sectionItem}>
            {renderItem(item, section)}
          </View>
        )}
        renderSectionFooter={({ section }) => (
          <View style={styles.sectionTotal}>
            <Text allowFontScaling={false} style={styles.totalCount}>
              {section.data.length} {section.data.length === 1 ? 'integrante' : 'integrantes'}
            </Text>
            <Text
              allowFontScaling={false}
              style={[styles.totalAmount, section.key === 'participan' && styles.totalAmountActive]}
            >
              {section.amountLabel}: {formatCurrency(sumarMontos(section.data))}
            </Text>
          </View>
        )}
      />

      <BottomActionBar
        secondaryLabel="Volver"
        primaryLabel={sendBusy ? 'Enviando…' : 'Enviar a Verificación'}
        onSecondary={onBack}
        onPrimary={() => setConfirmVisible(true)}
        primaryDisabled={!puedeEnviar || busyMemberId !== null}
        secondaryDisabled={sendBusy || busyMemberId !== null || tesoreraBusy}
        helperText={helperText}
      />

      <BottomSheetSelector
        visible={reasonTarget !== null}
        title="¿Por qué no participará?"
        message={reasonTarget?.nombre}
        onClose={closeReasonSheet}
      >
        {motivoOptions.map(([value, label]) => (
          <SecondaryButton
            key={value}
            title={label}
            onPress={() => {
              setSelectedReason(value);
              setOtherReasonError(undefined);
              return value !== 'OTRO' ? saveReason(value) : undefined;
            }}
            disabled={busyMemberId !== null}
            style={styles.reasonButton}
          />
        ))}
        {selectedReason === 'OTRO' ? (
          <View style={styles.otherReasonBlock}>
            <TextInput
              label="Motivo"
              value={otherReason}
              onChangeText={(value) => {
                setOtherReason(value);
                if (value.trim()) setOtherReasonError(undefined);
              }}
              error={otherReasonError}
              required
              maxLength={250}
              multiline
              numberOfLines={3}
              placeholder="Escribe el motivo"
            />
            <PrimaryButton
              title={busyMemberId ? 'Guardando…' : 'Guardar motivo'}
              onPress={() => saveReason('OTRO')}
              disabled={busyMemberId !== null}
              style={styles.reasonButton}
            />
          </View>
        ) : null}
      </BottomSheetSelector>

      <BottomSheetSelector
        visible={tesoreraSheetVisible}
        title="Seleccionar tesorera"
        message="Elige una participante. Verificación le hará preguntas adicionales."
        onClose={closeTesoreraSheet}
      >
        {participantes.map((integrante) => (
          <SingleSelectOption
            key={integrante.id}
            label={integrante.nombre}
            description={`Monto solicitado: ${formatCurrency(integrante.montoSolicitado ?? 0)}`}
            selected={tesoreraCandidataId === integrante.id}
            disabled={tesoreraBusy}
            onPress={() => setTesoreraCandidataId(integrante.id)}
          />
        ))}
        <View style={styles.tesoreraActions}>
          <SecondaryButton
            title="Cancelar"
            onPress={closeTesoreraSheet}
            disabled={tesoreraBusy}
          />
          <PrimaryButton
            title={tesoreraBusy ? 'Guardando…' : 'Confirmar selección'}
            onPress={saveTesorera}
            disabled={!tesoreraCandidataId || tesoreraBusy}
          />
        </View>
      </BottomSheetSelector>

      <ConfirmDialog
        visible={confirmVisible}
        title="Enviar a Verificación"
        details={[
          {
            label: 'Participantes',
            value: `${participantes.length} ${participantes.length === 1 ? 'integrante' : 'integrantes'}`,
          },
          { label: 'Monto a verificar', value: formatCurrency(montoParticipantes) },
          { label: 'Tesorera', value: tesorera?.nombre ?? 'Sin seleccionar' },
          {
            label: 'No participarán',
            value: `${retiradas.length} ${retiradas.length === 1 ? 'integrante' : 'integrantes'}`,
          },
        ]}
        confirmLabel="Enviar"
        busy={sendBusy}
        onCancel={() => { if (!sendBusy) setConfirmVisible(false); }}
        onConfirm={sendToVerification}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: spacing.xl,
  },
  listHeader: {
    paddingHorizontal: spacing.lg,
  },
  sectionItem: {
    paddingHorizontal: spacing.lg,
  },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  memberCardStacked: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  memberContent: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
  },
  memberBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  memberName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  amount: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flexShrink: 0,
  },
  reasonText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  memberActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  inlineButton: {
    minHeight: 44,
    paddingVertical: spacing.sm,
  },
  sectionTotal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    marginHorizontal: spacing.lg,
  },
  totalCount: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
  totalAmount: {
    ...typography.sectionTitle,
    color: colors.textSecondary,
  },
  totalAmountActive: {
    color: colors.primary,
  },
  reasonButton: {
    flex: 0,
  },
  otherReasonBlock: {
    marginTop: spacing.sm,
  },
  tesoreraActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
