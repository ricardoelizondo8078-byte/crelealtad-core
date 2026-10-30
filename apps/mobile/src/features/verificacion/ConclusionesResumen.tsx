import FontAwesome from '@expo/vector-icons/FontAwesome';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  CreditHistorySummary,
  PrimaryButton,
  StatusBadge,
  StickySectionHeader,
  SummaryDetailsCard,
  SummaryStatusRow,
  type CreditHistoryCycle,
  type CreditHistoryExtreme,
  type SummaryDetailItem,
} from '../../components/ui';
import { iconSizes, moduleThemes, spacing } from '../../theme/tokens';
import { extractCurrencyValue, formatCurrency } from '../../utils/currency';
import {
  CLASIFICACIONES_FINANCIERA,
  type ClasificacionFinanciera,
} from '../parametros/parametros-financieras.model';
import type {
  ParametroConclusionesCiclosCredito,
  ParametroConclusionesConcordanciaFicha,
  ParametroConclusionesConcordanciaPrestamo,
  ParametroConclusionesPromedioEvidencias,
  ParametroConclusionesSemanaCredito,
  ParametroConclusionesToleranciaSemanaDesembolso,
} from '../parametros/parametros-conclusiones.api';
import {
  calcularToleranciaSemanaDesembolso,
  calcularPorcentajeDiferencia,
  obtenerTonoCiclosCredito,
  obtenerTonoConcordancia,
  obtenerTonoPromedioEvidencias,
  obtenerTonoSemanaCredito,
  obtenerTonoToleranciaSemanaDesembolso,
} from '../parametros/parametros-conclusiones.model';
import {
  calcularRangoSemanasDesdeMes,
  NO_SABE_DOMICILIO_RECOLECCION_LABEL,
  NO_SABE_DOMICILIO_RECOLECCION_VALUE,
} from './verificacion-entrevista.catalog';
import { obtenerPresentacionCicloIndividual } from './verificacion-individual.model';

interface IntegranteResumen {
  id: string;
  nombre: string;
}

interface HistorialCrelealtadResumen {
  totalCycles: number;
  maximum: CreditHistoryExtreme;
  minimum: CreditHistoryExtreme;
  recentCycles: CreditHistoryCycle[];
}

interface HistorialOtraFinancieraResumen {
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
  motivoNoRenovacionCreditoGrupal: string;
  fotografiasGuardadas: number;
  fotografiasPendientes: number;
  fotografiasCalificables: number;
  fotografiasCalificadas: {
    verdes: number;
    amarillas: number;
    rojas: number;
  };
  fechaCapturaEntrevista: string | null;
  clasificacionFinanciera: ClasificacionFinanciera | null;
}

interface ConclusionesResumenProps {
  ciclosIndividualesRegistrados: number | null;
  esNuevaConNosotros: boolean;
  sabeMontosCompaneras: string;
  acuerdoMontos: string;
  companerasMontoNoAcordadoIds: readonly string[];
  conoceTesoreraDelGrupo: string;
  quienEsTesorera: string;
  domicilioRecoleccion: string;
  integrantesGrupo: readonly IntegranteResumen[];
  tieneHistorialCrelealtad: boolean | null;
  historialCrelealtad: HistorialCrelealtadResumen | null;
  historialOtraFinanciera: HistorialOtraFinancieraResumen;
  calificacionSemanaCredito?: ParametroConclusionesSemanaCredito | null;
  calificacionCiclosCredito?: ParametroConclusionesCiclosCredito | null;
  toleranciaSemanaDesembolso?: ParametroConclusionesToleranciaSemanaDesembolso | null;
  concordanciaFicha?: ParametroConclusionesConcordanciaFicha | null;
  concordanciaPrestamo?: ParametroConclusionesConcordanciaPrestamo | null;
  calificacionPromedioEvidencias?: ParametroConclusionesPromedioEvidencias | null;
  onVerEvidenciasOtraFinanciera?: () => void;
  fotografiasCasa?: number;
  fotografiasNegocio?: number;
  onVerFotografiasCasa?: () => void;
  onVerFotografiasNegocio?: () => void;
}

