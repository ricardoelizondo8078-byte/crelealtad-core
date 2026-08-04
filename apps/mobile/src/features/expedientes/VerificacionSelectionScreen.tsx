import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppHeader, Card, PrimaryButton, ScreenContainer, ScreenTitleBar, SectionTitle } from '../../components/ui';
import { colors, moduleThemes, spacing } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import { apiUrl } from '../../config/api';

interface IntegranteVerificacion {
  id: string;
  nombre: string;
  montoSolicitado: number;
  estaCompleta: boolean;
}

interface VerificacionSelectionScreenProps {
  expedienteId: string;
  grupoNombre: string;
  integrantes: IntegranteVerificacion[];
  onBack: () => void;
  onConfirm: (integrantesAprobados: string[], integrantesRechazados: { id: string; motivo: string }[]) => void;
}

const MOTIVOS_RECHAZO = [
  'Documentación incompleta',
  'Datos incorrectos',
  'No cumple requisitos',
  'Solicitud duplicada',
  'Otro motivo',
];

export const VerificacionSelectionScreen: React.FC<VerificacionSelectionScreenProps> = ({
  expedienteId,
  grupoNombre,
  integrantes,
  onBack,
  onConfirm,
}) => {
  // Inicializar selecciones: los NO completos automáticamente con 'rechazado'
  const [selecciones, setSelecciones] = useState<Record<string, 'aprobado' | 'rechazado' | null>>(
    integrantes.reduce((acc, int) => ({
      ...acc,
      [int.id]: int.estaCompleta ? null : 'rechazado'
    }), {})
  );

  // Estado para guardar los motivos de rechazo
  const [motivos, setMotivos] = useState<Record<string, string>>(
    integrantes.reduce((acc, int) => ({
      ...acc,
      [int.id]: int.estaCompleta ? '' : 'Documentación incompleta'
    }), {})
  );

  // Estado para la tesorera seleccionada
  const [tesoreraId, setTesoreraId] = useState<string | null>(null);

  // Estado para el modal de éxito
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [montoTotalEnviado, setMontoTotalEnviado] = useState(0);

  const handleSeleccion = (integranteId: string, tipo: 'aprobado' | 'rechazado') => {
    // Verificar si el integrante está completo
    const integrante = integrantes.find((int) => int.id === integranteId);

    // Si NO está completo, no permitir cambiar la selección y mostrar el motivo
    if (integrante && !integrante.estaCompleta) {
      const motivoActual = motivos[integranteId] || 'Documentación incompleta';
      Alert.alert(
        'Integrante incompleto',
        `Este integrante no puede ser aprobado.\n\nMotivo: ${motivoActual}`,
        [{ text: 'Entendido' }]
      );
      return;
    }

    if (tipo === 'rechazado') {
      // Si rechaza una integrante que era tesorera, deseleccionar tesorera
      if (tesoreraId === integranteId) {
        setTesoreraId(null);
      }

      // Mostrar selector de motivo
      Alert.alert(
        'Motivo de rechazo',
        'Selecciona el motivo por el cual no pasa a verificación',
        [
          ...MOTIVOS_RECHAZO.map((motivo) => ({
            text: motivo,
            onPress: () => {
              setSelecciones((prev) => ({ ...prev, [integranteId]: 'rechazado' }));
              setMotivos((prev) => ({ ...prev, [integranteId]: motivo }));
            },
          })),
          {
            text: 'Cancelar',
            style: 'cancel',
          },
        ]
      );
    } else {
      setSelecciones((prev) => ({ ...prev, [integranteId]: tipo }));
    }
  };

  const handleSeleccionarTesorera = (integranteId: string) => {
    // Solo permitir seleccionar tesorera si la integrante está aprobada
    if (selecciones[integranteId] !== 'aprobado') {
      Alert.alert(
        'No disponible',
        'Solo puedes seleccionar como tesorera a una integrante aprobada.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    // Toggle: si ya es tesorera, deseleccionar; si no, seleccionar
    if (tesoreraId === integranteId) {
      setTesoreraId(null);
    } else {
      setTesoreraId(integranteId);
    }
  };

  const handleEnviar = () => {
    // Verificar que todos tengan una selección
    const sinSeleccion = integrantes.filter((int) => !selecciones[int.id]);

    if (sinSeleccion.length > 0) {
      Alert.alert(
        'Selección incompleta',
        `Debes seleccionar una opción para todos los integrantes. Faltan: ${sinSeleccion.length}`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Separar aprobados y rechazados
    const aprobados = integrantes
      .filter((int) => selecciones[int.id] === 'aprobado')
      .map((int) => int.id);

    const rechazados = integrantes
      .filter((int) => selecciones[int.id] === 'rechazado')
      .map((int) => ({ id: int.id, motivo: motivos[int.id] || 'Documentación incompleta' }));

    if (aprobados.length === 0) {
      Alert.alert(
        'Sin integrantes aprobados',
        'Debes aprobar al menos un integrante para enviar a verificación.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Verificar que se haya seleccionado una tesorera
    if (!tesoreraId) {
      Alert.alert(
        'Tesorera no seleccionada',
        'Debes seleccionar una tesorera ( T ) antes de enviar a verificación.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    // Calcular monto total de integrantes aprobados
    const montoTotal = integrantes
      .filter((int) => aprobados.includes(int.id))
      .reduce((sum, int) => sum + Number(int.montoSolicitado || 0), 0);

    // Obtener nombre de la tesorera
    const tesoreraNombre = integrantes.find((int) => int.id === tesoreraId)?.nombre || '';

    // Confirmar envío
    Alert.alert(
      'Confirmar envío',
      `Grupo: ${grupoNombre}\nTesorera: ${tesoreraNombre}\nMonto total: ${formatCurrency(montoTotal)}\n\nSe enviarán ${aprobados.length} integrante(s) a verificación.${
        rechazados.length > 0 ? `\n${rechazados.length} integrante(s) no pasarán.` : ''
      }`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              // Llamar al endpoint para cambiar el estado del expediente
              const response = await fetch(apiUrl(`/expedientes/${expedienteId}/send-to-verification`), {
                method: 'PATCH',
              });

              if (response.ok) {
                setMontoTotalEnviado(montoTotal);
                setShowSuccessModal(true);
              } else {
                throw new Error('Error al enviar a verificación');
              }
            } catch (error) {
              console.error('Error enviando a verificación:', error);
              Alert.alert('Error', 'No se pudo enviar el grupo a verificación. Intenta de nuevo.');
            }
          },
        },
      ]
    );
  };

  const totalSeleccionados = Object.values(selecciones).filter((v) => v === 'aprobado').length;

  // Verificar si todos los integrantes tienen selección
  const todosConSeleccion = integrantes.every((int) => selecciones[int.id] !== null);

  // Calcular suma de montos de integrantes aprobados
  const montoTotal = integrantes
    .filter((int) => selecciones[int.id] === 'aprobado')
    .reduce((sum, int) => sum + Number(int.montoSolicitado || 0), 0);

  return (
    <ScreenContainer>
      <AppHeader showBackButton onBackPress={onBack} moduleTheme="documentation" />
      <ScreenTitleBar title="Enviar a Verificación" moduleTheme="documentation" />

      {/* Banner del grupo */}
      <View style={styles.grupoBanner}>
        <Text allowFontScaling={false} style={styles.grupoBannerText}>{grupoNombre}</Text>
      </View>

      {/* Resumen de verificación */}
      <View style={styles.resumenContainer}>
        <View style={styles.resumenCardSmall}>
          <Text allowFontScaling={false} style={styles.resumenLabel}>Integrantes</Text>
          <Text allowFontScaling={false} style={styles.resumenValor}>{totalSeleccionados}</Text>
        </View>

        <View style={styles.resumenDivider} />

        <View style={styles.resumenCardLarge}>
          <Text allowFontScaling={false} style={styles.resumenLabel}>Monto total</Text>
          <Text allowFontScaling={false} style={styles.resumenValor}>{formatCurrency(montoTotal)}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <SectionTitle
          title="Selecciona integrantes"
          subtitle={`${totalSeleccionados} de ${integrantes.length} seleccionados`}
        />

        {integrantes.map((integrante) => (
          <Card key={integrante.id} style={styles.integranteCard}>
            <View style={styles.integranteInfo}>
              <View style={styles.infoTexto}>
                <Text allowFontScaling={false} style={styles.nombreIntegrante}>
                  {integrante.nombre}
                </Text>
                <Text allowFontScaling={false} style={styles.montoTexto}>
                  {formatCurrency(integrante.montoSolicitado)}
                </Text>
              </View>

              <View style={styles.botonesSeleccion}>
                <TouchableOpacity
                  style={[
                    styles.botonSeleccion,
                    styles.botonTesorera,
                    tesoreraId === integrante.id && styles.botonTesoreraActiva,
                    selecciones[integrante.id] !== 'aprobado' && styles.botonBloqueado,
                  ]}
                  onPress={() => handleSeleccionarTesorera(integrante.id)}
                  disabled={selecciones[integrante.id] !== 'aprobado'}
                >
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.iconoTexto,
                      tesoreraId === integrante.id && styles.iconoTextoActivo,
                    ]}
                  >
                    T
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.botonSeleccion,
                    styles.botonRechazar,
                    selecciones[integrante.id] === 'rechazado' && styles.botonRechazarActivo,
                    !integrante.estaCompleta && styles.botonBloqueado,
                  ]}
                  onPress={() => handleSeleccion(integrante.id, 'rechazado')}
                  disabled={!integrante.estaCompleta}
                >
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.iconoTexto,
                      selecciones[integrante.id] === 'rechazado' && styles.iconoTextoActivo,
                    ]}
                  >
                    ✕
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.botonSeleccion,
                    styles.botonAprobar,
                    selecciones[integrante.id] === 'aprobado' && styles.botonAprobarActivo,
                    !integrante.estaCompleta && styles.botonBloqueado,
                  ]}
                  onPress={() => handleSeleccion(integrante.id, 'aprobado')}
                  disabled={!integrante.estaCompleta}
                >
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.iconoTexto,
                      selecciones[integrante.id] === 'aprobado' && styles.iconoTextoActivo,
                    ]}
                  >
                    ✓
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {selecciones[integrante.id] === 'rechazado' && (
              <View style={styles.motivoContainer}>
                <Text allowFontScaling={false} style={styles.motivoTexto}>
                  ⚠️ {motivos[integrante.id] || 'Documentación incompleta'} - No puede pasar a verificación
                </Text>
              </View>
            )}

            {tesoreraId === integrante.id && (
              <View style={styles.tesoreraContainer}>
                <Text allowFontScaling={false} style={styles.tesoreraTexto}>
                  👑 Tesorera del ciclo
                </Text>
              </View>
            )}
          </Card>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title={`Enviar ${totalSeleccionados} a Verificación`}
          onPress={handleEnviar}
          disabled={!todosConSeleccion || totalSeleccionados === 0}
        />
      </View>

      {/* Modal de éxito */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowSuccessModal(false);
          onBack();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.successIcon}>
              <Text allowFontScaling={false} style={styles.successIconText}>✓</Text>
            </View>

            <Text allowFontScaling={false} style={styles.successTitle}>Grupo enviado a verificación</Text>

            <View style={styles.successInfoContainer}>
              <Text allowFontScaling={false} style={styles.successLabel}>Grupo</Text>
              <Text allowFontScaling={false} style={styles.successValue}>{grupoNombre}</Text>
            </View>

            <View style={styles.successInfoContainer}>
              <Text allowFontScaling={false} style={styles.successLabel}>Monto total</Text>
              <Text allowFontScaling={false} style={styles.successValue}>{formatCurrency(montoTotalEnviado)}</Text>
            </View>

            <TouchableOpacity
              style={styles.successButton}
              onPress={() => {
                setShowSuccessModal(false);
                onBack();
              }}
            >
              <Text allowFontScaling={false} style={styles.successButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  grupoBanner: {
    backgroundColor: moduleThemes.documentation.headerBg,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: moduleThemes.documentation.titleBarBg,
  },
  grupoBannerText: {
    color: '#FDE047', // Amarillo brillante
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resumenContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resumenCardSmall: {
    flex: 0.7,
    alignItems: 'center',
  },
  resumenCardLarge: {
    flex: 2.3,
    alignItems: 'center',
  },
  resumenDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  resumenLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  resumenValor: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: 100,
  },
  integranteCard: {
    padding: spacing.md,
    borderWidth: 2,
    borderColor: '#000',
    marginBottom: spacing.sm,
  },
  integranteInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoTexto: {
    flex: 1,
  },
  nombreIntegrante: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  montoTexto: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  botonesSeleccion: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  botonSeleccion: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  botonRechazar: {
    borderColor: colors.error,
    backgroundColor: colors.white,
  },
  botonRechazarActivo: {
    backgroundColor: colors.error,
  },
  botonAprobar: {
    borderColor: colors.success,
    backgroundColor: colors.white,
  },
  botonAprobarActivo: {
    backgroundColor: colors.success,
  },
  botonTesorera: {
    borderColor: '#9F7410', // Amarillo profundo
    backgroundColor: colors.white,
  },
  botonTesoreraActiva: {
    backgroundColor: '#E2C978', // Amarillo claro
  },
  botonBloqueado: {
    opacity: 0.5,
    borderColor: colors.gray[300],
  },
  iconoTexto: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  iconoTextoActivo: {
    color: colors.white,
  },
  motivoContainer: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.warningLight,
    borderRadius: 6,
  },
  motivoTexto: {
    fontSize: 13,
    color: '#D97706',
    fontWeight: '600',
  },
  tesoreraContainer: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: '#E2C978', // Amarillo claro
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#9F7410', // Amarillo profundo
  },
  tesoreraTexto: {
    fontSize: 13,
    color: '#6E5200', // Texto sobre amarillo
    fontWeight: '700',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  successIconText: {
    fontSize: 48,
    color: colors.white,
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  successInfoContainer: {
    width: '100%',
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  successLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  successValue: {
    fontSize: 28,
    fontWeight: '700',
    color: moduleThemes.documentation.primary,
    textAlign: 'center',
  },
  successButton: {
    backgroundColor: moduleThemes.documentation.primary,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 48,
    marginTop: spacing.lg,
    width: '100%',
    alignItems: 'center',
  },
  successButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
