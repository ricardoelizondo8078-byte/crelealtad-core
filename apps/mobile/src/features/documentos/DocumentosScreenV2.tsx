import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  AppHeader,
  Card,
  DocumentCard,
  DocumentViewer,
  PrimaryButton,
  ScreenContainer,
  ScreenTitleBar,
} from '../../components/ui';
import { apiUrl } from '../../config/api';
import { api, getAuthorizationHeaders } from '../../services/api-client';
import { colors, spacing, typography } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import { formatPhone } from '../../utils/input';
import { esRutaDocumentoServidor } from '../../utils/documents';
import {
  uploadDocumentFiles,
} from '../../services/document-upload';

type DocumentoClave = 'ine' | 'comprobante' | 'ine_beneficiario' | 'solicitud_firmada' | 'comprobante_credito';
type DocumentoEstado = 'Pendiente' | 'Subiendo' | 'Sincronizado' | 'Error' | 'Opcional';

interface DocumentoItem {
  id: string;
  clave: DocumentoClave;
  nombre: string;
  requerido: boolean;
  estado: DocumentoEstado;
  ruta?: string;
  nota?: string;
}

interface IntegranteInfo {
  id: string;
  nombre: string;
  telefono?: string | null;
  montoSolicitado?: number;
  expediente_id?: string;
}

interface GrupoInfo { id: string; nombre: string }
interface ExpedienteInfo { id: string; grupo_id: string }

interface SolicitudDocumentosInfo {
  doc_ine_ruta?: string;
  doc_comprobante_ruta?: string;
  doc_ine_beneficiario_ruta?: string;
  doc_solicitud_firmada_ruta?: string;
  doc_comprobante_credito_ruta?: string;
}

interface DocumentoRemoto {
  id: string;
  ruta: string;
  archivos: Array<{ indice: number; mime_type: string; url: string }>;
}

interface ViewerState {
  title: string;
  pages: Array<{ uri: string; headers: Record<string, string>; mimeType: string }>;
}

interface DocumentosScreenProps {
  integranteId: string;
  integranteNombre?: string;
  integrantePosition?: number;
  integrantesTotal?: number;
  groupName?: string;
  onSaved?: () => void;
  onBack?: () => void;
}

const DEFINICIONES: Array<Pick<DocumentoItem, 'clave' | 'nombre' | 'nota' | 'requerido'>> = [
  { clave: 'ine', nombre: 'INE', nota: 'Captura frente y reverso', requerido: true },
  { clave: 'comprobante', nombre: 'Comprobante de domicilio', requerido: true },
  { clave: 'solicitud_firmada', nombre: 'Solicitud firmada', requerido: true },
  { clave: 'ine_beneficiario', nombre: 'INE de beneficiario', requerido: false },
  {
    clave: 'comprobante_credito',
    nombre: 'Comprobante de línea de crédito',
    nota: 'Puedes agregar todas las fotos necesarias',
    requerido: false,
  },
];

const RUTAS: Record<DocumentoClave, keyof SolicitudDocumentosInfo> = {
  ine: 'doc_ine_ruta',
  comprobante: 'doc_comprobante_ruta',
  ine_beneficiario: 'doc_ine_beneficiario_ruta',
  solicitud_firmada: 'doc_solicitud_firmada_ruta',
  comprobante_credito: 'doc_comprobante_credito_ruta',
};

