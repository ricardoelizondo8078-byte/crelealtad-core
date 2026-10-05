import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Card,
  MultiSelectPickerField,
  PickerField,
  SecondaryButton,
  SelectorField,
  StatusBadge,
  StickySectionHeader,
} from '../../components/ui';
import {
  colors,
  radius,
  spacing,
  typography,
} from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import {
  formatPorcentajeMontoGrupal,
  MOTIVOS_DESACUERDO_MONTOS,
  NO_CONOCE_TESORERA_LABEL,
  NO_SABE_DOMICILIO_RECOLECCION_LABEL,
  NO_SABE_DOMICILIO_RECOLECCION_VALUE,
} from './verificacion-entrevista.catalog';
import type { IntegranteData } from './verificacion-individual.types';

interface EntrevistaPreguntasGeneralesSectionProps {
  guardando: boolean;
  errorGuardado: string | null;
  entrevistaCargada: boolean;
  entrevistaConfirmada: boolean;
  guardadoLocalPendiente: boolean;
  conoceAsesora: string;
  comoConocioAsesora: string;
  conoceIntegrantes: string;
  tiempoConoceIntegrantes: string;
  sabeMontosCompaneras: string;
  acuerdoMontos: string;
  integrantesGrupo: IntegranteData[];
  integranteId: string;
  montoTotalSolicitadoGrupo: number | null;
  companerasMontoNoAcordadoIds: string[];
  motivosDesacuerdoMontosPorIntegrante: Record<string, string>;
  conoceTesoreraDelGrupo: string;
  quienEsTesorera: string;
  domicilioRecoleccion: string;
  tieneFamiliarGrupo: string;
  familiaresGrupoIds: string[];
  onRecuperarEntrevista: () => void;
  onReintentarGuardado: () => void;
  onConoceAsesoraChange: (value: string) => void;
  onComoConocioAsesoraChange: (value: string) => void;
  onConoceIntegrantesChange: (value: string) => void;
  onTiempoConoceIntegrantesChange: (value: string) => void;
  onSabeMontosCompanerasChange: (value: string) => void;
  onAcuerdoMontosChange: (value: string) => void;
  onCompanerasMontoNoAcordadoChange: (value: string[]) => void;
  onMotivosDesacuerdoChange: (value: Record<string, string>) => void;
  onConoceTesoreraChange: (value: string) => void;
  onQuienEsTesoreraChange: (value: string) => void;
  onDomicilioRecoleccionChange: (value: string) => void;
  onTieneFamiliarGrupoChange: (value: string) => void;
  onFamiliaresGrupoChange: (value: string[]) => void;
}

export const EntrevistaPreguntasGeneralesSection: React.FC<
  EntrevistaPreguntasGeneralesSectionProps
