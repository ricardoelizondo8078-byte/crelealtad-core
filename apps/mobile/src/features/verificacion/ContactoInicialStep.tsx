import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  SecondaryButton,
  StatusCard,
  YesNoValue,
} from '../../components/ui';
import {
  colors,
  iconSizes,
  radius,
  spacing,
  touchTargets,
  typography,
} from '../../theme/tokens';
import { ConteoLlamadasVerificacion, ResumenLlamadasVerificacion } from './verificacion-llamadas.api';

export type ResultadoLlamada = 'si-contesto' | 'no-contesto' | null;

export const CARACTERISTICAS_DOMICILIO = [
  { key: 'numeroPlantas', label: 'Número de plantas' },
  { key: 'colorDomicilio', label: 'Color del domicilio' },
  { key: 'cocheraEntrada', label: 'Cochera o entrada' },
  { key: 'banquetaFrente', label: 'Banqueta o frente' },
  { key: 'objetoVisible', label: 'Bote de basura u objeto visible' },
  { key: 'referenciaExterior', label: 'Vehículo u otra referencia exterior' },
] as const;

type CaracteristicaDomicilioKey = (typeof CARACTERISTICAS_DOMICILIO)[number]['key'];

export interface RespuestasContactoInicial {
  identidadCoincide: YesNoValue;
  domicilioCoincide: YesNoValue;
  caracteristicasDomicilio: Record<CaracteristicaDomicilioKey, YesNoValue>;
}

export const createEmptyRespuestasContactoInicial = (): RespuestasContactoInicial => ({
  identidadCoincide: null,
  domicilioCoincide: null,
  caracteristicasDomicilio: {
    numeroPlantas: null,
    colorDomicilio: null,
    cocheraEntrada: null,
    banquetaFrente: null,
    objetoVisible: null,
    referenciaExterior: null,
  },
});

const respuestasPlenas = (respuestas: RespuestasContactoInicial): YesNoValue[] => [
  respuestas.identidadCoincide,
  respuestas.domicilioCoincide,
  ...CARACTERISTICAS_DOMICILIO.map(
    ({ key }) => respuestas.caracteristicasDomicilio[key],
  ),
];

export const contactoInicialTieneTodasLasRespuestas = (
  respuestas: RespuestasContactoInicial,
): boolean => respuestasPlenas(respuestas).every((respuesta) => respuesta !== null);

export const contactoInicialTieneResultadoPendienteDeDefinir = (
  respuestas: RespuestasContactoInicial,
): boolean => respuestasPlenas(respuestas).some((respuesta) => respuesta === 'no');

export const contactoInicialPermiteAvanzar = (
  resultado: ResultadoLlamada,
  respuestas: RespuestasContactoInicial,
): boolean => {
  if (resultado === 'no-contesto') {
    return true;
  }

  return resultado === 'si-contesto'
    && contactoInicialTieneTodasLasRespuestas(respuestas)
    && !contactoInicialTieneResultadoPendienteDeDefinir(respuestas);
};

interface ContactoInicialStepProps {
  resumenLlamadas: ResumenLlamadasVerificacion | null;
  errorResumenLlamadas: boolean;
  onRealizarLlamada: () => void;
  onRealizarLlamadaWhatsApp: () => void;
}

