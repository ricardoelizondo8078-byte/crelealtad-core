import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Card,
  DocumentImageCarousel,
  PrimaryButton,
  ScreenState,
  SecondaryButton,
  SectionTitle,
  StatusBadge,
  YesNoField,
} from '../../components/ui';
import type {
  DocumentImageCarouselPage,
  YesNoValue,
} from '../../components/ui';
import {
  colors,
  iconSizes,
  moduleThemes,
  radius,
  spacing,
  typography,
} from '../../theme/tokens';
import type {
  EvidenciaVisitaPendiente,
  FachadaVisitaPendiente,
} from './verificacion-visitas-vecino.api';

interface FotoVisitaGuardada {
  id: string;
  uri: string;
  headers?: Record<string, string>;
  fotoCapturadaAt: string;
}

interface VisitaVecinoSectionProps {
  nombreIntegrante: string;
  fachada: FotoVisitaGuardada | null;
  fachadaPendiente: FachadaVisitaPendiente | null;
  loadingFachada: boolean;
  guardandoFachada: boolean;
  errorFachada: string | null;
  inePages: DocumentImageCarouselPage[];
  loadingIne: boolean;
  errorIne: string | null;
  vecinoConoceDomicilio: YesNoValue;
  visitaActualId: string | null;
  errorResumenVisita: boolean;
  guardandoResultado: boolean;
  evidencia: FotoVisitaGuardada | null;
  evidenciaPendiente: EvidenciaVisitaPendiente | null;
  loadingEvidencia: boolean;
  guardandoEvidencia: boolean;
  errorEvidencia: string | null;
  onCaptureFachada: () => void;
  onSaveFachada: (pendiente: FachadaVisitaPendiente) => void;
  onRetryIne: () => void;
  onRespuestaChange: (value: Exclude<YesNoValue, null>) => void;
  onCaptureEvidencia: () => void;
  onSaveEvidencia: (pendiente: EvidenciaVisitaPendiente) => void;
}