const normalizedAnswer = (value: string): string => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase();

const isYes = (value: string): boolean => normalizedAnswer(value) === 'si';
const isNo = (value: string): boolean => normalizedAnswer(value) === 'no';

const pendingValue = (value: string): string => value.trim() || 'PENDIENTE';

const currencyValue = (value: string): string => {
  const digits = extractCurrencyValue(value);
  return digits ? formatCurrency(Number(digits)) : 'PENDIENTE';
};

const positiveCurrencyNumber = (value: string): number | null => {
  const digits = extractCurrencyValue(value);
  const numericValue = digits ? Number(digits) : Number.NaN;
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
};

const cyclesValue = (value: string): string => {
  const cycles = Number(value);
  if (!Number.isInteger(cycles) || cycles <= 0) return 'PENDIENTE';
  return `${cycles} ${cycles === 1 ? 'CICLO' : 'CICLOS'}`;
};

const evidenceValue = (saved: number, pending: number): string => {
  const savedLabel = `${saved} ${saved === 1 ? 'FOTO' : 'FOTOS'}`;
  if (pending <= 0) return saved > 0 ? savedLabel : 'SIN FOTOGRAFÍAS';
  return `${savedLabel} · ${pending} ${pending === 1 ? 'PENDIENTE' : 'PENDIENTES'}`;
};

const evidenceScore = (history: HistorialOtraFinancieraResumen): number | null => {
  const { verdes, amarillas, rojas } = history.fotografiasCalificadas;
  const fotografiasConCalificacion = verdes + amarillas + rojas;
  if (
    history.fotografiasCalificables <= 0
    || fotografiasConCalificacion !== history.fotografiasCalificables
  ) {
    return null;
  }

  return Math.round(
    ((verdes * 100) + (amarillas * 50)) / history.fotografiasCalificables,
  );
};

