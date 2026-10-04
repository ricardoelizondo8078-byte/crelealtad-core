import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Card, SectionTitle } from '../../components/ui';
import {
  colors,
  moduleThemes,
  radius,
  spacing,
  typography,
} from '../../theme/tokens';
import type { DocumentoItem } from './verificacion-individual.types';

interface DocumentosRevisionSectionProps {
  documentos: DocumentoItem[];
  consultando: boolean;
  todosObligatoriosRevisados: boolean;
  onSelect: (documento: DocumentoItem) => void;
}

export const DocumentosRevisionSection: React.FC<DocumentosRevisionSectionProps> = ({
  documentos,
  consultando,
  todosObligatoriosRevisados,
  onSelect,
}) => {
  const faltaObligatorio = documentos.some(
    (documento) => documento.obligatorioRevision && documento.estado === 'Pendiente',
  );
  const hayRechazado = documentos.some(
    (documento) => documento.obligatorioRevision && documento.validacion === 'no',
  );

  return (
    <Card style={styles.card}>
      <SectionTitle title="Documentos del Asesor" />
      <Text allowFontScaling={false} style={styles.helpText}>
        {consultando
          ? 'Consulta las imágenes que el asesor cargó en Documentación.'
          : 'Revisa los documentos capturados por el asesor'}
      </Text>

      <View style={styles.documentList}>
        {documentos
          .filter((documento) => consultando || documento.obligatorioRevision)
          .map((documento) => (
            <Pressable
              key={documento.clave}
              style={[
                styles.documentItem,
                documento.estado === 'Pendiente' && styles.documentItemPending,
              ]}
              onPress={() => onSelect(documento)}
              disabled={documento.estado === 'Pendiente'}
            >
              <Text allowFontScaling={false} style={styles.documentIcon}>
                {documento.icono}
              </Text>
              <View style={styles.documentInfo}>
                <Text allowFontScaling={false} style={styles.documentLabel}>
                  {documento.nombre}
                </Text>
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.documentStatus,
                    documento.estado === 'Capturado' ? styles.captured : styles.pending,
                  ]}
                >
                  {!documento.obligatorioRevision && consultando
                    ? `OPCIONAL · ${documento.estado}`
                    : documento.estado}
                </Text>
              </View>
              <View style={styles.documentActionContainer}>
                {documento.estado === 'Capturado' && documento.validacion && (
                  <View
                    style={[
                      styles.validationBadge,
                      documento.validacion === 'si'
                        ? styles.validationBadgeYes
                        : styles.validationBadgeNo,
                    ]}
                  >
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.validationBadgeText,
                        { color: documento.validacion === 'si' ? colors.success : colors.error },
                      ]}
                    >
                      {documento.validacion === 'si' ? '✓' : '✗'}
                    </Text>
                  </View>
                )}
                {documento.estado === 'Capturado' ? (
                  <Text allowFontScaling={false} style={styles.documentAction}>Ver →</Text>
                ) : (
                  <Text allowFontScaling={false} style={styles.documentActionDisabled}>—</Text>
                )}
              </View>
            </Pressable>
          ))}
      </View>

      {!consultando && faltaObligatorio && (
        <View style={styles.warningBox}>
          <Text allowFontScaling={false} style={styles.warningIcon}>⚠️</Text>
          <Text allowFontScaling={false} style={styles.warningText}>
            Faltan documentos. Solicita revisar la documentación para que el asesor los complete.
          </Text>
        </View>
      )}

      {!consultando && hayRechazado && (
        <View style={styles.warningBox}>
          <Text allowFontScaling={false} style={styles.warningIcon}>⚠️</Text>
          <Text allowFontScaling={false} style={styles.warningText}>
            {todosObligatoriosRevisados
              ? 'Un documento no coincide. Solicita revisar la documentación para que el asesor lo corrija.'
              : 'Un documento no coincide. Termina de revisar los tres documentos obligatorios antes de solicitar la corrección.'}
          </Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  helpText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  documentList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.gray[900],
    gap: spacing.md,
  },
  documentItemPending: {
    backgroundColor: colors.gray[50],
    borderColor: colors.gray[300],
    opacity: 0.6,
  },
  documentIcon: {
    fontSize: 32,
  },
  documentInfo: {
    flex: 1,
  },
  documentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  documentStatus: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  captured: {
    color: colors.success,
  },
  pending: {
    color: colors.gray[400],
  },
  documentActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  documentAction: {
    fontSize: 16,
    fontWeight: '700',
    color: moduleThemes.verification.headerBg,
  },
  documentActionDisabled: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[300],
  },
  validationBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  validationBadgeYes: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  validationBadgeNo: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.error,
  },
  validationBadgeText: {
    fontSize: 18,
    fontWeight: '700',
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
  warningIcon: {
    fontSize: 24,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[800],
  },
});