export const VisitaVecinoSection: React.FC<VisitaVecinoSectionProps> = ({
  nombreIntegrante,
  fachada,
  fachadaPendiente,
  loadingFachada,
  guardandoFachada,
  errorFachada,
  inePages,
  loadingIne,
  errorIne,
  vecinoConoceDomicilio,
  visitaActualId,
  errorResumenVisita,
  guardandoResultado,
  evidencia,
  evidenciaPendiente,
  loadingEvidencia,
  guardandoEvidencia,
  errorEvidencia,
  onCaptureFachada,
  onSaveFachada,
  onRetryIne,
  onRespuestaChange,
  onCaptureEvidencia,
  onSaveEvidencia,
}) => (
  <View style={styles.content}>
    <Card
      moduleTheme="verification"
      variant="outlined"
      style={styles.card}
    >
      <SectionTitle title="1. Fotografía de la fachada" />
      <View style={styles.warningBox}>
        <View accessible={false} style={styles.photoPurposeIcons}>
          <FontAwesome
            name="camera"
            size={iconSizes.largeAction}
            color={moduleThemes.verification.primary}
          />
          <FontAwesome
            name="home"
            size={iconSizes.largeAction}
            color={moduleThemes.verification.primary}
          />
        </View>
        <Text allowFontScaling={false} style={styles.warningText}>
          Toma una foto de la fachada. Usa la cámara; no el carrete.
        </Text>
      </View>

      {loadingFachada ? (
        <ActivityIndicator size="large" color={moduleThemes.verification.primary} />
      ) : fachadaPendiente ? (
        <View style={styles.preview}>
          <Image
            source={{ uri: fachadaPendiente.uri }}
            style={styles.image}
            accessibilityLabel="Fotografía pendiente de guardar de la fachada"
          />
          <StatusBadge
            label={guardandoFachada ? 'GUARDANDO' : 'PENDIENTE DE GUARDAR'}
            tone="pending"
          />
          {errorFachada ? (
            <Text allowFontScaling={false} style={styles.warningText}>
              {errorFachada}
            </Text>
          ) : null}
          <View style={styles.actions}>
            <SecondaryButton
              title="Tomar otra"
              moduleTheme="verification"
              disabled={guardandoFachada}
              onPress={onCaptureFachada}
            />
            <PrimaryButton
              title="Reintentar guardado"
              moduleTheme="verification"
              disabled={guardandoFachada}
              onPress={() => onSaveFachada(fachadaPendiente)}
            />
          </View>
        </View>
      ) : fachada ? (
        <View style={styles.preview}>
          <Image
            source={{ uri: fachada.uri, headers: fachada.headers }}
            style={styles.image}
            accessibilityLabel="Fotografía guardada de la fachada"
          />
          <StatusBadge label="FACHADA GUARDADA" tone="success" />
          <SecondaryButton
            title="Tomar otra fotografía"
            moduleTheme="verification"
            disabled={guardandoFachada}
            onPress={onCaptureFachada}
          />
        </View>
      ) : (
        <View style={styles.preview}>
          {errorFachada ? (
            <Text allowFontScaling={false} style={styles.warningText}>
              {errorFachada}
            </Text>
          ) : null}
          <PrimaryButton
            title="Abrir cámara"
            moduleTheme="verification"
            disabled={guardandoFachada}
            onPress={onCaptureFachada}
            accessibilityLabel="Abrir cámara para fotografiar la fachada"
          />
        </View>
      )}
    </Card>

    {fachada ? (
      <>
        <Card moduleTheme="verification" variant="accent">
          <Text allowFontScaling={false} style={styles.script}>
            ESTOY INTENTANDO LOCALIZAR A
          </Text>
          <Text allowFontScaling={false} style={styles.name}>
            “{nombreIntegrante.toUpperCase()}”
          </Text>
        </Card>

        {loadingIne ? (
          <ScreenState
            title="Cargando INE"
            message="Estamos preparando el frente y reverso para la visita."
            loading
          />
        ) : errorIne || inePages.length === 0 ? (
          <ScreenState
            title="No se pudo mostrar el INE"
            message={errorIne ?? 'No hay imágenes disponibles para consultar.'}
            actionLabel="Intentar nuevamente"
            onAction={onRetryIne}
          />
        ) : (
          <View style={styles.loadedContent}>
            <Card
              moduleTheme="verification"
              variant="outlined"
              style={styles.card}
            >
              <SectionTitle title="INE de la integrante" />
              <DocumentImageCarousel
                title={`INE DE ${nombreIntegrante}`}
                pages={inePages}
                moduleTheme="verification"
              />
              <YesNoField
                label="¿La conoce? ¿Sabe dónde vive?"
                value={vecinoConoceDomicilio}
                yesLabel="Sí"
                noLabel="No"
                moduleTheme="verification"
                disabled={guardandoResultado}
                helperText={guardandoResultado
                  ? 'Obteniendo ubicación y guardando la respuesta...'
                  : 'Al responder se registrará la ubicación actual del teléfono.'}
                errorText={errorResumenVisita
                  ? 'No se pudo consultar la respuesta guardada. Puedes registrarla nuevamente.'
                  : undefined}
                onChange={onRespuestaChange}
              />
            </Card>

            <Card
              moduleTheme="verification"
              variant="outlined"
              style={styles.card}
            >
              <SectionTitle title="2. Fotografía de evidencia" />
              <View style={styles.warningBox}>
                <View accessible={false} style={styles.photoPurposeIcons}>
                  <FontAwesome
                    name="camera"
                    size={iconSizes.largeAction}
                    color={moduleThemes.verification.primary}
                  />
                  <FontAwesome
                    name="user"
                    size={iconSizes.largeAction}
                    color={moduleThemes.verification.primary}
                  />
                </View>
                <Text allowFontScaling={false} style={styles.warningText}>
                  Toma una foto como evidencia. Usa la cámara; no el carrete.
                </Text>
              </View>

              {!visitaActualId ? (
                <Text allowFontScaling={false} style={styles.helpText}>
                  Primero selecciona Sí o No y espera a que la respuesta quede guardada.
                </Text>
              ) : loadingEvidencia ? (
                <ActivityIndicator size="large" color={moduleThemes.verification.primary} />
              ) : evidenciaPendiente ? (
                <View style={styles.preview}>
                  <Image
                    source={{ uri: evidenciaPendiente.uri }}
                    style={styles.image}
                    accessibilityLabel="Fotografía pendiente de guardar como evidencia de la visita"
                  />
                  <StatusBadge
                    label={guardandoEvidencia ? 'GUARDANDO' : 'PENDIENTE DE GUARDAR'}
                    tone="pending"
                  />
                  {errorEvidencia ? (
                    <Text allowFontScaling={false} style={styles.warningText}>
                      {errorEvidencia}
                    </Text>
                  ) : null}
                  <View style={styles.actions}>
                    <SecondaryButton
                      title="Tomar otra"
                      moduleTheme="verification"
                      disabled={guardandoEvidencia}
                      onPress={onCaptureEvidencia}
                    />
                    <PrimaryButton
                      title="Reintentar guardado"
                      moduleTheme="verification"
                      disabled={guardandoEvidencia}
                      onPress={() => onSaveEvidencia(evidenciaPendiente)}
                    />
                  </View>
                </View>
              ) : evidencia ? (
                <View style={styles.preview}>
                  <Image
                    source={{ uri: evidencia.uri, headers: evidencia.headers }}
                    style={styles.image}
                    accessibilityLabel="Fotografía guardada como evidencia de la visita"
                  />
                  <StatusBadge label="EVIDENCIA GUARDADA" tone="success" />
                  <SecondaryButton
                    title="Tomar otra fotografía"
                    moduleTheme="verification"
                    disabled={guardandoEvidencia}
                    onPress={onCaptureEvidencia}
                  />
                </View>
              ) : (
                <View style={styles.preview}>
                  {errorEvidencia ? (
                    <Text allowFontScaling={false} style={styles.warningText}>
                      {errorEvidencia}
                    </Text>
                  ) : null}
                  <PrimaryButton
                    title="Abrir cámara"
                    moduleTheme="verification"
                    disabled={guardandoEvidencia}
                    onPress={onCaptureEvidencia}
                    accessibilityLabel="Abrir cámara para tomar la evidencia de la visita al vecino"
                  />
                </View>
              )}
            </Card>

            <Card moduleTheme="verification" variant="accent">
              <Text allowFontScaling={false} style={styles.script}>
                TRAIGO CORRESPONDENCIA PARA
              </Text>
              <Text allowFontScaling={false} style={styles.name}>
                “{nombreIntegrante.toUpperCase()}”
              </Text>
              <Text allowFontScaling={false} style={styles.closing}>
                Y NECESITO QUE ME LA FIRME DE RECIBIDO.
              </Text>
            </Card>
          </View>
        )}
      </>
    ) : (
      <Card moduleTheme="verification" variant="outlined">
        <Text allowFontScaling={false} style={styles.helpText}>
          Guarda primero la fotografía de la fachada para continuar con la visita al vecino.
        </Text>
      </Card>
    )}
  </View>
);

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
  card: {
    gap: spacing.md,
  },
  loadedContent: {
    gap: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  script: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  name: {
    ...typography.title,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  closing: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.warning,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  photoPurposeIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[800],
  },
  helpText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  preview: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: radius.md,
    backgroundColor: colors.gray[100],
  },
});
