import React, { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Card,
  PickerField,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
  SemanticChoiceGroup,
  getEvidenceClassificationFrameStyle,
} from '../../components/ui';
import {
  colors,
  layout,
  radius,
  spacing,
  typography,
} from '../../theme/tokens';
import type { ClasificacionSemaforoEvidencia } from './verificacion-entrevista.api';
import type { MotivoClasificacionEvidencia } from '../parametros/parametros-evidencia-motivos.api';
import {
  OPCIONES_SEMAFORO_EVIDENCIA,
  obtenerPresentacionClasificacionEvidencia,
} from './verificacion-evidencia-semaforo.model';

interface EvidenceTrafficLightPanelProps {
  imageUri: string;
  motivos: MotivoClasificacionEvidencia[];
  motivosError?: string | null;
  onConfirm: (
    clasificacion: ClasificacionSemaforoEvidencia,
    motivoClasificacionId: string,
  ) => void;
  onCancel: () => void;
}

export const EvidenceTrafficLightPanel: React.FC<EvidenceTrafficLightPanelProps> = ({
  imageUri,
  motivos,
  motivosError,
  onConfirm,
  onCancel,
}) => {
  const [clasificacion, setClasificacion] = useState<ClasificacionSemaforoEvidencia | null>(null);
  const [motivoClasificacionId, setMotivoClasificacionId] = useState<string | null>(null);
  const presentacion = obtenerPresentacionClasificacionEvidencia(clasificacion);
  const motivosDisponibles = clasificacion
    ? motivos.filter((motivo) => motivo.activo && motivo.clasificacion === clasificacion)
    : [];
  const motivoSeleccionado = motivosDisponibles.find(
    (motivo) => motivo.id === motivoClasificacionId,
  );

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <Pressable accessible={false} style={styles.backdrop} onPress={onCancel}>
        <Pressable accessible={false} style={styles.sheet} onPress={() => undefined}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
          >
            <Card moduleTheme="verification" variant="outlined" style={styles.card}>
              <SectionTitle title="Clasifica esta evidencia" />
              <Text allowFontScaling={false} style={styles.helperText}>
                Elige el color que usará esta fotografía. Después seleccionarás a qué integrantes
                corresponde.
              </Text>

              <View
                accessible
                accessibilityLabel={presentacion
                  ? `Vista previa con clasificación ${presentacion.label}`
                  : 'Vista previa pendiente de clasificar'}
                style={[
                  styles.preview,
                  getEvidenceClassificationFrameStyle(presentacion?.color),
                ]}
              >
                <Image source={{ uri: imageUri }} resizeMode="contain" style={styles.image} />
              </View>

              <SemanticChoiceGroup
                value={clasificacion}
                options={OPCIONES_SEMAFORO_EVIDENCIA}
                onSelect={(value) => {
                  setClasificacion(value as ClasificacionSemaforoEvidencia);
                  setMotivoClasificacionId(null);
                }}
              />
              <Text allowFontScaling={false} style={styles.selectionText}>
                {presentacion
                  ? `Marco seleccionado: ${presentacion.label}`
                  : 'Selecciona un color para continuar.'}
              </Text>

              {clasificacion ? (
                motivosDisponibles.length > 0 ? (
                  <PickerField
                    key={`motivo-${clasificacion}`}
                    label={`Motivo ${presentacion?.label.toLocaleLowerCase('es-MX')}`}
                    value={motivoSeleccionado?.concepto ?? ''}
                    options={motivosDisponibles.map((motivo) => motivo.concepto)}
                    onSelect={(concepto) => {
                      const motivo = motivosDisponibles.find((item) => item.concepto === concepto);
                      setMotivoClasificacionId(motivo?.id ?? null);
                    }}
                    placeholder="Seleccionar motivo"
                    moduleTheme="verification"
                    autoOpen
                    confirmSelection
                    required
                    helperText="Elige un solo motivo para explicar la clasificación."
                  />
                ) : (
                  <Text allowFontScaling={false} style={styles.errorText}>
                    {motivosError
                      ?? 'Administración todavía no ha registrado motivos activos para este color.'}
                  </Text>
                )
              ) : null}

              <View style={styles.actions}>
                <SecondaryButton
                  title="Cancelar y repetir"
                  moduleTheme="verification"
                  onPress={onCancel}
                />
                <PrimaryButton
                  title="Continuar con integrantes"
                  moduleTheme="verification"
                  disabled={!clasificacion || !motivoClasificacionId}
                  onPress={() => {
                    if (clasificacion && motivoClasificacionId) {
                      onConfirm(clasificacion, motivoClasificacionId);
                    }
                  }}
                />
              </View>
            </Card>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.overlay,
  },
  sheet: {
    maxHeight: '92%',
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    flexGrow: 1,
  },
  card: {
    gap: spacing.md,
    borderWidth: 0,
  },
  helperText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  preview: {
    width: '100%',
    maxHeight: layout.documentPreviewHeight,
    aspectRatio: 4 / 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  selectionText: {
    ...typography.captionStrong,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.sm,
  },
});
