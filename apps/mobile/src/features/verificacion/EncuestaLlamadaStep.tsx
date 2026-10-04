import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import {
  Card,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
  SingleSelectOption,
  StatusCard,
  YesNoField,
  YesNoValue,
} from '../../components/ui';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import {
  CARACTERISTICAS_DOMICILIO,
  contactoInicialTieneTodasLasRespuestas,
  contactoInicialTieneResultadoPendienteDeDefinir,
  RespuestasContactoInicial,
} from './ContactoInicialStep';

export const ACCIONES_POSTERIORES_LLAMADA = [
  { value: 'agendo-visita', label: 'Agendó visita' },
  { value: 'entrevista-corta', label: 'Entrevista corta' },
  { value: 'entrevista-larga', label: 'Entrevista larga' },
  { value: 'llamar-mas-tarde', label: 'Llamar más tarde' },
] as const;

export type AccionPosteriorLlamada = (typeof ACCIONES_POSTERIORES_LLAMADA)[number]['value'];

interface EncuestaLlamadaStepProps {
  nombreGrupo: string;
  nombreRegistrado: string;
  domicilioRegistrado: string;
  respuestas: RespuestasContactoInicial;
  accionPosterior: AccionPosteriorLlamada | null;
  evidenciaUri: string | null;
  guardando: boolean;
  onRespuestasChange: (respuestas: RespuestasContactoInicial) => void;
  onAccionPosteriorChange: (accion: AccionPosteriorLlamada) => void;
  onSeleccionarEvidencia: () => void;
  onContinuar: () => void;
}

