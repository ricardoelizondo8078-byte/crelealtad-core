import { Linking, Platform, Alert } from 'react-native';

export const llamar = (telefono: string | null | undefined, nombre?: string) => {
  if (!telefono) return;
  const numero = telefono.replace(/\D/g, '');
  if (numero.length < 10) return;
  const url = `tel:${numero}`;
  Linking.canOpenURL(url).then(supported => {
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert('Error', 'No se puede realizar la llamada en este dispositivo');
    }
  });
};