export const DocumentosScreen: React.FC<DocumentosScreenProps> = ({
  integranteId,
  integranteNombre,
  integrantePosition,
  integrantesTotal,
  groupName,
  onSaved,
  onBack,
}) => {
  const [documentos, setDocumentos] = useState<DocumentoItem[]>([]);
  const [pendientesSesion, setPendientesSesion] = useState<Partial<Record<DocumentoClave, ImagePicker.ImagePickerAsset[]>>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [integrante, setIntegrante] = useState<IntegranteInfo | null>(null);
  const [grupo, setGrupo] = useState<GrupoInfo | null>(null);
  const [viewer, setViewer] = useState<ViewerState | null>(null);

  const loadDocumentos = useCallback(async () => {
    const data = await api.get<SolicitudDocumentosInfo | null>(`/solicitudes/integrante/${integranteId}`);
    setDocumentos(DEFINICIONES.map((definition) => {
      const ruta = data?.[RUTAS[definition.clave]];
      const sincronizado = esRutaDocumentoServidor(ruta);
      return {
        ...definition,
        id: `${integranteId}-${definition.clave}`,
        estado: sincronizado ? 'Sincronizado' : definition.requerido ? 'Pendiente' : 'Opcional',
        ruta: sincronizado ? ruta : undefined,
      };
    }));
  }, [integranteId]);

  const loadContext = useCallback(async () => {
    const integranteData = await api.get<IntegranteInfo>(`/integrantes/${integranteId}`);
    setIntegrante(integranteData);
    if (!integranteData.expediente_id) return;
    const expediente = await api.get<ExpedienteInfo>(`/expedientes/${integranteData.expediente_id}`);
    if (!expediente.grupo_id) return;
    setGrupo(await api.get<GrupoInfo>(`/grupos/${expediente.grupo_id}`));
  }, [integranteId]);

  const loadScreen = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      await Promise.all([loadContext(), loadDocumentos()]);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo cargar la documentación.');
    } finally {
      setLoading(false);
    }
  }, [loadContext, loadDocumentos]);

  useEffect(() => { void loadScreen(); }, [loadScreen]);

  const setDocumentoEstado = (clave: DocumentoClave, estado: DocumentoEstado, ruta?: string) => {
    setDocumentos((current) => current.map((item) => item.clave === clave ? { ...item, estado, ruta: ruta ?? item.ruta } : item));
  };

  const subirDocumento = async (documento: DocumentoItem, assets: ImagePicker.ImagePickerAsset[]) => {
    try {
      setPendientesSesion((current) => ({ ...current, [documento.clave]: assets }));
      setDocumentoEstado(documento.clave, 'Subiendo');
      const remoto = await uploadDocumentFiles(
        integranteId,
        documento.clave,
        assets.map((asset) => asset.uri),
      );
      setPendientesSesion((current) => ({ ...current, [documento.clave]: undefined }));
      setDocumentoEstado(documento.clave, 'Sincronizado', remoto.ruta);
    } catch (error) {
      setDocumentoEstado(documento.clave, 'Error');
      Alert.alert('No se pudo subir', error instanceof Error ? error.message : 'Revisa tu conexión e intenta nuevamente.');
    }
  };

  const capturarCamara = async (documento: DocumentoItem) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permiso requerido', 'Activa el acceso a la cámara para capturar el documento.');
      return;
    }

    const assets: ImagePicker.ImagePickerAsset[] = [];
    if (documento.clave === 'comprobante_credito') {
      let agregarOtra = true;
      while (agregarOtra) {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.85,
        });
        if (result.canceled || !result.assets[0]) {
          if (assets.length === 0) return;
          break;
        }
        assets.push(result.assets[0]);
        agregarOtra = await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Foto agregada',
            `${assets.length} ${assets.length === 1 ? 'foto seleccionada' : 'fotos seleccionadas'}.`,
            [
              { text: 'Terminar', onPress: () => resolve(false) },
              { text: 'Agregar otra', onPress: () => resolve(true) },
            ],
            { cancelable: false },
          );
        });
      }
      await subirDocumento(documento, assets);
      return;
    }

    const pages = documento.clave === 'ine' ? 2 : 1;
    for (let index = 0; index < pages; index += 1) {
      if (pages === 2) Alert.alert('INE', index === 0 ? 'Captura el frente.' : 'Captura el reverso.');
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.85 });
      if (result.canceled || !result.assets[0]) return;
      assets.push(result.assets[0]);
    }
    await subirDocumento(documento, assets);
  };

  const seleccionarGaleria = async (documento: DocumentoItem) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permiso requerido', 'Activa el acceso a tus imágenes para seleccionar el documento.');
      return;
    }
    const permiteMultiples = documento.clave === 'ine'
      || documento.clave === 'comprobante_credito';
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: permiteMultiples,
      selectionLimit: documento.clave === 'ine'
        ? 2
        : documento.clave === 'comprobante_credito'
          ? 0
          : 1,
      orderedSelection: permiteMultiples,
      quality: 0.85,
    });
    if (result.canceled || !result.assets.length) return;
    if (documento.clave === 'ine' && result.assets.length !== 2) {
      Alert.alert('Falta una imagen', 'Selecciona el frente y el reverso del INE.');
      return;
    }
    await subirDocumento(documento, result.assets);
  };

  const elegirOrigen = (documento: DocumentoItem): void | Promise<void> => {
    const pendientes = pendientesSesion[documento.clave];
    if (documento.estado === 'Error' && pendientes?.length) {
      return subirDocumento(documento, pendientes);
    }
    Alert.alert('Agregar documento', 'Elige el origen de las imágenes.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cámara',
        onPress: () => {
          // Cámara y galería son superficies nativas: el overlay global puede
          // bloquear sus controles o quedar encima al regresar a la aplicación.
          void capturarCamara(documento);
        },
      },
      {
        text: 'Galería',
        onPress: () => {
          void seleccionarGaleria(documento);
        },
      },
    ]);
    return undefined;
  };

  const verDocumento = async (documento: DocumentoItem) => {
    if (!documento.ruta) return;
    try {
      const [remoto, headers] = await Promise.all([
        api.get<DocumentoRemoto>(documento.ruta),
        getAuthorizationHeaders(),
      ]);
      setViewer({
        title: documento.nombre,
        pages: remoto.archivos.map((archivo) => ({ uri: apiUrl(archivo.url), headers, mimeType: archivo.mime_type })),
      });
    } catch (error) {
      Alert.alert('No se pudo abrir', error instanceof Error ? error.message : 'Intenta nuevamente.');
    }
  };

  const requeridos = documentos.filter((documento) => documento.requerido);
  const completos = requeridos.filter((documento) => documento.estado === 'Sincronizado').length;

  return (
    <ScreenContainer moduleTheme="documentation">
      <AppHeader showBackButton onBackPress={onBack} moduleTheme="documentation" />
      <ScreenTitleBar title="Documentos" moduleTheme="documentation" />
      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text allowFontScaling={false} style={styles.stateText}>Cargando documentación…</Text>
        </View>
      ) : loadError ? (
        <View style={styles.centerState}>
          <Text allowFontScaling={false} style={styles.errorTitle}>No se pudo cargar</Text>
          <Text allowFontScaling={false} style={styles.stateText}>{loadError}</Text>
          <PrimaryButton title="Intentar nuevamente" onPress={loadScreen} />
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Card style={styles.contextCard}>
            <Text allowFontScaling={false} style={styles.groupName}>{grupo?.nombre || groupName || 'Grupo'}</Text>
            <View style={styles.contextRow}>
              <Text allowFontScaling={false} style={styles.personName}>{integrante?.nombre || integranteNombre || 'Integrante'}</Text>
              {integrantePosition && integrantesTotal ? <Text allowFontScaling={false} style={styles.position}>{integrantePosition}/{integrantesTotal}</Text> : null}
            </View>
            <Text allowFontScaling={false} style={styles.meta}>
              {[integrante?.telefono ? formatPhone(integrante.telefono) : null, formatCurrency(integrante?.montoSolicitado || 0)].filter(Boolean).join(' · ')}
            </Text>
            <Text allowFontScaling={false} style={styles.progress}>{completos} de {requeridos.length} obligatorios sincronizados</Text>
          </Card>

          <Text allowFontScaling={false} style={styles.sectionTitle}>Pendientes primero</Text>
          {[...documentos].sort((a, b) => Number(a.estado === 'Sincronizado') - Number(b.estado === 'Sincronizado')).map((documento) => (
            <DocumentCard
              key={documento.id}
              name={documento.nombre}
              required={documento.requerido}
              hint={documento.nota}
              statusLabel={documento.estado}
              statusTone={documento.estado === 'Sincronizado' ? 'success' : documento.estado === 'Subiendo' ? 'progress' : documento.estado === 'Error' ? 'error' : 'pending'}
              primaryLabel={documento.estado === 'Error' ? 'Reintentar' : documento.estado === 'Sincronizado' ? 'Reemplazar' : documento.estado === 'Subiendo' ? 'Subiendo…' : 'Capturar'}
              onPrimary={() => elegirOrigen(documento)}
              onView={documento.estado === 'Sincronizado' ? () => verDocumento(documento) : undefined}
              disabled={documento.estado === 'Subiendo'}
            />
          ))}
          <PrimaryButton title="Volver al expediente" onPress={onSaved || onBack} />
        </ScrollView>
      )}
      <DocumentViewer visible={Boolean(viewer)} title={viewer?.title || ''} pages={viewer?.pages || []} onClose={() => setViewer(null)} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md, padding: spacing.xl },
  stateText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  errorTitle: { ...typography.sectionTitle, color: colors.danger },
  contextCard: { marginBottom: spacing.lg },
  groupName: { ...typography.caption, color: colors.primary, textTransform: 'uppercase' },
  contextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  personName: { ...typography.sectionTitle, color: colors.textPrimary, flex: 1 },
  position: { ...typography.bodyStrong, color: colors.textSecondary },
  meta: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  progress: { ...typography.bodyStrong, color: colors.primary, marginTop: spacing.md },
  sectionTitle: { ...typography.sectionTitle, color: colors.textPrimary, marginBottom: spacing.md },
});
