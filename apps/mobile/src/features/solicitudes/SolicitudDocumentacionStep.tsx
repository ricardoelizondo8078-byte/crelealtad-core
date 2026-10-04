import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, moduleThemes, radius, spacing } from '../../theme/tokens';
import type { DocumentoRequerido } from './solicitud-documentos';

interface SolicitudDocumentacionStepProps {
  documentos: DocumentoRequerido[];
  openingDocId: string | null;
  uploadingDocId: string | null;
  onView: (documento: DocumentoRequerido) => void;
  onUpload: (documentoId: string) => void;
}

const ESTADOS_PENDIENTES = ['PENDIENTE', 'PENDIENTE_SUBIR', 'SUBIENDO', 'ERROR'];

export const SolicitudDocumentacionStep: React.FC<SolicitudDocumentacionStepProps> = ({
  documentos,
  openingDocId,
  uploadingDocId,
  onView,
  onUpload,
}) => (
  <>
    <View style={styles.header}>
      <Text allowFontScaling={false} style={styles.title}>Documentos Requeridos</Text>
      <Text allowFontScaling={false} style={styles.subtitle}>
        Debes cargar los 3 documentos obligatorios para continuar
      </Text>
    </View>

    <View style={styles.syncNotice}>
      <Text allowFontScaling={false} style={styles.syncNoticeIcon}>☁️</Text>
      <View style={styles.syncNoticeText}>
        <Text allowFontScaling={false} style={styles.syncNoticeTitle}>
          Resguardo confirmado
        </Text>
        <Text allowFontScaling={false} style={styles.syncNoticeBody}>
          Cada documento cambia a Sincronizado únicamente cuando CRELEALTAD confirma la carga.
        </Text>
      </View>
    </View>

    {documentos.map((documento) => {
      const pendiente = ESTADOS_PENDIENTES.includes(documento.status);
      const ocupado = openingDocId !== null || uploadingDocId !== null;

      return (
        <View key={documento.id} style={styles.documentRow}>
          <View style={styles.documentInfo}>
            <Text allowFontScaling={false} style={styles.documentName}>
              {documento.nombre}
            </Text>
            <View
              style={[
                styles.statusBadge,
                documento.status === 'SINCRONIZADO' && styles.statusBadgeLoaded,
                pendiente && styles.statusBadgePending,
                documento.status === 'OPCIONAL' && styles.statusBadgeOptional,
              ]}
            >
              <Text
                allowFontScaling={false}
                style={[
                  styles.statusBadgeText,
                  documento.status === 'SINCRONIZADO' && styles.statusBadgeTextLoaded,
                  pendiente && styles.statusBadgeTextPending,
                  documento.status === 'OPCIONAL' && styles.statusBadgeTextOptional,
                ]}
              >
                {documento.status === 'PENDIENTE_SUBIR'
                  ? 'PENDIENTE DE SUBIR'
                  : documento.status === 'SINCRONIZADO'
                    ? 'SINCRONIZADO'
                    : documento.status}
              </Text>
            </View>
          </View>
          <View style={styles.actions}>
            {(documento.urisLocales?.length || documento.uriFrente || documento.rutaServidor) && (
              <TouchableOpacity
                style={[styles.viewButton, ocupado && styles.disabledButton]}
                activeOpacity={0.7}
                disabled={ocupado}
                onPress={() => onView(documento)}
              >
                {openingDocId === documento.id ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text allowFontScaling={false} style={styles.viewButtonText}>👁️ Ver</Text>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.uploadButton,
                ocupado && styles.disabledButton,
                documento.status === 'SINCRONIZADO' && styles.loadedButton,
              ]}
              activeOpacity={0.7}
              disabled={ocupado}
              onPress={() => onUpload(documento.id)}
            >
              {uploadingDocId === documento.id ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text allowFontScaling={false} style={styles.uploadButtonText}>
                  {documento.status === 'SINCRONIZADO'
                    ? 'Actualizar'
                    : documento.status === 'ERROR'
                      ? 'Elegir de nuevo'
                      : documento.status === 'PENDIENTE_SUBIR'
                        ? 'Reintentar'
                        : 'Subir'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    })}

    <View style={styles.footer}>
      <Text allowFontScaling={false} style={styles.footerText}>
        * INE Beneficiario y Comprobante Línea de Crédito son opcionales. En el
        comprobante puedes seleccionar todas las fotos necesarias.
      </Text>
    </View>
  </>
);

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  syncNotice: {
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
    padding: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  syncNoticeIcon: {
    fontSize: 24,
    marginTop: 2,
  },
  syncNoticeText: {
    flex: 1,
  },
  syncNoticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#856404',
    marginBottom: spacing.xs,
  },
  syncNoticeBody: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
  },
  documentInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  documentName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgePending: {
    backgroundColor: '#E5E7EB',
  },
  statusBadgeLoaded: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeOptional: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusBadgeTextPending: {
    color: '#6B7280',
  },
  statusBadgeTextLoaded: {
    color: '#059669',
  },
  statusBadgeTextOptional: {
    color: '#D97706',
  },
  uploadButton: {
    backgroundColor: moduleThemes.documentation.headerBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    opacity: 0.7,
  },
  loadedButton: {
    backgroundColor: '#059669',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  viewButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    minWidth: 70,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
