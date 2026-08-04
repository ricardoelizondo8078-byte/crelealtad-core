import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { DocumentoRequerido } from '../types/solicitud.types';

export const useDocumentCapture = () => {
  const [isCapturing, setIsCapturing] = useState(false);

  const requestPermissions = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso Denegado',
        'Se requiere acceso a la cámara para capturar documentos'
      );
      return false;
    }
    return true;
  };

  const capturePhoto = async (): Promise<string | null> => {
    try {
      setIsCapturing(true);

      const hasPermission = await requestPermissions();
      if (!hasPermission) return null;

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (result.canceled) {
        return null;
      }

      return result.assets[0].uri;
    } catch (error) {
      console.error('Error capturando foto:', error);
      Alert.alert('Error', 'No se pudo capturar la foto');
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  const selectFromGallery = async (): Promise<string | null> => {
    try {
      setIsCapturing(true);

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso Denegado',
          'Se requiere acceso a la galería para seleccionar imágenes'
        );
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        quality: 0.8,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (result.canceled) {
        return null;
      }

      return result.assets[0].uri;
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  const showCaptureOptions = (
    onCamera: () => void,
    onGallery: () => void
  ) => {
    Alert.alert(
      'Capturar Documento',
      'Selecciona una opción:',
      [
        { text: 'Cámara', onPress: onCamera },
        { text: 'Galería', onPress: onGallery },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const uploadDocument = async (
    documentId: string,
    uri: string
  ): Promise<boolean> => {
    try {
      // Aquí iría la lógica para subir el documento al servidor
      // Por ahora solo retornamos true
      console.log(`Uploading document ${documentId}:`, uri);
      return true;
    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert('Error', 'No se pudo subir el documento');
      return false;
    }
  };

  return {
    isCapturing,
    capturePhoto,
    selectFromGallery,
    showCaptureOptions,
    uploadDocument,
  };
};
