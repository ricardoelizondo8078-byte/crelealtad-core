import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TaskMenuButton } from '../../components/ui';
import { colors, spacing, typography } from '../../theme/tokens';

export type VerificationProcessKey =
  | 'documentos'
  | 'llamada-integrante'
  | 'visita-vecino'
  | 'foto-domicilio'
  | 'validacion-integrante'
  | 'observaciones';

interface VerificationProcessMenuProps {
  onSelect: (process: VerificationProcessKey) => void;
  llamadaCompletada?: boolean;
  imagenesDomicilioCompletadas?: boolean;
  visitaVecinoResultado?: 'si' | 'no' | null;
}

const PROCESSES: ReadonlyArray<{
  key: VerificationProcessKey;
  title: string;
  iconLabel: string;
  accessibilityHint: string;
  disabled?: boolean;
}> = [
  {
    key: 'documentos',
    title: 'Documentos',
    iconLabel: '📄',
    accessibilityHint: 'Abre los documentos revisados para consultar nuevamente sus imágenes',
  },
  {
    key: 'llamada-integrante',
    title: 'Llamada',
    iconLabel: '📞',
    accessibilityHint: 'Abre el proceso de llamada a la integrante',
  },
  {
    key: 'visita-vecino',
    title: 'Visita al vecino',
    iconLabel: '🏘️',
    accessibilityHint: 'Abre el proceso de visita al vecino',
  },
  {
    key: 'foto-domicilio',
    title: 'Imágenes del domicilio',
    iconLabel: '📷',
    accessibilityHint: 'Abre la captura de imágenes del domicilio',
  },
  {
    key: 'validacion-integrante',
    title: 'Entrevista',
    iconLabel: '💬',
    accessibilityHint: 'Abre la entrevista de verificación',
  },
  {
    key: 'observaciones',
    title: 'Conclusiones',
    iconLabel: '$',
    accessibilityHint: 'Conclusiones todavía no está disponible',
    disabled: true,
  },
];

export const VerificationProcessMenu: React.FC<VerificationProcessMenuProps> = ({
  onSelect,
  llamadaCompletada = false,
  imagenesDomicilioCompletadas = false,
  visitaVecinoResultado = null,
}) => (
  <View style={styles.container}>
    <Text allowFontScaling={false} style={styles.title}>
      Documentos y procesos
    </Text>
    <Text allowFontScaling={false} style={styles.helper}>
      Consulta los documentos, realiza los procesos o registra las conclusiones.
    </Text>

    <View style={styles.actions}>
      {PROCESSES.map((process) => (
        <TaskMenuButton
          key={process.key}
          title={process.title}
          iconLabel={process.iconLabel}
          moduleTheme="verification"
          disabled={process.disabled}
          completed={
            process.key === 'documentos'
            || (process.key === 'llamada-integrante' && llamadaCompletada)
            || (process.key === 'foto-domicilio' && imagenesDomicilioCompletadas)
          }
          result={
            process.key === 'visita-vecino' && visitaVecinoResultado
              ? visitaVecinoResultado === 'si'
                ? 'positive'
                : 'negative'
              : undefined
          }
          accessibilityHint={process.accessibilityHint}
          onPress={() => onSelect(process.key)}
        />
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
  helper: {
    ...typography.body,
    color: colors.textSecondary,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
