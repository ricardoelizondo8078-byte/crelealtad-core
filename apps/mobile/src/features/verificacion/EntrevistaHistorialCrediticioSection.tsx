import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Card,
  CreditHistorySummary,
  DocumentImageCarousel,
  MonthYearPickerField,
  PickerField,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
  SelectorField,
  StatusBadge,
  StickySectionHeader,
  TextInput,
} from '../../components/ui';
import type { DocumentImageCarouselPage } from '../../components/ui';
import {
  colors,
  moduleThemes,
  spacing,
  typography,
} from '../../theme/tokens';
import { normalizeCurrencyInput } from '../../utils/currency';
import { formatPhone } from '../../utils/input';
import {
  ANIOS_CREDITO_GRUPAL,
  CICLOS_CREDITO_GRUPAL,
  FINANCIERAS_CREDITO_GRUPAL_NUEVO_LEON,
  MESES_CREDITO_GRUPAL,
  MOTIVOS_NO_RENOVACION,
  SEMANAS_CREDITO_GRUPAL,
  TASAS_CREDITO_GRUPAL,
} from './verificacion-entrevista.catalog';
import { CREDIT_HISTORY_VISUAL_PREVIEW } from './verificacion-individual.model';
import type {
  IntegranteData,
  TipoEvidenciaHistorialCredito,
} from './verificacion-individual.types';

interface EntrevistaHistorialCrediticioSectionProps {
  historialInterno?: IntegranteData['historialCrediticioInterno'];
  tieneOtroCreditoGrupal: string;
  financieraCreditoGrupal: string;
  creditoGrupalAnteriorActivo: string;
  valorFichaCreditoGrupal: string;
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
  errorEvidencias: string | null;
  errorComprobante: string | null;
  onTieneOtroCreditoGrupalChange: (value: string) => void;
  onFinancieraCreditoGrupalChange: (value: string) => void;
  onCreditoGrupalAnteriorActivoChange: (value: string) => void;
  onValorFichaCreditoGrupalChange: (value: string) => void;
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
  onReintentarEvidencias: (tipo: TipoEvidenciaHistorialCredito) => void;
}

export const EntrevistaHistorialCrediticioSection: React.FC<
  EntrevistaHistorialCrediticioSectionProps
> = ({
  historialInterno,
  tieneOtroCreditoGrupal,
  financieraCreditoGrupal,
  creditoGrupalAnteriorActivo,
  valorFichaCreditoGrupal,
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
  errorEvidencias,
  errorComprobante,
  onTieneOtroCreditoGrupalChange,
  onFinancieraCreditoGrupalChange,
  onCreditoGrupalAnteriorActivoChange,
  onValorFichaCreditoGrupalChange,
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
  onReintentarEvidencias,
}) => (
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
        onTieneOtroCreditoGrupalChange(value);
        if (value === 'No') onLimpiarCreditoGrupal();
      }}
      moduleTheme="verification"
      required
    />

    {tieneOtroCreditoGrupal === 'Sí' ? (
      <>
        <PickerField
          label="¿Con qué financiera tuvo su último crédito grupal?"
          value={financieraCreditoGrupal}
          options={FINANCIERAS_CREDITO_GRUPAL_NUEVO_LEON}
          onSelect={onFinancieraCreditoGrupalChange}
          placeholder="Seleccionar financiera"
          moduleTheme="verification"
          autoOpen
          confirmSelection
          highlightSelectedValue
          required
        />

        <SelectorField
          label="¿Actualmente está activo?"
          value={creditoGrupalAnteriorActivo}
          options={['Sí', 'No']}
          onSelect={(value) => {
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
              required
            />

            {tipoEvidenciaActual ? (
              <Card moduleTheme="verification" variant="outlined" style={styles.evidenceCard}>
                <SectionTitle title="Evidencia de otra financiera" />
                <Text allowFontScaling={false} style={styles.helpText}>
                  Aquí aparecen las imágenes del comprobante de línea de crédito capturadas en
                  Documentación. Puedes agregar todas las fotografías que necesites; las nuevas se
                  guardan con ubicación y usuario.
                </Text>

                {tipoEvidenciaGuardando === tipoEvidenciaActual ? (
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
                  <StatusBadge label="PENDIENTE" tone="pending" />
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
                    helperText="Desliza para revisar las fotografías. Toca una imagen para ampliarla."
                  />
                ) : null}

                {errorEvidencias ? (
                  <Text allowFontScaling={false} style={styles.errorText}>{errorEvidencias}</Text>
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

                <View style={styles.actions}>
                  {evidenciasPendientes > 0 ? (
                    <>
                      <SecondaryButton
                        title="Tomar otra fotografía"
                        moduleTheme="verification"
                        disabled={Boolean(tipoEvidenciaGuardando || loadingEvidencias || loadingComprobante)}
                        onPress={() => onCapturarEvidencia(tipoEvidenciaActual)}
                      />
                      <PrimaryButton
                        title="Reintentar pendientes"
                        moduleTheme="verification"
                        disabled={Boolean(tipoEvidenciaGuardando || loadingEvidencias || loadingComprobante)}
                        onPress={() => onReintentarEvidencias(tipoEvidenciaActual)}
                      />
                    </>
                  ) : (
                    <PrimaryButton
                      title={fotografiasGuardadas > 0 ? 'Tomar otra fotografía' : 'Tomar fotografía'}
                      moduleTheme="verification"
                      disabled={Boolean(tipoEvidenciaGuardando || loadingEvidencias || loadingComprobante)}
                      onPress={() => onCapturarEvidencia(tipoEvidenciaActual)}
                      accessibilityLabel={creditoGrupalAnteriorActivo === 'Sí'
                        ? 'Tomar evidencia fotográfica del crédito activo con la cámara'
                        : 'Tomar evidencia fotográfica del crédito anterior con la cámara'}
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
                label="¿Por qué no renovó en esa financiera?"
                value={motivoNoRenovacionCreditoGrupal}
                options={MOTIVOS_NO_RENOVACION}
                onSelect={onMotivoNoRenovacionCreditoGrupalChange}
                placeholder="Seleccionar motivo"
                moduleTheme="verification"
                autoOpen
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
