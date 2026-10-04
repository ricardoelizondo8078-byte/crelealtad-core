import FontAwesome from '@expo/vector-icons/FontAwesome';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Card,
  PickerField,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
  SelectorField,
  StatusBadge,
  StickySectionHeader,
  TextInput,
} from '../../components/ui';
import {
  colors,
  iconSizes,
  moduleThemes,
  radius,
  spacing,
  typography,
} from '../../theme/tokens';
import {
  MOTIVOS_RECOMENDACION_NO,
  MOTIVOS_RECOMENDACION_SI,
  MOTIVOS_SIN_CONTROL_PAGOS,
} from './verificacion-entrevista.catalog';

type EvidenciaEntrevistaGuardando = 'CONTROL_PAGOS' | 'FOLLETO_PREMIO_TESORERA' | null;

interface EntrevistaEncuestasSectionProps {
  mostrarControlTesorera: boolean;
  mostrarEncuestaServicio: boolean;
  tieneControlPagos: string;
  motivoSinControl: string;
  asesoraAcudioSemanalmente: string;
  firmabanControlSemanalmente: string;
  tratoAsesoraTesorera: string;
  conocePremioTesorera: string;
  opinionCredito: string;
  tratoDesembolso: string;
  rapidezDesembolso: string;
  informacionCreditoClara: string;
  recomendaria: string;
  razonRecomendacion: string;
  motivoRecomendacion: string;
  guardandoEvidencia: EvidenciaEntrevistaGuardando;
  fotoControlPagos: string | null;
  fotoControlPagosPendiente: string | null;
  fotoFolleto: string | null;
  fotoFolletoPendiente: string | null;
  headersEvidencia?: Record<string, string>;
  onTieneControlPagosChange: (value: string) => void;
  onMotivoSinControlChange: (value: string) => void;
  onAsesoraAcudioSemanalmenteChange: (value: string) => void;
  onFirmabanControlSemanalmenteChange: (value: string) => void;
  onTratoAsesoraTesoreraChange: (value: string) => void;
  onConocePremioTesoreraChange: (value: string) => void;
  onOpinionCreditoChange: (value: string) => void;
  onTratoDesembolsoChange: (value: string) => void;
  onRapidezDesembolsoChange: (value: string) => void;
  onInformacionCreditoClaraChange: (value: string) => void;
  onRecomendariaChange: (value: string) => void;
  onRazonRecomendacionChange: (value: string) => void;
  onMotivoRecomendacionChange: (value: string) => void;
  onAbrirControlPagos: () => void;
  onCapturarControlPagos: () => void;
  onReintentarControlPagos: () => void;
  onAbrirFolleto: () => void;
  onCapturarFolleto: () => void;
  onReintentarFolleto: () => void;
}

