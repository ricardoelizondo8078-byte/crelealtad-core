import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppHeader, Card, PrimaryButton, ScreenContainer, ScreenTitleBar } from '../../components/ui';
import { apiUrl } from '../../config/api';
import { colors, radius, spacing, typography } from '../../theme/tokens';

type DocumentoClave =
  | 'solicitud_fisica'
  | 'ine'
  | 'comprobante_domicilio'
  | 'comprobante_credito_externo';

type DocumentoEstado = 'Pendiente' | 'Capturado';

interface DocumentoItem {
  id: string;
  clave: DocumentoClave;
  nombre: string;
  requerido: boolean;
  estado: DocumentoEstado;
}

interface DocumentosScreenProps {
  solicitanteId: string;
  onSaved?: () => void;
  onBack?: () => void;
}

export const DocumentosScreen: React.FC<DocumentosScreenProps> = ({ solicitanteId, onSaved, onBack }) => {
  const [documentos, setDocumentos] = useState<DocumentoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocumentos = async () => {
    try {
      const response = await fetch(apiUrl(`/documentos/solicitante/${solicitanteId}`));
      if (!response.ok) {
        throw new Error('Failed to load documentos');
      }

      const data = await response.json();
      setDocumentos(data);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocumentos();
  }, [solicitanteId]);

  const handleToggle = async (documento: DocumentoItem) => {
    const nextEstado: DocumentoEstado = documento.estado === 'Pendiente' ? 'Capturado' : 'Pendiente';

    try {
      const response = await fetch(apiUrl(`/documentos/solicitante/${solicitanteId}/${documento.clave}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nextEstado }),
      });

      if (!response.ok) {
        throw new Error('Failed to update documento');
      }

      await loadDocumentos();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unexpected error');
    }
  };

  return (
    <ScreenContainer>
      <AppHeader showBackButton onBackPress={onBack} moduleTheme="documentation" />
      <ScreenTitleBar title="Documentos" moduleTheme="documentation" />
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : (
        <View style={styles.content}>
          <Text style={styles.subtitle}>Toca cada documento para alternar entre Pendiente y Capturado.</Text>
          {documentos.map((documento) => (
            <Pressable key={documento.id} style={styles.cardPressable} onPress={() => handleToggle(documento)}>
              <Card>
                <View style={styles.cardHeader}>
                  <Text style={styles.name}>{documento.nombre}</Text>
                  <View style={[styles.badge, documento.estado === 'Capturado' ? styles.badgeCaptured : styles.badgePending]}>
                    <Text style={styles.badgeText}>{documento.estado}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>{documento.requerido ? 'Requerido' : 'Opcional'}</Text>
              </Card>
            </Pressable>
          ))}

          <PrimaryButton title="Volver al expediente" onPress={onSaved} moduleTheme="documentation" />
        </View>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xl },
  content: { padding: spacing.lg, gap: spacing.md },
  subtitle: { color: colors.textSecondary, marginBottom: spacing.xs, ...typography.body },
  cardPressable: { marginBottom: spacing.xs },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  name: { flex: 1, ...typography.bodyStrong, color: colors.textPrimary },
  meta: { marginTop: spacing.sm, color: colors.textSecondary, ...typography.body },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeCaptured: { backgroundColor: colors.successSoft },
  badgePending: { backgroundColor: colors.dangerSoft },
  badgeText: { color: colors.textPrimary, ...typography.caption, fontWeight: '700' },
});