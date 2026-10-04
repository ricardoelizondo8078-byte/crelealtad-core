import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import {
  Card,
  DocumentImageCarousel,
  MultiSelectField,
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

interface EntrevistaIngresosSectionProps {
  capacidadPagoSemanal: string;
  motivoCredito: string;
  fuentesIngresoPersonal: string[];
  ingresosSemanalesDeclarados: string;
  lugarTrabajo: string;
  antiguedadLaboral: string;
  tipoNegocio: string;
  ingresoLibreSemanalNegocio: string;
  ubicacionNegocio: string;
  guardandoEvidenciasNegocio: boolean;
  loadingEvidenciasNegocio: boolean;
  evidenciasNegocioPendientes: number;
  evidenciasNegocioGuardadas: number;
  paginasEvidenciasNegocio: DocumentImageCarouselPage[];
  errorEvidenciasNegocio: string | null;
  onCapacidadPagoSemanalChange: (value: string) => void;
  onMotivoCreditoChange: (value: string) => void;
  onFuentesIngresoPersonalChange: (value: string[]) => void;
  onIngresosSemanalesDeclaradosChange: (value: string) => void;
  onLugarTrabajoChange: (value: string) => void;
  onAntiguedadLaboralChange: (value: string) => void;
  onTipoNegocioChange: (value: string) => void;
  onIngresoLibreSemanalNegocioChange: (value: string) => void;
  onUbicacionNegocioChange: (value: string) => void;
  onLimpiarSueldo: () => void;
  onLimpiarNegocio: () => void;
  onCapturarEvidenciaNegocio: () => void;
  onReintentarEvidenciasNegocio: () => void;
}

export const EntrevistaIngresosSection: React.FC<EntrevistaIngresosSectionProps> = ({
  capacidadPagoSemanal,
  motivoCredito,
  fuentesIngresoPersonal,
  ingresosSemanalesDeclarados,
  lugarTrabajo,
  antiguedadLaboral,
  tipoNegocio,
  ingresoLibreSemanalNegocio,
  ubicacionNegocio,
  guardandoEvidenciasNegocio,
  loadingEvidenciasNegocio,
  evidenciasNegocioPendientes,
  evidenciasNegocioGuardadas,
  paginasEvidenciasNegocio,
  errorEvidenciasNegocio,
  onCapacidadPagoSemanalChange,
  onMotivoCreditoChange,
  onFuentesIngresoPersonalChange,
  onIngresosSemanalesDeclaradosChange,
  onLugarTrabajoChange,
  onAntiguedadLaboralChange,
  onTipoNegocioChange,
  onIngresoLibreSemanalNegocioChange,
  onUbicacionNegocioChange,
  onLimpiarSueldo,
  onLimpiarNegocio,
  onCapturarEvidenciaNegocio,
  onReintentarEvidenciasNegocio,
}) => (
  <>
    <TextInput
      label="¿Cuánto puede pagar por semana?"
      value={capacidadPagoSemanal}
      onChangeText={(value) => onCapacidadPagoSemanalChange(normalizeCurrencyInput(value))}
      keyboardType="numeric"
      placeholder="$ 0"
      moduleTheme="verification"
      highlightWhenFilled
      required
    />

    <TextInput
      label="¿En qué va a utilizar el crédito?"
      value={motivoCredito}
      onChangeText={onMotivoCreditoChange}
      placeholder="Uso del crédito"
      multiline
      moduleTheme="verification"
      highlightWhenFilled
      required
    />

    <MultiSelectField
      label="¿De dónde provienen sus ingresos?"
      value={fuentesIngresoPersonal}
      options={['Sueldo', 'Negocio']}
      onSelect={(seleccion) => {
        onFuentesIngresoPersonalChange(seleccion);
        if (!seleccion.includes('Sueldo')) onLimpiarSueldo();
        if (!seleccion.includes('Negocio')) onLimpiarNegocio();
      }}
      helperText="Puedes seleccionar una o ambas opciones."
      moduleTheme="verification"
      variant="chips"
      required
    />

    {fuentesIngresoPersonal.includes('Sueldo') ? (
      <>
        <View style={styles.sectionHeader}>
          <StickySectionHeader title="SUELDO" moduleTheme="verification" />
        </View>

        <TextInput
          label="¿Cuál es su sueldo semanal?"
          value={ingresosSemanalesDeclarados}
          onChangeText={(value) => onIngresosSemanalesDeclaradosChange(normalizeCurrencyInput(value))}
          keyboardType="numeric"
          placeholder="$ 0"
          moduleTheme="verification"
          highlightWhenFilled
          required
        />

        <TextInput
          label="¿Dónde trabaja?"
          value={lugarTrabajo}
          onChangeText={onLugarTrabajoChange}
          moduleTheme="verification"
          highlightWhenFilled
          required
        />

        <SelectorField
          label="¿Desde hace cuánto tiempo trabaja ahí?"
          value={antiguedadLaboral}
          options={['1 año', '2 años', '3 a 5 años', '≥ 5 años']}
          onSelect={onAntiguedadLaboralChange}
          moduleTheme="verification"
          required
        />
      </>
    ) : null}

    {fuentesIngresoPersonal.includes('Negocio') ? (
      <>
        <View style={styles.sectionHeader}>
          <StickySectionHeader title="NEGOCIO" moduleTheme="verification" />
        </View>

        <TextInput
          label="¿De qué es el negocio?"
          value={tipoNegocio}
          onChangeText={onTipoNegocioChange}
          placeholder="Tipo de negocio"
          moduleTheme="verification"
          highlightWhenFilled
          required
        />

        <TextInput
          label="¿Cuál es el ingreso libre semanal?"
          value={ingresoLibreSemanalNegocio}
          onChangeText={(value) => onIngresoLibreSemanalNegocioChange(normalizeCurrencyInput(value))}
          keyboardType="numeric"
          placeholder="$ 0"
          moduleTheme="verification"
          highlightWhenFilled
          required
        />

        <Card moduleTheme="verification" variant="outlined" style={styles.evidenceCard}>
          <SectionTitle title="Fotografías del negocio" />
          <Text allowFontScaling={false} style={styles.helpText}>
            Opcional. Cada fotografía se toma con la cámara y se guarda con ubicación y usuario.
          </Text>

          {guardandoEvidenciasNegocio ? (
            <StatusBadge label="GUARDANDO FOTOGRAFÍAS" tone="progress" />
          ) : evidenciasNegocioPendientes > 0 ? (
            <StatusBadge
              label={`${evidenciasNegocioPendientes} PENDIENTE${evidenciasNegocioPendientes === 1 ? '' : 'S'} DE GUARDAR`}
              tone="pending"
            />
          ) : evidenciasNegocioGuardadas > 0 ? (
            <StatusBadge
              label={`${evidenciasNegocioGuardadas} FOTO${evidenciasNegocioGuardadas === 1 ? '' : 'S'} GUARDADA${evidenciasNegocioGuardadas === 1 ? '' : 'S'}`}
              tone="success"
            />
          ) : (
            <StatusBadge label="OPCIONAL" tone="progress" />
          )}

          {loadingEvidenciasNegocio ? (
            <View style={styles.loading}>
              <ActivityIndicator color={moduleThemes.verification.primary} />
              <Text allowFontScaling={false} style={styles.helpText}>
                Consultando fotografías guardadas…
              </Text>
            </View>
          ) : null}

          {paginasEvidenciasNegocio.length > 0 ? (
            <DocumentImageCarousel
              title="FOTOGRAFÍAS DEL NEGOCIO"
              pages={paginasEvidenciasNegocio}
              moduleTheme="verification"
              helperText="Desliza para revisar las fotografías. Toca una imagen para ampliarla."
            />
          ) : null}

          {errorEvidenciasNegocio ? (
            <Text allowFontScaling={false} style={styles.errorText}>
              {errorEvidenciasNegocio}
            </Text>
          ) : null}

          <View style={styles.actions}>
            {evidenciasNegocioPendientes > 0 ? (
              <>
                <SecondaryButton
                  title="Tomar otra fotografía"
                  moduleTheme="verification"
                  disabled={guardandoEvidenciasNegocio || loadingEvidenciasNegocio}
                  onPress={onCapturarEvidenciaNegocio}
                />
                <PrimaryButton
                  title="Reintentar pendientes"
                  moduleTheme="verification"
                  disabled={guardandoEvidenciasNegocio || loadingEvidenciasNegocio}
                  onPress={onReintentarEvidenciasNegocio}
                />
              </>
            ) : (
              <PrimaryButton
                title="Tomar fotografía"
                moduleTheme="verification"
                disabled={guardandoEvidenciasNegocio || loadingEvidenciasNegocio}
                onPress={onCapturarEvidenciaNegocio}
                accessibilityLabel="Tomar fotografía del negocio con la cámara"
              />
            )}
          </View>
        </Card>

        <TextInput
          label="¿Dónde se ubica el negocio?"
          value={ubicacionNegocio}
          onChangeText={onUbicacionNegocioChange}
          placeholder="Dirección del negocio"
          multiline
          moduleTheme="verification"
          highlightWhenFilled
        />
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
  loading: {
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
