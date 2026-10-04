import { Linking, Alert } from 'react-native';

const MEXICO_COUNTRY_CODE = '52';

export const normalizarNumeroWhatsApp = (
  telefono: string | null | undefined,
): string | null => {
  if (!telefono) return null;

  const numero = telefono.replace(/\D/g, '');

  if (numero.length === 10) {
    return `${MEXICO_COUNTRY_CODE}${numero}`;
  }

  // WhatsApp eliminó el prefijo móvil mexicano "1" del formato internacional.
  if (numero.length === 13 && numero.startsWith('521')) {
    return `${MEXICO_COUNTRY_CODE}${numero.slice(3)}`;
  }

  if (numero.length >= 11 && numero.length <= 15) {
    return numero;
  }

  return null;
};

export const abrirWhatsApp = async (
  telefono: string | null | undefined,
  onWhatsAppOpened?: () => void,
) => {
  const numero = normalizarNumeroWhatsApp(telefono);

  if (!numero) {
    Alert.alert(
      'Número no disponible',
      'La integrante no tiene un teléfono válido para abrir WhatsApp.',
    );
    return;
  }

  try {
    // El enlace oficial abre la conversación; la llamada se inicia dentro de WhatsApp.
    await Linking.openURL(`https://wa.me/${numero}`);
    onWhatsAppOpened?.();
  } catch {
    Alert.alert(
      'No se pudo abrir WhatsApp',
      'Verifica que WhatsApp esté instalado e inténtalo nuevamente.',
    );
  }
};

export const llamar = (
  telefono: string | null | undefined,
  nombre?: string,
  relacion?: string,
  onCallStarted?: () => void,
) => {
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
          Linking.canOpenURL(url)
            .then((supported) => {
              if (!supported) {
                Alert.alert('Error', 'No se puede realizar la llamada en este dispositivo');
                return;
              }

              Linking.openURL(url)
                .then(() => onCallStarted?.())
                .catch(() => {
                  Alert.alert('Error', 'No se pudo abrir la aplicación de llamadas');
                });
            })
            .catch(() => {
              Alert.alert('Error', 'No se puede realizar la llamada en este dispositivo');
            });
        },
      },
    ],
  );
};
