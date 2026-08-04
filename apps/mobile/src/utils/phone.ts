import { Linking, Platform, Alert } from 'react-native';

export const llamar = (telefono: string | null | undefined, nombre?: string, relacion?: string) => {
  if (!telefono) return;
  const numero = telefono.replace(/\D/g, '');
  if (numero.length < 10) return;

  // Formatear número para mostrar: (81) 1234-5678
  const numeroFormateado = `(${numero.substring(0, 2)}) ${numero.substring(2, 6)}-${numero.substring(6, 10)}`;

  // Construir mensaje de confirmación
  let titulo = '📞 Confirmar llamada';
  let mensaje = `¿Deseas llamar al número ${numeroFormateado}?`;

  if (nombre && relacion) {
    mensaje = `¿Deseas llamar a ${nombre}?\n${relacion}\n\nNúmero: ${numeroFormateado}`;
  } else if (nombre) {
    mensaje = `¿Deseas llamar a ${nombre}?\n\nNúmero: ${numeroFormateado}`;
  }

  Alert.alert(
    titulo,
    mensaje,
    [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Llamar',
        onPress: () => {
          const url = `tel:${numero}`;
          Linking.canOpenURL(url).then(supported => {
            if (supported) {
              Linking.openURL(url);
            } else {
              Alert.alert('Error', 'No se puede realizar la llamada en este dispositivo');
            }
          });
        },
      },
    ],
  );
};
