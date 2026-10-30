import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Card,
  CreditHistorySummary,
  DocumentImageCarousel,
  MonthYearPickerField,
  MultiSelectPickerField,
  PickerField,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
  SelectorField,
  StatusBadge,
  StickySectionHeader,
  TextInput,
} from '../../components/ui';
import type {
  DocumentImageCarouselPage,
  MultiSelectPickerOption,
} from '../../components/ui';
import {
  colors,
  moduleThemes,
  spacing,
  typography,
} from '../../theme/tokens';
import { normalizeCurrencyInput } from '../../utils/currency';
import { formatPhone } from '../../utils/input';
import { EvidenceTrafficLightPanel } from './EvidenceTrafficLightPanel';
import type { MotivoClasificacionEvidencia } from '../parametros/parametros-evidencia-motivos.api';
import {
  ANIOS_CREDITO_GRUPAL,
  CICLOS_CREDITO_GRUPAL,
  FINANCIERAS_CREDITO_GRUPAL_NUEVO_LEON,
  MESES_CREDITO_GRUPAL,
  MOTIVOS_NO_RENOVACION,
  SEMANAS_CREDITO_GRUPAL,
  TASAS_CREDITO_GRUPAL,
} from './verificacion-entrevista.catalog';
import { useOpcionesEntrevista } from './verificacion-entrevista-parametros';
import { CREDIT_HISTORY_VISUAL_PREVIEW } from './verificacion-individual.model';
import type {
  ClasificacionSemaforoEvidencia,
} from './verificacion-entrevista.api';
import type {
  IntegranteData,
  TipoEvidenciaHistorialCredito,
} from './verificacion-individual.types';

interface EntrevistaHistorialCrediticioSectionProps {
  financierasCreditoGrupalOptions?: readonly string[];
  historialInterno?: IntegranteData['historialCrediticioInterno'];
  tieneOtroCreditoGrupal: string;
  financieraCreditoGrupal: string;
  creditoGrupalAnteriorActivo: string;
  valorFichaCreditoGrupal: string;
  montoUltimoPrestamoCreditoGrupal: string;
  semanaActualCreditoGrupal: string;
  mesDesembolsoCreditoGrupal: string;
  mesUltimoPagoCreditoGrupal: string;
  anioUltimoPagoCreditoGrupal: string;
  semanasDesdeUltimoPagoCreditoGrupal: number | null;
  numeroCiclosCreditoGrupal: string;
  tasaCreditoGrupal: string;
  nombreAsesoraCreditoGrupal: string;
  telefonoAsesoraCreditoGrupal: string;
  motivoNoRenovacionCreditoGrupal: string;
  tipoEvidenciaActual: TipoEvidenciaHistorialCredito | null;
  tipoEvidenciaGuardando: TipoEvidenciaHistorialCredito | null;
  loadingEvidencias: boolean;
  loadingComprobante: boolean;
  evidenciasPendientes: number;
  fotografiasGuardadas: number;
  paginasEvidencias: DocumentImageCarouselPage[];
  opcionesIntegrantesEvidencia: MultiSelectPickerOption[];
  motivosClasificacionEvidencia: MotivoClasificacionEvidencia[];
  errorMotivosClasificacionEvidencia: string | null;
  integrantesEvidenciaSeleccionadas: string[];
  evidenciaPendienteClasificacion: { key: string; uri: string } | null;
  evidenciaPendienteDeAsignar: boolean;
  errorEvidencias: string | null;
  errorComprobante: string | null;
  onTieneOtroCreditoGrupalChange: (value: string) => void;
  onFinancieraCreditoGrupalChange: (value: string) => void;
  onCreditoGrupalAnteriorActivoChange: (value: string) => void;
  onValorFichaCreditoGrupalChange: (value: string) => void;
  onMontoUltimoPrestamoCreditoGrupalChange: (value: string) => void;
  onSemanaActualCreditoGrupalChange: (value: string) => void;
  onMesDesembolsoCreditoGrupalChange: (value: string) => void;
  onUltimoPagoCreditoGrupalChange: (month: string, year: string) => void;
  onNumeroCiclosCreditoGrupalChange: (value: string) => void;
  onTasaCreditoGrupalChange: (value: string) => void;
  onNombreAsesoraCreditoGrupalChange: (value: string) => void;
  onTelefonoAsesoraCreditoGrupalChange: (value: string) => void;
  onMotivoNoRenovacionCreditoGrupalChange: (value: string) => void;
  onLimpiarCreditoGrupal: () => void;
  onLimpiarRutaCreditoGrupal: () => void;
  onReintentarComprobante: () => void;
  onCapturarEvidencia: (tipo: TipoEvidenciaHistorialCredito) => void;
  onSeleccionarEvidenciaCarrete: (tipo: TipoEvidenciaHistorialCredito) => void;
  onIntegrantesEvidenciaChange: (integranteIds: string[]) => void;
  onGuardarEvidenciaParaIntegrantes: (integranteIds: string[]) => void;
  onClasificarEvidencia: (
    clasificacion: ClasificacionSemaforoEvidencia,
    motivoClasificacionId: string,
  ) => void;
  onDescartarEvidenciaPendiente: () => void;
  onReintentarEvidencias: (tipo: TipoEvidenciaHistorialCredito) => void;
}