export const EntrevistaEncuestasSection: React.FC<EntrevistaEncuestasSectionProps> = ({
  mostrarControlTesorera,
  mostrarEncuestaServicio,
  tieneControlPagos,
  motivoSinControl,
  asesoraAcudioSemanalmente,
  firmabanControlSemanalmente,
  tratoAsesoraTesorera,
  conocePremioTesorera,
  opinionCredito,
  tratoDesembolso,
  rapidezDesembolso,
  informacionCreditoClara,
  recomendaria,
  razonRecomendacion,
  motivoRecomendacion,
  guardandoEvidencia,
  fotoControlPagos,
  fotoControlPagosPendiente,
  fotoFolleto,
  fotoFolletoPendiente,
  headersEvidencia,
  onTieneControlPagosChange,
  onMotivoSinControlChange,
  onAsesoraAcudioSemanalmenteChange,
  onFirmabanControlSemanalmenteChange,
  onTratoAsesoraTesoreraChange,
  onConocePremioTesoreraChange,
  onOpinionCreditoChange,
  onTratoDesembolsoChange,
  onRapidezDesembolsoChange,
  onInformacionCreditoClaraChange,
  onRecomendariaChange,
  onRazonRecomendacionChange,
  onMotivoRecomendacionChange,
  onAbrirControlPagos,
  onCapturarControlPagos,
  onReintentarControlPagos,
  onAbrirFolleto,
  onCapturarFolleto,
  onReintentarFolleto,
}) => (
  <>
    {mostrarControlTesorera ? (
      <>
        <View style={styles.sectionHeader}>
          <StickySectionHeader title="CONTROL DE PAGOS" moduleTheme="verification" />
        </View>

        <View style={styles.contextHeader}>
          <StatusBadge label="TESORERA · CON HISTORIAL" leadingMark="T" tone="pending" />
          <Text allowFontScaling={false} style={styles.contextTitle}>
            Aplica porque la tesorera ya tuvo un crédito confirmado con CRELEALTAD.
          </Text>
        </View>

        <SectionTitle title="Control de pagos del ciclo anterior" />

        <SelectorField
          label="¿Tienen su control de pagos?"
          value={tieneControlPagos}
          options={['Sí', 'No']}
          onSelect={(respuesta) => {
            onTieneControlPagosChange(respuesta);
            if (respuesta === 'Sí') onMotivoSinControlChange('');
          }}
          moduleTheme="verification"
          required
        />

        {tieneControlPagos === 'Sí' ? (
          <EvidenceCard
            title="Control de pagos"
            savedUri={fotoControlPagos}
            pendingUri={fotoControlPagosPendiente}
            headers={headersEvidencia}
            saving={guardandoEvidencia === 'CONTROL_PAGOS'}
            openAccessibilityLabel="Abrir fotografía del control de pagos"
            imageAccessibilityLabel="Vista previa del control de pagos"
            captureTitle="Tomar fotografía"
            recaptureTitle="Volver a tomar fotografía"
            captureAccessibilityLabel="Tomar fotografía geolocalizada del control de pagos"
            onOpen={onAbrirControlPagos}
            onCapture={onCapturarControlPagos}
            onRetry={onReintentarControlPagos}
          />
        ) : null}

        {tieneControlPagos === 'No' ? (
          <>
            <PickerField
              label="¿Qué pasó con el control de pagos?"
              value={motivoSinControl}
              options={MOTIVOS_SIN_CONTROL_PAGOS}
              onSelect={onMotivoSinControlChange}
              placeholder="Seleccionar motivo"
              moduleTheme="verification"
              autoOpen
              confirmSelection
              required
            />
            <View style={styles.warningBox}>
              <Text allowFontScaling={false} style={styles.warningIcon}>!</Text>
              <Text allowFontScaling={false} style={styles.warningText}>
                Explícale que el control de pagos es un documento clave, debe firmarse semanalmente
                por la asesora y la tesorera, y será requerido en el próximo desembolso.
              </Text>
            </View>
          </>
        ) : null}

        <View style={styles.sectionHeader}>
          <StickySectionHeader title="EVALUACIÓN DEL SERVICIO DE LA ASESORA" moduleTheme="verification" />
        </View>

        <SelectorField
          label="¿La asesora acudió cada semana por el pago?"
          value={asesoraAcudioSemanalmente}
          options={['Siempre', 'A veces', 'Nunca']}
          onSelect={onAsesoraAcudioSemanalmenteChange}
          moduleTheme="verification"
          required
        />
        <SelectorField
          label="¿Firmaban su control semanalmente?"
          value={firmabanControlSemanalmente}
          options={['Siempre', 'A veces', 'Nunca']}
          onSelect={onFirmabanControlSemanalmenteChange}
          moduleTheme="verification"
          required
        />
        <SelectorField
          label="¿Cómo fue el trato de la asesora con ustedes?"
          value={tratoAsesoraTesorera}
          options={['Excelente', 'Bueno', 'Regular', 'Malo']}
          onSelect={onTratoAsesoraTesoreraChange}
          moduleTheme="verification"
          required
        />
        <SelectorField
          label="¿Conoce nuestro premio para tesoreras?"
          value={conocePremioTesorera}
          options={['Sí', 'No']}
          onSelect={onConocePremioTesoreraChange}
          moduleTheme="verification"
          required
        />

        {conocePremioTesorera === 'No' ? (
          <>
            <View style={styles.warningBox}>
              <Text allowFontScaling={false} style={styles.contextTitle}>
                &quot;Entregar folleto de premio a tesorera&quot;
              </Text>
            </View>
            <EvidenceCard
              title="Evidencia de entrega del folleto"
              instruction="Toma la fotografía en el momento. No se permite seleccionar desde el carrete."
              savedUri={fotoFolleto}
              pendingUri={fotoFolletoPendiente}
              headers={headersEvidencia}
              saving={guardandoEvidencia === 'FOLLETO_PREMIO_TESORERA'}
              openAccessibilityLabel="Abrir evidencia de entrega del folleto"
              imageAccessibilityLabel="Vista previa de la evidencia del folleto"
              captureTitle="Tomar evidencia"
              recaptureTitle="Volver a tomar evidencia"
              captureAccessibilityLabel="Tomar evidencia de la entrega del folleto con la cámara"
              onOpen={onAbrirFolleto}
              onCapture={onCapturarFolleto}
              onRetry={onReintentarFolleto}
            />
          </>
        ) : null}
      </>
    ) : null}

    {mostrarEncuestaServicio ? (
      <>
        <View style={styles.sectionHeader}>
          <StickySectionHeader title="ENCUESTA DE SERVICIO" moduleTheme="verification" />
        </View>
        <View style={styles.contextHeader}>
          <StatusBadge label="INTEGRANTE CON HISTORIAL" tone="pending" />
          <Text allowFontScaling={false} style={styles.contextTitle}>
            Aplica porque la integrante ya tuvo un crédito confirmado con CRELEALTAD.
          </Text>
        </View>
        <SelectorField
          label="¿Cómo le ha parecido su crédito con CRELEALTAD?"
          value={opinionCredito}
          options={['Excelente', 'Bueno', 'Regular', 'Malo']}
          onSelect={onOpinionCreditoChange}
          moduleTheme="verification"
          required
        />
        <SelectorField
          label="¿Cómo fue el trato que recibió durante el desembolso?"
          value={tratoDesembolso}
          options={['Excelente', 'Bueno', 'Regular', 'Malo']}
          onSelect={onTratoDesembolsoChange}
          moduleTheme="verification"
          required
        />
        <SelectorField
          label="¿Cómo considera el tiempo que tardamos en entregarle su crédito?"
          value={rapidezDesembolso}
          options={['Muy rápido', 'Rápido', 'Lento', 'Muy lento']}
          onSelect={onRapidezDesembolsoChange}
          moduleTheme="verification"
          required
        />
        <SelectorField
          label="¿La información sobre su crédito y sus pagos fue clara?"
          value={informacionCreditoClara}
          options={['Sí', 'No']}
          onSelect={onInformacionCreditoClaraChange}
          moduleTheme="verification"
          required
        />
        <SelectorField
          label="¿Nos recomendaría como financiera?"
          value={recomendaria}
          options={['Sí', 'No']}
          onSelect={(respuesta) => {
            onRecomendariaChange(respuesta);
            onRazonRecomendacionChange('');
          }}
          moduleTheme="verification"
          required
        />
        {recomendaria ? (
          <PickerField
            key={`motivo-recomendacion-${recomendaria}`}
            label={recomendaria === 'Sí'
              ? '¿Por qué sí nos recomendaría?'
              : '¿Por qué no nos recomendaría?'}
            value={razonRecomendacion}
            options={recomendaria === 'Sí'
              ? MOTIVOS_RECOMENDACION_SI
              : MOTIVOS_RECOMENDACION_NO}
            onSelect={onRazonRecomendacionChange}
            placeholder="Seleccionar motivo"
            moduleTheme="verification"
            autoOpen
            confirmSelection
            required
          />
        ) : null}
        <TextInput
          label="¿En qué cree usted que podemos mejorar?"
          value={motivoRecomendacion}
          onChangeText={onMotivoRecomendacionChange}
          placeholder="Escribe lo que nos comentó la integrante"
          multiline
          numberOfLines={3}
          moduleTheme="verification"
          highlightWhenFilled
          required
        />
      </>
    ) : null}
  </>
);