const otherFinancialHistoryItems = (
  history: HistorialOtraFinancieraResumen,
  calificacionSemanaCredito: ParametroConclusionesSemanaCredito | null,
  calificacionCiclosCredito: ParametroConclusionesCiclosCredito | null,
  toleranciaSemanaDesembolso: ParametroConclusionesToleranciaSemanaDesembolso | null,
  concordanciaFicha: ParametroConclusionesConcordanciaFicha | null,
  concordanciaPrestamo: ParametroConclusionesConcordanciaPrestamo | null,
  calificacionPromedioEvidencias: ParametroConclusionesPromedioEvidencias | null,
  onVerEvidencias?: () => void,
): readonly SummaryDetailItem[] => {
  const promedioEvidencias = evidenceScore(history);
  const tonoPromedioEvidencias = promedioEvidencias == null
    ? undefined
    : obtenerTonoPromedioEvidencias(promedioEvidencias, calificacionPromedioEvidencias);
  const active = isYes(history.creditoGrupalAnteriorActivo);
  const inactive = isNo(history.creditoGrupalAnteriorActivo);
  const rangoSemanas = calcularRangoSemanasDesdeMes(
    history.mesDesembolsoCreditoGrupal,
    history.fechaCapturaEntrevista,
  );
  const semanaActual = Number(history.semanaActualCreditoGrupal);
  const numeroCiclos = Number(history.numeroCiclosCreditoGrupal);
  const valorFicha = positiveCurrencyNumber(history.valorFichaCreditoGrupal);
  const montoUltimoPrestamo = positiveCurrencyNumber(history.montoUltimoPrestamoCreditoGrupal);
  const tasaDeclarada = Number(history.tasaCreditoGrupal.trim());
  const tasaValida = Number.isFinite(tasaDeclarada) && tasaDeclarada > 0;
  const valorFichaCalculado = montoUltimoPrestamo != null && tasaValida
    ? (montoUltimoPrestamo / 1000) * tasaDeclarada
    : null;
  const montoPrestamoCalculado = valorFicha != null && tasaValida
    ? (valorFicha / tasaDeclarada) * 1000
    : null;
  const fichaCalculada = valorFichaCalculado != null
    ? formatCurrency(valorFichaCalculado)
    : undefined;
  const prestamoCalculado = montoPrestamoCalculado != null
    ? formatCurrency(montoPrestamoCalculado)
    : undefined;
  const tasaCalculada = !tasaValida && valorFicha != null && montoUltimoPrestamo != null
    ? String(Math.round((valorFicha / montoUltimoPrestamo) * 1000))
    : undefined;
  const toleranciaDesembolso = rangoSemanas
    ? calcularToleranciaSemanaDesembolso(
      semanaActual,
      rangoSemanas.desdeUltimoDia,
      rangoSemanas.desdePrimerDia,
    )
    : null;
  const tonoDesembolso = toleranciaDesembolso == null
    ? undefined
    : obtenerTonoToleranciaSemanaDesembolso(
      toleranciaDesembolso,
      toleranciaSemanaDesembolso,
    );
  const diferenciaFicha = valorFicha != null && valorFichaCalculado != null
    ? calcularPorcentajeDiferencia(valorFicha, valorFichaCalculado)
    : null;
  const diferenciaPrestamo = montoUltimoPrestamo != null && montoPrestamoCalculado != null
    ? calcularPorcentajeDiferencia(montoUltimoPrestamo, montoPrestamoCalculado)
    : null;
  const tonoFicha = diferenciaFicha == null
    ? undefined
    : obtenerTonoConcordancia(diferenciaFicha, concordanciaFicha);
  const tonoPrestamo = diferenciaPrestamo == null
    ? undefined
    : obtenerTonoConcordancia(diferenciaPrestamo, concordanciaPrestamo);
  const lastPayment = [
    history.mesUltimoPagoCreditoGrupal.trim(),
    history.anioUltimoPagoCreditoGrupal.trim(),
  ].filter(Boolean).join(' ');
  const nombreFinanciera = history.financieraCreditoGrupal.trim();
  const presentacionFinanciera = history.clasificacionFinanciera
    ? CLASIFICACIONES_FINANCIERA[history.clasificacionFinanciera]
    : null;
  const items: SummaryDetailItem[] = [
    {
      label: 'FINANCIERA',
      value: nombreFinanciera,
      valueTone: presentacionFinanciera?.summaryTone ?? 'neutral',
      actionAccessibilityLabel: presentacionFinanciera
        ? `FINANCIERA: ${nombreFinanciera}. Clasificación: ${presentacionFinanciera.label}`
        : `FINANCIERA: ${nombreFinanciera}. Sin clasificación configurada`,
    },
    {
      label: 'ESTADO',
      middleValue: cyclesValue(history.numeroCiclosCreditoGrupal),
      middleTone: obtenerTonoCiclosCredito(numeroCiclos, calificacionCiclosCredito),
      value: active ? 'ACTIVO' : inactive ? 'FINALIZADO' : 'PENDIENTE',
    },
  ];

  if (active) {
    items.push(
      {
        label: 'SEMANA ACTUAL',
        value: pendingValue(history.semanaActualCreditoGrupal),
        valueTone: obtenerTonoSemanaCredito(semanaActual, calificacionSemanaCredito),
      },
      {
        label: 'MES DE DESEMBOLSO',
        value: pendingValue(history.mesDesembolsoCreditoGrupal),
        sectionDividerAfter: true,
        trailingValue: rangoSemanas
          ? `${rangoSemanas.desdeUltimoDia} - ${rangoSemanas.desdePrimerDia} SEM`
          : undefined,
        trailingTone: tonoDesembolso,
        valueTone: tonoDesembolso,
      },
    );
  }

  items.push(
    {
      label: 'VALOR DE FICHA',
      value: currencyValue(history.valorFichaCreditoGrupal),
      tableColumns: true,
      tableTrailingValue: fichaCalculada,
      tableTrailingDetail: diferenciaFicha == null ? undefined : `${diferenciaFicha}%`,
      tableTrailingTone: tonoFicha,
    },
    {
      label: 'ÚLT. PRÉSTAMO',
      value: currencyValue(history.montoUltimoPrestamoCreditoGrupal),
      tableColumns: true,
      tableTrailingValue: prestamoCalculado,
      tableTrailingDetail: diferenciaPrestamo == null ? undefined : `${diferenciaPrestamo}%`,
      tableTrailingTone: tonoPrestamo,
    },
    {
      label: 'TASA',
      value: tasaValida ? pendingValue(history.tasaCreditoGrupal) : '——',
      tableColumns: true,
      tableTrailingValue: tasaCalculada,
      sectionDividerAfter: true,
    },
  );

  if (inactive) {
    items.push(
      { label: 'ÚLTIMO PAGO', value: lastPayment || 'PENDIENTE' },
      {
        label: 'TIEMPO DESDE EL ÚLTIMO PAGO',
        value: history.semanasDesdeUltimoPagoCreditoGrupal == null
          ? 'PENDIENTE'
          : `${history.semanasDesdeUltimoPagoCreditoGrupal} SEMANAS`,
      },
    );
  }

  if (inactive) {
    items.push({
      label: 'MOTIVO DE NO RENOVACIÓN',
      value: pendingValue(history.motivoNoRenovacionCreditoGrupal),
    });
  }

  items.push({
    label: 'REVISAR EVIDENCIA',
    value: evidenceValue(history.fotografiasGuardadas, history.fotografiasPendientes),
    onPress: history.fotografiasGuardadas > 0 ? onVerEvidencias : undefined,
    actionIcon: history.fotografiasGuardadas > 0 ? 'camera' : undefined,
    actionFilled: history.fotografiasGuardadas > 0,
    actionIndicator: history.fotografiasGuardadas > 0
      ? promedioEvidencias == null ? '?' : String(promedioEvidencias)
      : undefined,
    actionIndicatorAccessibilityLabel: history.fotografiasGuardadas > 0
      ? promedioEvidencias == null
        ? 'Promedio pendiente: faltan fotografías por calificar'
        : `Promedio de calificación: ${promedioEvidencias} de 100`
      : undefined,
    actionIndicatorTone: tonoPromedioEvidencias,
    actionCompact: history.fotografiasGuardadas > 0,
    actionSegments: history.fotografiasGuardadas > 0
      ? [
        {
          value: String(history.fotografiasCalificadas.verdes),
          tone: 'positive',
          accessibilityLabel: `${history.fotografiasCalificadas.verdes} fotografías calificadas en verde`,
        },
        {
          value: String(history.fotografiasCalificadas.amarillas),
          tone: 'warning',
          accessibilityLabel: `${history.fotografiasCalificadas.amarillas} fotografías calificadas en amarillo`,
        },
        {
          value: String(history.fotografiasCalificadas.rojas),
          tone: 'negative',
          accessibilityLabel: `${history.fotografiasCalificadas.rojas} fotografías calificadas en rojo`,
        },
      ]
      : undefined,
    actionAccessibilityLabel: history.fotografiasGuardadas > 0
      ? `Revisar evidencia de otra financiera: ${history.fotografiasGuardadas} ${history.fotografiasGuardadas === 1 ? 'foto guardada' : 'fotos guardadas'}`
      : undefined,
  });

  return items;
};

