import React from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { Card, PrimaryButton, SecondaryButton } from '../../../../components/ui';
import { SolicitudFormData, DocumentoRequerido } from '../../types/solicitud.types';
import { spacing, colors } from '../../../../theme/tokens';
import * as ImagePicker from 'expo-image-picker';

interface Step7Props {
  data: SolicitudFormData;
  documentos: DocumentoRequerido[];
  onBack: () => void;
  onSubmit: () => void;
  updateDocument: (docId: string, updates: Partial<DocumentoRequerido>) => void;
  scrollViewRef: any;
}

export const Step7Documentos: React.FC<Step7Props> = ({ documentos, onBack, onSubmit, updateDocument, scrollViewRef }) => {
  const handleCapture = async (docId: string) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso Denegado', 'Se requiere acceso a la cámara');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      updateDocument(docId, { status: 'CARGADO', uriFrente: result.assets[0].uri });
    }
  };

  const canSubmit = documentos.filter(d => d.obligatorio && d.status === 'PENDIENTE').length === 0;

  return (
    <ScrollView ref={scrollViewRef} style={styles.container}>
      <Card style={styles.card}>
        {documentos.map((doc) => (
          <View key={doc.id} style={styles.docItem}>
            <View style={styles.docInfo}>
              <Text style={styles.docName}>{doc.nombre}</Text>
              <Text style={[styles.docStatus, doc.status === 'CARGADO' && styles.docStatusOk]}>
                {doc.status === 'CARGADO' ? '✓ Cargado' : doc.obligatorio ? 'Obligatorio' : 'Opcional'}
              </Text>
            </View>
            <TouchableOpacity style={styles.captureButton} onPress={() => handleCapture(doc.id)}>
              <Text style={styles.captureText}>{doc.status === 'CARGADO' ? 'Recapturar' : 'Capturar'}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </Card>

      <View style={styles.footer}>
        <SecondaryButton title="Anterior" onPress={onBack} style={{ marginBottom: spacing.sm }} />
        <PrimaryButton
          title="Guardar Solicitud"
          onPress={onSubmit}
          disabled={!canSubmit}
        />
        {!canSubmit && (
          <Text style={styles.warning}>Faltan documentos obligatorios</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { margin: spacing.md },
  footer: { padding: spacing.md },
  docItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.gray[200] },
  docInfo: { flex: 1 },
  docName: { fontSize: 14, fontWeight: '600', color: colors.gray[900], marginBottom: 4 },
  docStatus: { fontSize: 12, color: colors.gray[600] },
  docStatusOk: { color: colors.success },
  captureButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8 },
  captureText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  warning: { marginTop: spacing.sm, textAlign: 'center', color: colors.error, fontSize: 12 },
});