interface EvidenceCardProps {
  title: string;
  instruction?: string;
  savedUri: string | null;
  pendingUri: string | null;
  headers?: Record<string, string>;
  saving: boolean;
  openAccessibilityLabel: string;
  imageAccessibilityLabel: string;
  captureTitle: string;
  recaptureTitle: string;
  captureAccessibilityLabel: string;
  onOpen: () => void;
  onCapture: () => void;
  onRetry: () => void;
}

const EvidenceCard: React.FC<EvidenceCardProps> = ({
  title,
  instruction,
  savedUri,
  pendingUri,
  headers,
  saving,
  openAccessibilityLabel,
  imageAccessibilityLabel,
  captureTitle,
  recaptureTitle,
  captureAccessibilityLabel,
  onOpen,
  onCapture,
  onRetry,
}) => (
  <Card style={styles.evidenceCard}>
    <View style={styles.evidenceHeader}>
      <Text allowFontScaling={false} style={styles.evidenceTitle}>{title}</Text>
      <StatusBadge
        label={saving ? 'GUARDANDO' : pendingUri ? 'POR GUARDAR' : savedUri ? 'GUARDADA' : 'PENDIENTE'}
        tone={saving ? 'progress' : pendingUri ? 'pending' : savedUri ? 'success' : 'pending'}
      />
    </View>
    {instruction ? (
      <Text allowFontScaling={false} style={styles.instruction}>{instruction}</Text>
    ) : null}
    {savedUri || pendingUri ? (
      <View style={styles.preview}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={openAccessibilityLabel}
          accessibilityHint="Abre la imagen en pantalla completa con controles de zoom"
          onPress={onOpen}
        >
          <Image
            source={{ uri: pendingUri || savedUri || '', headers: pendingUri ? undefined : headers }}
            style={styles.image}
            accessibilityLabel={imageAccessibilityLabel}
          />
        </Pressable>
        {pendingUri ? (
          <PrimaryButton
            title={saving ? 'Guardando...' : 'Reintentar guardado'}
            moduleTheme="verification"
            disabled={saving}
            onPress={onRetry}
          />
        ) : null}
        <SecondaryButton
          title={recaptureTitle}
          moduleTheme="verification"
          leadingIcon={(
            <FontAwesome
              name="camera"
              size={iconSizes.action}
              color={moduleThemes.verification.primary}
            />
          )}
          onPress={onCapture}
        />
      </View>
    ) : (
      <PrimaryButton
        title={captureTitle}
        moduleTheme="verification"
        leadingIcon={(
          <FontAwesome
            name="camera"
            size={iconSizes.action}
            color={moduleThemes.verification.primaryText}
          />
        )}
        onPress={onCapture}
        accessibilityLabel={captureAccessibilityLabel}
      />
    )}
  </Card>
);

const styles = StyleSheet.create({
  sectionHeader: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.warning,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  contextTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[800],
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.warning,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  warningIcon: {
    fontSize: 24,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[800],
  },
  evidenceCard: {
    gap: spacing.md,
    borderWidth: 2,
    borderColor: moduleThemes.verification.primary,
  },
  evidenceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  evidenceTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    flex: 1,
  },
  instruction: {
    ...typography.body,
    color: colors.textSecondary,
  },
  preview: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: radius.md,
    backgroundColor: colors.gray[100],
  },
});