export const EntrevistaHistorialCrediticioSection: React.FC<
  EntrevistaHistorialCrediticioSectionProps
> = ({
  financierasCreditoGrupalOptions = FINANCIERAS_CREDITO_GRUPAL_NUEVO_LEON,
  historialInterno,
  tieneOtroCreditoGrupal,
  financieraCreditoGrupal,
  creditoGrupalAnteriorActivo,
  valorFichaCreditoGrupal,
  montoUltimoPrestamoCreditoGrupal,
  semanaActualCreditoGrupal,
  mesDesembolsoCreditoGrupal,
  mesUltimoPagoCreditoGrupal,
  anioUltimoPagoCreditoGrupal,
  semanasDesdeUltimoPagoCreditoGrupal,
  numeroCiclosCreditoGrupal,
  tasaCreditoGrupal,
  nombreAsesoraCreditoGrupal,
  telefonoAsesoraCreditoGrupal,
  motivoNoRenovacionCreditoGrupal,
  tipoEvidenciaActual,
  tipoEvidenciaGuardando,
  loadingEvidencias,
  loadingComprobante,
  evidenciasPendientes,
  fotografiasGuardadas,
  paginasEvidencias,
  opcionesIntegrantesEvidencia,
  motivosClasificacionEvidencia,
  errorMotivosClasificacionEvidencia,
  integrantesEvidenciaSeleccionadas,
  evidenciaPendienteClasificacion,
  evidenciaPendienteDeAsignar,
  errorEvidencias,
  errorComprobante,
  onTieneOtroCreditoGrupalChange,
  onFinancieraCreditoGrupalChange,
  onCreditoGrupalAnteriorActivoChange,
  onValorFichaCreditoGrupalChange,
  onMontoUltimoPrestamoCreditoGrupalChange,
  onSemanaActualCreditoGrupalChange,
  onMesDesembolsoCreditoGrupalChange,
  onUltimoPagoCreditoGrupalChange,
  onNumeroCiclosCreditoGrupalChange,
  onTasaCreditoGrupalChange,
  onNombreAsesoraCreditoGrupalChange,
  onTelefonoAsesoraCreditoGrupalChange,
  onMotivoNoRenovacionCreditoGrupalChange,
  onLimpiarCreditoGrupal,
  onLimpiarRutaCreditoGrupal,
  onReintentarComprobante,
  onCapturarEvidencia,
  onSeleccionarEvidenciaCarrete,
  onIntegrantesEvidenciaChange,
  onGuardarEvidenciaParaIntegrantes,
  onClasificarEvidencia,
  onDescartarEvidenciaPendiente,
  onReintentarEvidencias,
}) => {
  const opcionesNoRenovacion = useOpcionesEntrevista('MOTIVO_NO_RENOVACION', MOTIVOS_NO_RENOVACION);
  const [abrirFinanciera, setAbrirFinanciera] = useState(false);
  const [abrirMotivoNoRenovacion, setAbrirMotivoNoRenovacion] = useState(false);

  const abrirOpcionesEvidencia = () => {
    if (!tipoEvidenciaActual) return;
    Alert.alert('Agregar evidencia', 'Elige de dónde quieres obtener la imagen.', [
      {
        text: 'Tomar foto',
        onPress: () => onCapturarEvidencia(tipoEvidenciaActual),
      },
      {
        text: 'Elegir del carrete',
        onPress: () => onSeleccionarEvidenciaCarrete(tipoEvidenciaActual),
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  return (
    <>
    <View style={styles.sectionHeader}>
      <StickySectionHeader title="HISTORIAL CREDITICIO" moduleTheme="verification" />
    </View>

    {historialInterno ? (
      <CreditHistorySummary
        totalCycles={__DEV__ ? CREDIT_HISTORY_VISUAL_PREVIEW.totalCycles : historialInterno.totalCycles}
        maximum={__DEV__ ? CREDIT_HISTORY_VISUAL_PREVIEW.maximum : historialInterno.maximum}
        minimum={__DEV__ ? CREDIT_HISTORY_VISUAL_PREVIEW.minimum : historialInterno.minimum}
        recentCycles={__DEV__ ? CREDIT_HISTORY_VISUAL_PREVIEW.recentCycles : historialInterno.recentCycles}
        simulated={__DEV__}
      />
    ) : null}

    <SelectorField
      label="¿Ha estado en algún otro crédito grupal?"
      value={tieneOtroCreditoGrupal}
      options={['Sí', 'No']}
      onSelect={(value) => {
        setAbrirFinanciera(value === 'Sí');
        if (value === 'No') setAbrirMotivoNoRenovacion(false);
        onTieneOtroCreditoGrupalChange(value);
        if (value === 'No') onLimpiarCreditoGrupal();
      }}
      moduleTheme="verification"
      required
    />

    {tieneOtroCreditoGrupal === 'Sí' ? (
      <>
        <PickerField
          key={`financiera-${abrirFinanciera && !financieraCreditoGrupal.trim() ? 'abrir' : 'cerrado'}`}
          label="¿Con qué financiera tuvo su último crédito grupal?"
          value={financieraCreditoGrupal}
          options={[...financierasCreditoGrupalOptions]}
          onSelect={(value) => {
            setAbrirFinanciera(false);
            onFinancieraCreditoGrupalChange(value);
          }}
          placeholder="Seleccionar financiera"
          moduleTheme="verification"
          autoOpen={abrirFinanciera && !financieraCreditoGrupal.trim()}
          confirmSelection
          highlightSelectedValue
          required
        />

        <SelectorField
          label="¿Actualmente está activo?"
          value={creditoGrupalAnteriorActivo}
          options={['Sí', 'No']}
          onSelect={(value) => {
            setAbrirMotivoNoRenovacion(value === 'No');
            if (value !== creditoGrupalAnteriorActivo) onLimpiarRutaCreditoGrupal();
            onCreditoGrupalAnteriorActivoChange(value);
          }}
          moduleTheme="verification"
          required
        />

        {creditoGrupalAnteriorActivo ? (
          <>
            <TextInput
              label={creditoGrupalAnteriorActivo === 'Sí'
                ? '¿De qué valor es su ficha?'
                : '¿De qué valor era su ficha?'}
              value={valorFichaCreditoGrupal}
              onChangeText={(value) => onValorFichaCreditoGrupalChange(normalizeCurrencyInput(value))}
              keyboardType="numeric"
              placeholder="$ 0"
              required
            />

            <TextInput
              label="¿Qué monto fue su último préstamo?"
              value={montoUltimoPrestamoCreditoGrupal}
              onChangeText={(value) => (
                onMontoUltimoPrestamoCreditoGrupalChange(normalizeCurrencyInput(value))
              )}
              keyboardType="numeric"
              placeholder="$ 0"
              required
            />

            {creditoGrupalAnteriorActivo === 'Sí' ? (
              <>
                <PickerField
                  label="¿En qué semana van?"
                  value={semanaActualCreditoGrupal}
                  options={SEMANAS_CREDITO_GRUPAL}
                  onSelect={onSemanaActualCreditoGrupalChange}
                  placeholder="Seleccionar semana"
                  moduleTheme="verification"
                  confirmSelection
                  required
                />
                <PickerField
                  label="¿En qué mes se desembolsó?"
                  value={mesDesembolsoCreditoGrupal}
                  options={MESES_CREDITO_GRUPAL}
                  onSelect={onMesDesembolsoCreditoGrupalChange}
                  placeholder="Seleccionar mes"
                  moduleTheme="verification"
                  confirmSelection
                  required
                />
              </>
            ) : (
              <MonthYearPickerField
                label="¿Cuándo fue su último pago?"
                month={mesUltimoPagoCreditoGrupal}
                year={anioUltimoPagoCreditoGrupal}
                months={MESES_CREDITO_GRUPAL}
                years={ANIOS_CREDITO_GRUPAL}
                onConfirm={onUltimoPagoCreditoGrupalChange}
                placeholder="Seleccionar mes y año"
                trailingValue={semanasDesdeUltimoPagoCreditoGrupal == null
                  ? undefined
                  : `${semanasDesdeUltimoPagoCreditoGrupal} SEM`}
                moduleTheme="verification"
                required
              />
            )}

            <PickerField
              label={creditoGrupalAnteriorActivo === 'Sí'
                ? '¿Cuántos ciclos lleva en esa financiera?'
                : '¿Cuántos ciclos estuvo en esa financiera?'}
              value={numeroCiclosCreditoGrupal}
              options={CICLOS_CREDITO_GRUPAL}
              onSelect={onNumeroCiclosCreditoGrupalChange}
              placeholder="Seleccionar ciclos"
              moduleTheme="verification"
              confirmSelection
              required
            />

            <PickerField
              label={creditoGrupalAnteriorActivo === 'Sí' ? '¿Qué tasa maneja?' : '¿Qué tasa manejaba?'}
              value={tasaCreditoGrupal}
              options={TASAS_CREDITO_GRUPAL}
              onSelect={onTasaCreditoGrupalChange}
              placeholder="Seleccionar tasa"
              moduleTheme="verification"
              confirmSelection
            />

            {tipoEvidenciaActual ? (
              <Card moduleTheme="verification" variant="outlined" style={styles.evidenceCard}>
                <SectionTitle title="Evidencia de otra financiera" />
                <Text allowFontScaling={false} style={styles.helpText}>
                  Aquí aparecen las imágenes del comprobante de línea de crédito capturadas en
                  Documentación. Puedes tomar una foto o elegir una imagen del carrete; las nuevas se
                  guardan con su origen, ubicación actual y usuario. Antes de guardar cada evidencia
                  debes clasificarla en verde, amarillo o rojo y seleccionar a qué integrantes corresponde.
                </Text>

                {evidenciaPendienteClasificacion ? (
                  <StatusBadge label="CLASIFICA EVIDENCIA" tone="pending" />
                ) : evidenciaPendienteDeAsignar ? (
                  <StatusBadge label="SELECCIONA INTEGRANTES" tone="pending" />
                ) : tipoEvidenciaGuardando === tipoEvidenciaActual ? (
                  <StatusBadge label="GUARDANDO FOTOGRAFÍAS" tone="progress" />
                ) : loadingEvidencias || loadingComprobante ? (
                  <StatusBadge label="CONSULTANDO EVIDENCIAS" tone="progress" />
                ) : evidenciasPendientes > 0 ? (
                  <StatusBadge
                    label={`${evidenciasPendientes} PENDIENTE${evidenciasPendientes === 1 ? '' : 'S'} DE GUARDAR`}
                    tone="pending"
                  />
                ) : fotografiasGuardadas > 0 ? (
                  <StatusBadge
                    label={`${fotografiasGuardadas} FOTO${fotografiasGuardadas === 1 ? '' : 'S'} DISPONIBLE${fotografiasGuardadas === 1 ? '' : 'S'}`}
                    tone="success"
                  />
                ) : (
                  <StatusBadge label="OPCIONAL" tone="progress" />
                )}

                {loadingEvidencias || loadingComprobante ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color={moduleThemes.verification.primary} />
                    <Text allowFontScaling={false} style={styles.helpText}>Consultando fotografías guardadas…</Text>
                  </View>
                ) : null}

                {paginasEvidencias.length > 0 ? (
                  <DocumentImageCarousel
                    title={creditoGrupalAnteriorActivo === 'Sí'
                      ? 'EVIDENCIA DE OTRA FINANCIERA · CRÉDITO ACTIVO'
                      : 'EVIDENCIA DE OTRA FINANCIERA · CRÉDITO ANTERIOR'}
                    pages={paginasEvidencias}
                    moduleTheme="verification"
                    helperText="Desliza para revisar las fotografías. Al ampliar una evidencia de Entrevista puedes editar sus integrantes."
                  />
                ) : null}

                {errorEvidencias ? (
                  <Text allowFontScaling={false} style={styles.errorText}>{errorEvidencias}</Text>
                ) : null}

                {evidenciaPendienteClasificacion ? (
                  <EvidenceTrafficLightPanel
                    key={evidenciaPendienteClasificacion.key}
                    imageUri={evidenciaPendienteClasificacion.uri}
                    motivos={motivosClasificacionEvidencia}
                    motivosError={errorMotivosClasificacionEvidencia}
                    onConfirm={onClasificarEvidencia}
                    onCancel={onDescartarEvidenciaPendiente}
                  />
                ) : null}
                {!loadingEvidencias && opcionesIntegrantesEvidencia.length === 0 ? (
                  <Text allowFontScaling={false} style={styles.errorText}>
                    No se pudieron cargar las integrantes del expediente. Reabre la verificación
                    antes de tomar otra fotografía.
                  </Text>
                ) : null}
                {errorComprobante ? (
                  <>
                    <Text allowFontScaling={false} style={styles.errorText}>{errorComprobante}</Text>
                    <SecondaryButton
                      title="Reintentar comprobante"
                      moduleTheme="verification"
                      disabled={loadingComprobante}
                      onPress={onReintentarComprobante}
                    />
                  </>
                ) : null}

                {evidenciaPendienteDeAsignar ? (
                  <MultiSelectPickerField
                    label="¿De qué integrantes es esta evidencia?"
                    value={integrantesEvidenciaSeleccionadas}
                    options={opcionesIntegrantesEvidencia}
                    onSelect={(integranteIds) => {
                      onIntegrantesEvidenciaChange(integranteIds);
                      onGuardarEvidenciaParaIntegrantes(integranteIds);
                    }}
                    onCancel={onDescartarEvidenciaPendiente}
                    placeholder="Seleccionar integrantes"
                    helperText="Selecciona una, varias o todas. La fotografía se guarda una sola vez."
                    errorText={opcionesIntegrantesEvidencia.length === 0
                      ? 'No se pudieron cargar las integrantes del expediente.'
                      : undefined}
                    moduleTheme="verification"
                    openOnMount
                    minSelections={1}
                    selectAllLabel="Todas las integrantes"
                    confirmLabel="Guardar evidencia"
                    selectedItemsTitle="Esta evidencia corresponde a"
                    required
                  />
                ) : null}

                <View style={styles.actions}>
                  {evidenciasPendientes > 0 ? (
                    <>
                      <SecondaryButton
                        title="Agregar otra evidencia"
                        moduleTheme="verification"
                        disabled={Boolean(
                          tipoEvidenciaGuardando
                          || loadingEvidencias
                          || loadingComprobante
                          || evidenciaPendienteClasificacion
                          || evidenciaPendienteDeAsignar
                          || opcionesIntegrantesEvidencia.length === 0
                        )}
                        onPress={abrirOpcionesEvidencia}
                      />
                      <PrimaryButton
                        title="Reintentar pendientes"
                        moduleTheme="verification"
                        disabled={Boolean(
                          tipoEvidenciaGuardando
                          || loadingEvidencias
                          || loadingComprobante
                          || evidenciaPendienteClasificacion
                          || evidenciaPendienteDeAsignar
                        )}
                        onPress={() => onReintentarEvidencias(tipoEvidenciaActual)}
                      />
                    </>
                  ) : (
                    <PrimaryButton
                      title={fotografiasGuardadas > 0 ? 'Agregar otra evidencia' : 'Agregar evidencia'}
                      moduleTheme="verification"
                      disabled={Boolean(
                        tipoEvidenciaGuardando
                        || loadingEvidencias
                        || loadingComprobante
                        || evidenciaPendienteClasificacion
                        || evidenciaPendienteDeAsignar
                        || opcionesIntegrantesEvidencia.length === 0
                      )}
                      onPress={abrirOpcionesEvidencia}
                      accessibilityLabel={creditoGrupalAnteriorActivo === 'Sí'
                        ? 'Agregar evidencia del crédito activo desde cámara o carrete'
                        : 'Agregar evidencia del crédito anterior desde cámara o carrete'}
                    />
                  )}
                </View>
              </Card>
            ) : null}

            <TextInput
              label="¿Qué asesora la atendía en esa financiera?"
              value={nombreAsesoraCreditoGrupal}
              onChangeText={onNombreAsesoraCreditoGrupalChange}
              placeholder="Nombre de la asesora"
            />
            <TextInput
              label="¿Cuál es el teléfono de la asesora?"
              value={telefonoAsesoraCreditoGrupal}
              onChangeText={(value) => onTelefonoAsesoraCreditoGrupalChange(formatPhone(value))}
              keyboardType="phone-pad"
              placeholder="Número de 10 dígitos"
              error={telefonoAsesoraCreditoGrupal
                && telefonoAsesoraCreditoGrupal.replace(/\D/g, '').length !== 10
                ? 'Captura un número de 10 dígitos.'
                : undefined}
            />

            {creditoGrupalAnteriorActivo === 'No' ? (
              <PickerField
                key={`motivo-no-renovacion-${abrirMotivoNoRenovacion && !motivoNoRenovacionCreditoGrupal.trim() ? 'abrir' : 'cerrado'}`}
                label="¿Por qué no renovó en esa financiera?"
                value={motivoNoRenovacionCreditoGrupal}
                options={[...opcionesNoRenovacion]}
                onSelect={(value) => {
                  setAbrirMotivoNoRenovacion(false);
                  onMotivoNoRenovacionCreditoGrupalChange(value);
                }}
                placeholder="Seleccionar motivo"
                moduleTheme="verification"
                autoOpen={abrirMotivoNoRenovacion && !motivoNoRenovacionCreditoGrupal.trim()}
                confirmSelection
                required
              />
            ) : null}
          </>
        ) : null}
      </>
    ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  evidenceCard: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  helpText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  loadingRow: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