export const ConclusionesResumen: React.FC<ConclusionesResumenProps> = ({
  ciclosIndividualesRegistrados,
  esNuevaConNosotros,
  sabeMontosCompaneras,
  acuerdoMontos,
  companerasMontoNoAcordadoIds,
  conoceTesoreraDelGrupo,
  quienEsTesorera,
  domicilioRecoleccion,
  integrantesGrupo,
  tieneHistorialCrelealtad,
  historialCrelealtad,
  historialOtraFinanciera,
  calificacionSemanaCredito = null,
  calificacionCiclosCredito = null,
  toleranciaSemanaDesembolso = null,
  concordanciaFicha = null,
  concordanciaPrestamo = null,
  calificacionPromedioEvidencias = null,
  onVerEvidenciasOtraFinanciera,
  fotografiasCasa = 0,
  fotografiasNegocio = 0,
  onVerFotografiasCasa,
  onVerFotografiasNegocio,
}) => {
  const nombresPorId = new Map(integrantesGrupo.map((item) => [item.id, item.nombre]));
  const cicloIndividual = obtenerPresentacionCicloIndividual(
    ciclosIndividualesRegistrados,
    esNuevaConNosotros,
  );

  const nombresDesacuerdo = companerasMontoNoAcordadoIds
    .map((id) => nombresPorId.get(id))
    .filter((nombre): nombre is string => Boolean(nombre));
  const detalleDesacuerdo = nombresDesacuerdo.length > 0
    ? nombresDesacuerdo.join(' · ')
    : 'Sin integrantes seleccionadas';
  const nombreTesorera = nombresPorId.get(quienEsTesorera);
  const nombreDomicilioRecoleccion = nombresPorId.get(domicilioRecoleccion);

  return (
    <View style={styles.container}>
      <View style={styles.historyRow}>
        <StatusBadge
          label={cicloIndividual.label}
          tone={cicloIndividual.tone}
        />
      </View>

      <SummaryStatusRow
        title={isYes(sabeMontosCompaneras)
          ? 'SÍ SABE CUÁNTO PIDIERON SUS COMPAÑERAS'
          : isNo(sabeMontosCompaneras)
            ? 'NO SABE CUÁNTO PIDIERON SUS COMPAÑERAS'
            : 'CONOCIMIENTO DE MONTOS SIN RESPUESTA'}
        tone={isYes(sabeMontosCompaneras)
          ? 'positive'
          : isNo(sabeMontosCompaneras)
            ? 'negative'
            : 'neutral'}
      />

      <SummaryStatusRow
        title={isYes(acuerdoMontos)
          ? 'ESTÁ DE ACUERDO CON LOS MONTOS'
          : isNo(acuerdoMontos)
            ? 'NO ESTÁ DE ACUERDO'
            : 'ACUERDO DE MONTOS SIN RESPUESTA'}
        detail={isNo(acuerdoMontos) ? detalleDesacuerdo : undefined}
        tone={isYes(acuerdoMontos)
          ? 'positive'
          : isNo(acuerdoMontos)
            ? 'negative'
            : 'neutral'}
      />

      <SummaryStatusRow
        title={isYes(conoceTesoreraDelGrupo)
          ? 'SÍ CONOCE A LA TESORERA'
          : isNo(conoceTesoreraDelGrupo)
            ? 'NO CONOCE A LA TESORERA'
            : 'CONOCIMIENTO DE TESORERA SIN RESPUESTA'}
        detail={isYes(conoceTesoreraDelGrupo) ? nombreTesorera : undefined}
        tone={isYes(conoceTesoreraDelGrupo)
          ? 'positive'
          : isNo(conoceTesoreraDelGrupo)
            ? 'negative'
            : 'neutral'}
      />

      <SummaryStatusRow
        title={domicilioRecoleccion === NO_SABE_DOMICILIO_RECOLECCION_VALUE
          ? NO_SABE_DOMICILIO_RECOLECCION_LABEL
          : domicilioRecoleccion
            ? 'SÍ SABE DÓNDE SE RECOLECTARÁ'
            : 'DOMICILIO DE RECOLECCIÓN SIN RESPUESTA'}
        detail={domicilioRecoleccion
          && domicilioRecoleccion !== NO_SABE_DOMICILIO_RECOLECCION_VALUE
          ? nombreDomicilioRecoleccion
          : undefined}
        tone={domicilioRecoleccion === NO_SABE_DOMICILIO_RECOLECCION_VALUE
          ? 'negative'
          : domicilioRecoleccion
            ? 'positive'
            : 'neutral'}
      />

      <View style={styles.sectionHeader}>
        <StickySectionHeader
          title="HISTORIAL CRELEALTAD"
          moduleTheme="verification"
          fullBleed
        />
      </View>

      {historialCrelealtad ? (
        <CreditHistorySummary
          totalCycles={historialCrelealtad.totalCycles}
          maximum={historialCrelealtad.maximum}
          minimum={historialCrelealtad.minimum}
          recentCycles={historialCrelealtad.recentCycles}
        />
      ) : tieneHistorialCrelealtad === false ? (
        <SummaryStatusRow title="SIN HISTORIAL" tone="negative" />
      ) : (
        <SummaryStatusRow title="HISTORIAL CRELEALTAD NO DISPONIBLE" tone="neutral" />
      )}

      <View style={styles.sectionHeader}>
        <StickySectionHeader
          title="HISTORIAL OTRAS FINANCIERAS"
          moduleTheme="verification"
          fullBleed
        />
      </View>

      {isYes(historialOtraFinanciera.tieneOtroCreditoGrupal) ? (
        <SummaryDetailsCard
          items={otherFinancialHistoryItems(
            historialOtraFinanciera,
            calificacionSemanaCredito,
            calificacionCiclosCredito,
            toleranciaSemanaDesembolso,
            concordanciaFicha,
            concordanciaPrestamo,
            calificacionPromedioEvidencias,
            onVerEvidenciasOtraFinanciera,
          )}
          moduleTheme="verification"
        />
      ) : isNo(historialOtraFinanciera.tieneOtroCreditoGrupal) ? (
        <SummaryStatusRow
          title="SIN HISTORIAL EN OTRAS FINANCIERAS"
          tone="negative"
        />
      ) : (
        <SummaryStatusRow
          title="HISTORIAL DE OTRAS FINANCIERAS SIN RESPUESTA"
          tone="neutral"
        />
      )}

      <View style={styles.sectionHeader}>
        <StickySectionHeader
          title="FOTOGRAFÍAS"
          moduleTheme="verification"
          fullBleed
        />
      </View>

      <View style={styles.photoButtons}>
        <PrimaryButton
          title="Casa"
          moduleTheme="verification"
          leadingIcon={(
            <FontAwesome
              testID="conclusiones-fotografias-casa-icon"
              name="home"
              size={iconSizes.action}
              color={moduleThemes.verification.primaryText}
            />
          )}
          disabled={fotografiasCasa <= 0 || !onVerFotografiasCasa}
          accessibilityLabel={`Abrir fotografías de casa. ${fotografiasCasa} ${fotografiasCasa === 1 ? 'fotografía disponible' : 'fotografías disponibles'}`}
          onPress={onVerFotografiasCasa}
        />
        <PrimaryButton
          title="Negocio"
          moduleTheme="verification"
          leadingIcon={(
            <FontAwesome
              testID="conclusiones-fotografias-negocio-icon"
              name="briefcase"
              size={iconSizes.action}
              color={moduleThemes.verification.primaryText}
            />
          )}
          disabled={fotografiasNegocio <= 0 || !onVerFotografiasNegocio}
          accessibilityLabel={`Abrir fotografías de negocio. ${fotografiasNegocio} ${fotografiasNegocio === 1 ? 'fotografía disponible' : 'fotografías disponibles'}`}
          onPress={onVerFotografiasNegocio}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  historyRow: {
    minHeight: spacing.xxl,
    justifyContent: 'center',
  },
  sectionHeader: {
    marginTop: spacing.sm,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
});