> = ({
  guardando,
  errorGuardado,
  entrevistaCargada,
  entrevistaConfirmada,
  guardadoLocalPendiente,
  conoceAsesora,
  comoConocioAsesora,
  conoceIntegrantes,
  tiempoConoceIntegrantes,
  sabeMontosCompaneras,
  acuerdoMontos,
  integrantesGrupo,
  integranteId,
  montoTotalSolicitadoGrupo,
  companerasMontoNoAcordadoIds,
  motivosDesacuerdoMontosPorIntegrante,
  conoceTesoreraDelGrupo,
  quienEsTesorera,
  domicilioRecoleccion,
  tieneFamiliarGrupo,
  familiaresGrupoIds,
  onRecuperarEntrevista,
  onReintentarGuardado,
  onConoceAsesoraChange,
  onComoConocioAsesoraChange,
  onConoceIntegrantesChange,
  onTiempoConoceIntegrantesChange,
  onSabeMontosCompanerasChange,
  onAcuerdoMontosChange,
  onCompanerasMontoNoAcordadoChange,
  onMotivosDesacuerdoChange,
  onConoceTesoreraChange,
  onQuienEsTesoreraChange,
  onDomicilioRecoleccionChange,
  onTieneFamiliarGrupoChange,
  onFamiliaresGrupoChange,
}) => (
  <>
    <View style={styles.sectionHeader}>
      <StickySectionHeader
        title="PREGUNTAS GENERALES"
        moduleTheme="verification"
      />
    </View>

    {guardando ? (
      <StatusBadge label="GUARDANDO ENTREVISTA" tone="progress" />
    ) : errorGuardado ? (
      <Card variant="warning">
        <Text allowFontScaling={false} style={styles.errorText}>
          {errorGuardado}
        </Text>
        <SecondaryButton
          title={entrevistaCargada ? 'Reintentar guardado' : 'Recuperar entrevista'}
          moduleTheme="verification"
          onPress={entrevistaCargada ? onReintentarGuardado : onRecuperarEntrevista}
        />
      </Card>
    ) : guardadoLocalPendiente ? (
      <StatusBadge label="GUARDADA LOCALMENTE · PENDIENTE" tone="pending" />
    ) : entrevistaConfirmada ? (
      <StatusBadge label="ENTREVISTA GUARDADA" tone="success" />
    ) : null}

    <SelectorField
      label="¿Conoce a la asesora?"
      value={conoceAsesora}
      options={['Sí', 'No']}
      onSelect={onConoceAsesoraChange}
      moduleTheme="verification"
      required
    />

    {conoceAsesora === 'Sí' ? (
      <PickerField
        label="¿Cómo conoció a la asesora?"
        value={comoConocioAsesora}
        options={[
          'Por otra integrante',
          'En otra financiera',
          'A través de Facebook',
          'Otro',
        ]}
        onSelect={onComoConocioAsesoraChange}
        placeholder="Seleccionar opción"
        moduleTheme="verification"
        autoOpen
        confirmSelection
        highlightSelectedValue
        required
      />
    ) : null}

    <SelectorField
      label="¿Conoce a todas las integrantes del grupo?"
      value={conoceIntegrantes}
      options={['Si', 'No']}
      onSelect={onConoceIntegrantesChange}
      moduleTheme="verification"
      required
    />

    {conoceIntegrantes === 'Si' && (
      <SelectorField
        label="¿Desde hace cuánto?"
        value={tiempoConoceIntegrantes}
        options={['0-1 años', '1-3 años', '3+ años']}
        onSelect={onTiempoConoceIntegrantesChange}
        moduleTheme="verification"
        required
      />
    )}

    <SelectorField
      label="¿Sabe cuánto están pidiendo sus compañeras?"
      value={sabeMontosCompaneras}
      options={['Si', 'No']}
      onSelect={onSabeMontosCompanerasChange}
      moduleTheme="verification"
      required
    />

    <SelectorField
      label="¿Está de acuerdo con los montos de sus compañeras?"
      value={acuerdoMontos}
      options={['Sí', 'No']}
      onSelect={onAcuerdoMontosChange}
      moduleTheme="verification"
      required
    />

    {acuerdoMontos === 'No' ? (
      <MultiSelectPickerField
        label="¿Con qué integrantes NO está de acuerdo?"
        value={companerasMontoNoAcordadoIds}
        options={integrantesGrupo
          .filter((integranteGrupo) => integranteGrupo.id !== integranteId)
          .map((integranteGrupo) => ({
            value: integranteGrupo.id,
            label: `${formatPorcentajeMontoGrupal(
              integranteGrupo.montoSolicitado,
              montoTotalSolicitadoGrupo,
            )} · ${integranteGrupo.nombre} · ${formatCurrency(integranteGrupo.montoSolicitado)}`,
          }))}
        onSelect={onCompanerasMontoNoAcordadoChange}
        placeholder="Seleccionar integrantes"
        helperText={companerasMontoNoAcordadoIds.length > 0
          ? 'Cada integrante muestra debajo la causa registrada.'
          : 'Selecciona una o varias integrantes y registra una causa para cada una.'}
        errorText={companerasMontoNoAcordadoIds.length === 0
          ? 'Selecciona al menos una integrante.'
          : undefined}
        moduleTheme="verification"
        selectedItemsTitle="Integrantes con monto no aceptado"
        minSelections={1}
        openOnMount
        selectionTone="danger"
        selectedItemsAreTrigger
        followUp={{
          label: (option) => {
            const companera = integrantesGrupo.find(
              (integranteGrupo) => integranteGrupo.id === option.value,
            );
            return `¿Por qué no está de acuerdo con ${companera?.nombre ?? 'esta integrante'}?`;
          },
          options: MOTIVOS_DESACUERDO_MONTOS,
          values: motivosDesacuerdoMontosPorIntegrante,
          onChange: onMotivosDesacuerdoChange,
        }}
        required
      />
    ) : null}

    <SelectorField
      label="¿Conoce a la tesorera del grupo?"
      value={conoceTesoreraDelGrupo}
      options={['Sí', 'No']}
      onSelect={onConoceTesoreraChange}
      moduleTheme="verification"
      required
    />

    {conoceTesoreraDelGrupo === 'Sí' ? (
      <MultiSelectPickerField
        label="¿Quién es la tesorera del grupo?"
        value={quienEsTesorera ? [quienEsTesorera] : []}
        options={integrantesGrupo.map((integranteGrupo) => ({
          value: integranteGrupo.id,
          label: integranteGrupo.nombre,
        }))}
        onSelect={(seleccion) => onQuienEsTesoreraChange(seleccion[0] ?? '')}
        placeholder="Seleccionar tesorera"
        modalSubtitle="Selecciona una integrante"
        moduleTheme="verification"
        selectedItemsTitle="Tesorera seleccionada"
        minSelections={1}
        maxSelections={1}
        openOnMount
        selectedItemsAreTrigger
        hideLabelWhenSelected
        required
      />
    ) : null}

    {conoceTesoreraDelGrupo === 'No' ? (
      <View
        accessible
        accessibilityLabel={NO_CONOCE_TESORERA_LABEL}
        style={styles.unknownTreasurer}
      >
        <Text allowFontScaling={false} style={styles.unknownTreasurerMark}>✕</Text>
        <Text allowFontScaling={false} style={styles.unknownTreasurerText}>
          {NO_CONOCE_TESORERA_LABEL}
        </Text>
      </View>
    ) : null}

    <MultiSelectPickerField
      label="¿En el domicilio de qué integrante se recolectarán los pagos?"
      value={domicilioRecoleccion ? [domicilioRecoleccion] : []}
      options={[
        ...integrantesGrupo.map((integranteGrupo) => ({
          value: integranteGrupo.id,
          label: integranteGrupo.nombre,
        })),
        {
          value: NO_SABE_DOMICILIO_RECOLECCION_VALUE,
          label: NO_SABE_DOMICILIO_RECOLECCION_LABEL,
        },
      ]}
      onSelect={(seleccion) => onDomicilioRecoleccionChange(seleccion[0] ?? '')}
      placeholder="Seleccionar opción"
      modalSubtitle="Selecciona una integrante o indica que no lo sabe"
      moduleTheme="verification"
      selectedItemsTitle="DOMICILIO DE RECOLECCIÓN"
      showSelectedItemsTitleWhenTrigger
      minSelections={1}
      maxSelections={1}
      dangerValues={[NO_SABE_DOMICILIO_RECOLECCION_VALUE]}
      selectedItemsAreTrigger
      hideLabelWhenSelected
      required
    />

    <SelectorField
      label="¿Tiene algún familiar en este grupo?"
      value={tieneFamiliarGrupo}
      options={['Sí', 'No']}
      onSelect={onTieneFamiliarGrupoChange}
      moduleTheme="verification"
      required
    />

    {tieneFamiliarGrupo === 'Sí' ? (
      <MultiSelectPickerField
        label="¿Quiénes son sus familiares en el grupo?"
        value={familiaresGrupoIds}
        options={integrantesGrupo
          .filter((integranteGrupo) => integranteGrupo.id !== integranteId)
          .map((integranteGrupo) => ({
            value: integranteGrupo.id,
            label: integranteGrupo.nombre,
          }))}
        onSelect={onFamiliaresGrupoChange}
        placeholder="Seleccionar familiares"
        helperText={familiaresGrupoIds.length > 0
          ? undefined
          : 'Puedes seleccionar una o varias integrantes.'}
        errorText={familiaresGrupoIds.length === 0
          ? 'Selecciona al menos una integrante.'
          : undefined}
        moduleTheme="verification"
        selectedItemsTitle="FAMILIARES EN EL GRUPO"
        showSelectedItemsTitleWhenTrigger
        minSelections={1}
        disabled={integrantesGrupo.filter((item) => item.id !== integranteId).length === 0}
        openOnMount
        selectedItemsAreTrigger
        hideLabelWhenSelected
        required
      />
    ) : null}
  </>
);

const styles = StyleSheet.create({
  sectionHeader: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
  },
  unknownTreasurer: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderWidth: 2,
    borderColor: colors.error,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  unknownTreasurerMark: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '700',
  },
  unknownTreasurerText: {
    ...typography.bodyStrong,
    flex: 1,
    color: colors.error,
  },
});