export const ContactoInicialStep: React.FC<ContactoInicialStepProps> = ({
  resumenLlamadas,
  errorResumenLlamadas,
  onRealizarLlamada,
  onRealizarLlamadaWhatsApp,
}) => {
  const llamadasTelefonicasRegistradas = resumenLlamadas
    ? resumenLlamadas.telefonica.no_contestadas + resumenLlamadas.telefonica.contestadas
    : 0;
  const whatsappHabilitado = resumenLlamadas !== null
    && llamadasTelefonicasRegistradas > 0;

  const renderConteos = (conteos: ConteoLlamadasVerificacion | undefined) => (
    <View accessible={false} style={styles.callCounts}>
      <Text allowFontScaling={false} style={[styles.callCount, styles.callCountMissed]}>
        ({conteos?.no_contestadas ?? '—'})
      </Text>
      <Text allowFontScaling={false} style={[styles.callCount, styles.callCountAnswered]}>
        ({conteos?.contestadas ?? '—'})
      </Text>
    </View>
  );

  const getAccessibilityLabel = (
    titulo: string,
    conteos: ConteoLlamadasVerificacion | undefined,
  ) => conteos
    ? `${titulo}. ${conteos.no_contestadas} no contestadas, ${conteos.contestadas} contestadas`
    : `${titulo}. Conteos no disponibles`;

  return (
    <View style={styles.container}>
      <Text allowFontScaling={false} style={styles.callLegend}>
        Conteo: <Text style={styles.legendMissed}>No contestó</Text>
        {'  ·  '}
        <Text style={styles.legendAnswered}>Sí contestó</Text>
      </Text>
      <View style={styles.callActions}>
        <View style={styles.callAction}>
          <SecondaryButton
            title="Llamada por teléfono"
            moduleTheme="verification"
            size="large"
            contentLayout="columns"
            leadingIcon={(
              <View style={styles.phoneIconCircle}>
                <FontAwesome
                  name="phone"
                  size={iconSizes.largeAction}
                  color={colors.white}
                  accessible={false}
                />
              </View>
            )}
            trailingContent={renderConteos(resumenLlamadas?.telefonica)}
            accessibilityLabel={getAccessibilityLabel(
              'Llamada por teléfono',
              resumenLlamadas?.telefonica,
            )}
            onPress={onRealizarLlamada}
          />
        </View>
        <View style={styles.callAction}>
          <SecondaryButton
            title="Llamada por WhatsApp"
            moduleTheme="verification"
            size="large"
            contentLayout="columns"
            leadingIcon={(
              <View style={styles.whatsAppIconCircle}>
                <FontAwesome
                  name="whatsapp"
                  size={iconSizes.largeAction}
                  color={colors.white}
                  accessible={false}
                />
              </View>
            )}
            trailingContent={renderConteos(resumenLlamadas?.whatsapp)}
            accessibilityLabel={getAccessibilityLabel(
              whatsappHabilitado
                ? 'Llamada por WhatsApp'
                : 'Llamada por WhatsApp. Disponible después de registrar una llamada por teléfono',
              resumenLlamadas?.whatsapp,
            )}
            disabled={!whatsappHabilitado}
            onPress={onRealizarLlamadaWhatsApp}
          />
        </View>
        {resumenLlamadas && !whatsappHabilitado ? (
          <Text allowFontScaling={false} style={styles.whatsAppRequirement}>
            WhatsApp estará disponible después de registrar la primera llamada por teléfono.
          </Text>
        ) : null}
      </View>

      {errorResumenLlamadas ? (
        <StatusCard compact narrowStripe status="verificationObservations">
          <Text allowFontScaling={false} style={styles.resultTitle}>
            No se pudo consultar el historial de llamadas
          </Text>
          <Text allowFontScaling={false} style={styles.resultDescription}>
            Revisa tu conexión e intenta nuevamente.
          </Text>
        </StatusCard>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  callActions: {
    gap: spacing.md,
  },
  callAction: {
    flexDirection: 'row',
  },
  callLegend: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  legendMissed: {
    ...typography.captionStrong,
    color: colors.danger,
  },
  legendAnswered: {
    ...typography.captionStrong,
    color: colors.primary,
  },
  callCounts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  phoneIconCircle: {
    width: touchTargets.minimum,
    height: touchTargets.minimum,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning,
  },
  whatsAppIconCircle: {
    width: touchTargets.minimum,
    height: touchTargets.minimum,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.whatsapp,
  },
  whatsAppRequirement: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: -spacing.xs,
    paddingHorizontal: spacing.md,
  },
  callCount: {
    ...typography.bodyStrong,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    overflow: 'hidden',
  },
  callCountMissed: {
    color: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  callCountAnswered: {
    color: colors.primary,
    backgroundColor: colors.successSoft,
  },
  resultTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  resultDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