export const EncuestaLlamadaStep: React.FC<EncuestaLlamadaStepProps> = ({
  nombreGrupo,
  nombreRegistrado,
  domicilioRegistrado,
  respuestas,
  accionPosterior,
  evidenciaUri,
  guardando,
  onRespuestasChange,
  onAccionPosteriorChange,
  onSeleccionarEvidencia,
  onContinuar,
}) => {
  const tieneResultadoPendiente = contactoInicialTieneResultadoPendienteDeDefinir(respuestas);
  const preguntasCompletas = contactoInicialTieneTodasLasRespuestas(respuestas)
    && Boolean(accionPosterior);
  const puedeContinuar = Boolean(accionPosterior)
    && preguntasCompletas
    && Boolean(evidenciaUri)
    && !guardando;

  const updateCaracteristica = (
    key: (typeof CARACTERISTICAS_DOMICILIO)[number]['key'],
    value: Exclude<YesNoValue, null>,
  ) => {
    onRespuestasChange({
      ...respuestas,
      caracteristicasDomicilio: {
        ...respuestas.caracteristicasDomicilio,
        [key]: value,
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SectionTitle title="Encuesta de llamada" />
        <Text allowFontScaling={false} style={styles.helper}>
          Registra la información confirmada durante la llamada.
        </Text>
      </View>

      <Card style={styles.questionCard}>
        <SectionTitle title="1. Confirmación de identidad" />
        <YesNoField
          label="¿Con quién tengo el gusto?"
          registeredLabel="Integrante registrada"
          registeredValue={nombreRegistrado}
          value={respuestas.identidadCoincide}
          yesLabel="Sí coincide"
          noLabel="No coincide"
          moduleTheme="verification"
          onChange={(value) => onRespuestasChange({
            ...respuestas,
            identidadCoincide: value,
          })}
        />
      </Card>

      <Card moduleTheme="verification" variant="accent">
        <Text allowFontScaling={false} style={styles.creditIntroduction}>
          “HABLAMOS DE CRELEALTAD, RESPECTO AL CRÉDITO GRUPAL QUE ESTÁ SOLICITANDO CON EL GRUPO{' '}
          {nombreGrupo.trim().toUpperCase()}”
        </Text>
      </Card>

      <Card style={styles.questionCard}>
        <SectionTitle title="2. Confirmación de domicilio" />
        <YesNoField
          label="¿Me puede proporcionar su domicilio?"
          registeredLabel="Domicilio registrado"
          registeredValue={domicilioRegistrado}
          value={respuestas.domicilioCoincide}
          yesLabel="Sí coincide"
          noLabel="No coincide"
          moduleTheme="verification"
          onChange={(value) => onRespuestasChange({
            ...respuestas,
            domicilioCoincide: value,
          })}
        />
      </Card>

      <Card style={styles.questionCard}>
        <SectionTitle title="3. Características del domicilio" />
        <Text allowFontScaling={false} style={styles.questionPrompt}>
          ¿Me puede describir su domicilio para identificarlo?
        </Text>
        <Text allowFontScaling={false} style={styles.helper}>
          Marca si coincide cada característica mencionada durante la llamada.
        </Text>

        <View style={styles.characteristics}>
          {CARACTERISTICAS_DOMICILIO.map(({ key, label }) => (
            <YesNoField
              key={key}
              label={label}
              value={respuestas.caracteristicasDomicilio[key]}
              yesLabel="Coincide"
              noLabel="No coincide"
              moduleTheme="verification"
              onChange={(value) => updateCaracteristica(key, value)}
            />
          ))}
        </View>
      </Card>

      {tieneResultadoPendiente ? (
        <StatusCard compact narrowStripe status="verificationObservations">
          <Text allowFontScaling={false} style={styles.resultTitle}>
            Esta llamada requiere revisión
          </Text>
          <Text allowFontScaling={false} style={styles.resultDescription}>
            Hay información que no coincide con los datos registrados.
            Este resultado no avanzará hasta que se defina la acción correspondiente.
          </Text>
        </StatusCard>
      ) : null}

      <Card style={styles.questionCard}>
        <SectionTitle title="4. ¿Qué se realizará ahora?" />
        <Text allowFontScaling={false} style={styles.helper}>
          Selecciona una sola opción para continuar con esta llamada.
        </Text>
        <View accessibilityRole="radiogroup" style={styles.nextActionOptions}>
          {ACCIONES_POSTERIORES_LLAMADA.map((option) => (
            <SingleSelectOption
              key={option.value}
              label={option.label}
              selected={accionPosterior === option.value}
              onPress={() => onAccionPosteriorChange(option.value)}
            />
          ))}
        </View>
      </Card>

      <Card style={styles.questionCard}>
        <SectionTitle title="Evidencia de la llamada" />
        <Text allowFontScaling={false} style={styles.helper}>
          Al terminar las cuatro preguntas, selecciona de la galería una fotografía de la pantalla del celular.
        </Text>
        {evidenciaUri ? (
          <Image
            accessibilityLabel="Vista previa de la evidencia de llamada"
            source={{ uri: evidenciaUri }}
            resizeMode="contain"
            style={styles.evidencePreview}
          />
        ) : null}
        <View style={styles.evidenceAction}>
          <SecondaryButton
            title={evidenciaUri ? 'Cambiar fotografía' : 'Elegir de la galería'}
            moduleTheme="verification"
            disabled={guardando || !preguntasCompletas}
            onPress={onSeleccionarEvidencia}
          />
        </View>
        <View style={styles.continueAction}>
          <PrimaryButton
            title={guardando ? 'Guardando…' : 'Guardar llamada'}
            moduleTheme="verification"
            disabled={!puedeContinuar}
            onPress={onContinuar}
          />
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
  helper: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  questionCard: {
    gap: spacing.md,
  },
  questionPrompt: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  creditIntroduction: {
    ...typography.title,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  characteristics: {
    gap: spacing.sm,
  },
  nextActionOptions: {
    gap: spacing.sm,
  },
  continueAction: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  evidenceAction: {
    flexDirection: 'row',
  },
  evidencePreview: {
    width: '100%',
    height: 220,
    borderRadius: radius.md,
    backgroundColor: colors.background,
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
