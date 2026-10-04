import FontAwesome from '@expo/vector-icons/FontAwesome';
import React from 'react';
import { Image, StyleSheet, Text } from 'react-native';
import {
  BinaryChoiceDialog,
  BottomSheetSelector,
  DocumentViewer,
  PrimaryButton,
  SecondaryButton,
} from '../../components/ui';
import { apiUrl } from '../../config/api';
import { colors, iconSizes, moduleThemes, radius, spacing, typography } from '../../theme/tokens';
import { formatPhone } from '../../utils/input';
import type { CanalLlamadaVerificacion, EvidenciaLlamadaSeleccionada } from './verificacion-llamadas.api';
import type { TelefonoLlamadaDisponible, TipoTelefonoEntrevista } from './verificacion-individual.types';

interface TelefonoEvidencia {
  tipo: TipoTelefonoEntrevista;
  telefono: string;
  llamadaId: string;
  evidenciaUrl: string;
}

interface ConfirmacionTelefonoPendiente {
  tipo: TipoTelefonoEntrevista;
  telefono: string;
}

interface VerificacionLlamadaModalsProps {
  selectorNumeroVisible: boolean;
  canalParaNumero: CanalLlamadaVerificacion | null;
  telefonosDisponibles: TelefonoLlamadaDisponible[];
  selectorCanalVisible: boolean;
  telefonoSeleccionado: string;
  whatsappHabilitado: boolean;
  confirmacionEvidenciaVisible: boolean;
  confirmacionPendiente: ConfirmacionTelefonoPendiente | null;
  evidenciaSeleccionada: EvidenciaLlamadaSeleccionada | null;
  guardandoConfirmacion: boolean;
  evidenciaTelefonoVisible: boolean;
  telefonoEvidencia: TelefonoEvidencia | null;
  evidenciaTelefonoHeaders?: Record<string, string>;
  reemplazoEvidenciaVisible: boolean;
  guardandoReemplazo: boolean;
  resultadoVisible: boolean;
  guardandoResultado: boolean;
  onCloseSelectorNumero: () => void;
  onSeleccionarNumero: (opcion: TelefonoLlamadaDisponible) => void;
  onCloseSelectorCanal: () => void;
  onLlamadaTelefonica: () => void;
  onLlamadaWhatsApp: () => void;
  onCloseConfirmacionEvidencia: () => void;
  onSeleccionarEvidencia: () => void;
  onGuardarConfirmacion: () => void;
  onCloseEvidenciaTelefono: () => void;
  onIniciarReemplazo: () => void;
  onCloseReemplazo: () => void;
  onGuardarReemplazo: () => void;
  onResultadoPositivo: () => void;
  onResultadoNegativo: () => void;
  onDismissResultado: () => void;
}

export const VerificacionLlamadaModals: React.FC<VerificacionLlamadaModalsProps> = ({
  selectorNumeroVisible,
  canalParaNumero,
  telefonosDisponibles,
  selectorCanalVisible,
  telefonoSeleccionado,
  whatsappHabilitado,
  confirmacionEvidenciaVisible,
  confirmacionPendiente,
  evidenciaSeleccionada,
  guardandoConfirmacion,
  evidenciaTelefonoVisible,
  telefonoEvidencia,
  evidenciaTelefonoHeaders,
  reemplazoEvidenciaVisible,
  guardandoReemplazo,
  resultadoVisible,
  guardandoResultado,
  onCloseSelectorNumero,
  onSeleccionarNumero,
  onCloseSelectorCanal,
  onLlamadaTelefonica,
  onLlamadaWhatsApp,
  onCloseConfirmacionEvidencia,
  onSeleccionarEvidencia,
  onGuardarConfirmacion,
  onCloseEvidenciaTelefono,
  onIniciarReemplazo,
  onCloseReemplazo,
  onGuardarReemplazo,
  onResultadoPositivo,
  onResultadoNegativo,
  onDismissResultado,
}) => (
  <>
    <BottomSheetSelector
      visible={selectorNumeroVisible}
      title="¿A qué número desea llamar?"
      message={canalParaNumero === 'WHATSAPP'
        ? 'Seleccionaste llamada por WhatsApp.'
        : 'Seleccionaste llamada por teléfono.'}
      dismissOnBackdrop
      onClose={onCloseSelectorNumero}
    >
      {telefonosDisponibles.map((opcion) => (
        <SecondaryButton
          key={opcion.tipo}
          title={`${opcion.etiqueta}: ${formatPhone(opcion.numero)}`}
          moduleTheme="verification"
          size="large"
          leadingIcon={(
            <FontAwesome
              name={canalParaNumero === 'WHATSAPP' ? 'whatsapp' : 'phone'}
              size={iconSizes.action}
              color={canalParaNumero === 'WHATSAPP'
                ? colors.whatsapp
                : moduleThemes.verification.primary}
            />
          )}
          onPress={() => onSeleccionarNumero(opcion)}
          accessibilityLabel={`Llamar al número ${opcion.etiqueta.toLowerCase()}, ${formatPhone(opcion.numero)}`}
        />
      ))}
    </BottomSheetSelector>

    <BottomSheetSelector
      visible={selectorCanalVisible}
      title="¿Cómo desea realizar la llamada?"
      message={`Número confirmado: ${telefonoSeleccionado}`}
      dismissOnBackdrop
      onClose={onCloseSelectorCanal}
    >
      <SecondaryButton
        title="Llamada telefónica"
        moduleTheme="verification"
        size="large"
        leadingIcon={(
          <FontAwesome name="phone" size={iconSizes.action} color={moduleThemes.verification.primary} />
        )}
        onPress={onLlamadaTelefonica}
        accessibilityLabel="Realizar llamada telefónica al número confirmado"
      />
      <SecondaryButton
        title="Llamada por WhatsApp"
        moduleTheme="verification"
        size="large"
        leadingIcon={(
          <FontAwesome name="whatsapp" size={iconSizes.action} color={colors.whatsapp} />
        )}
        disabled={!whatsappHabilitado}
        onPress={onLlamadaWhatsApp}
        accessibilityLabel={whatsappHabilitado
          ? 'Realizar llamada por WhatsApp al número confirmado'
          : 'Llamada por WhatsApp disponible después de registrar una llamada telefónica'}
      />
      {!whatsappHabilitado ? (
        <Text allowFontScaling={false} style={styles.requirementText}>
          WhatsApp estará disponible después de registrar la primera llamada telefónica.
        </Text>
      ) : null}
    </BottomSheetSelector>

    <BottomSheetSelector
      visible={confirmacionEvidenciaVisible}
      title="Guardar evidencia de la llamada"
      message={confirmacionPendiente
        ? `La llamada al número ${formatPhone(confirmacionPendiente.telefono)} fue contestada. Agrega la evidencia para confirmarlo.`
        : undefined}
      onClose={onCloseConfirmacionEvidencia}
    >
      {evidenciaSeleccionada ? (
        <Image
          source={{ uri: evidenciaSeleccionada.uri }}
          style={styles.evidenceImage}
          accessibilityLabel="Evidencia seleccionada para confirmar el teléfono"
        />
      ) : null}
      <SecondaryButton
        title={evidenciaSeleccionada ? 'Cambiar evidencia' : 'Seleccionar evidencia'}
        moduleTheme="verification"
        leadingIcon={(
          <FontAwesome name="image" size={iconSizes.action} color={moduleThemes.verification.primary} />
        )}
        disabled={guardandoConfirmacion}
        onPress={onSeleccionarEvidencia}
      />
      <PrimaryButton
        title={guardandoConfirmacion ? 'Guardando…' : 'Guardar evidencia y confirmar'}
        moduleTheme="verification"
        disabled={!evidenciaSeleccionada || guardandoConfirmacion}
        onPress={onGuardarConfirmacion}
      />
    </BottomSheetSelector>

    <DocumentViewer
      visible={evidenciaTelefonoVisible}
      title={telefonoEvidencia
        ? `Evidencia del teléfono ${telefonoEvidencia.tipo === 'PRINCIPAL' ? 'principal' : 'secundario'} · ${formatPhone(telefonoEvidencia.telefono)}`
        : 'Evidencia del teléfono confirmado'}
      pages={telefonoEvidencia ? [{
        uri: apiUrl(telefonoEvidencia.evidenciaUrl),
        headers: evidenciaTelefonoHeaders,
        mimeType: 'image/jpeg',
      }] : []}
      onClose={onCloseEvidenciaTelefono}
      fullScreen
      moduleTheme="verification"
      secondaryAction={{
        title: 'Cambiar evidencia',
        accessibilityLabel: 'Seleccionar otra evidencia para el teléfono confirmado',
        disabled: guardandoReemplazo,
        onPress: onIniciarReemplazo,
      }}
    />

    <BottomSheetSelector
      visible={reemplazoEvidenciaVisible}
      title="Cambiar evidencia del teléfono"
      message={telefonoEvidencia
        ? `${formatPhone(telefonoEvidencia.telefono)} · ${telefonoEvidencia.tipo === 'PRINCIPAL' ? 'Principal' : 'Secundario'}`
        : undefined}
      onClose={onCloseReemplazo}
    >
      {evidenciaSeleccionada ? (
        <Image
          source={{ uri: evidenciaSeleccionada.uri }}
          style={styles.evidenceImage}
          accessibilityLabel="Nueva evidencia seleccionada"
        />
      ) : null}
      <SecondaryButton
        title="Elegir otra imagen"
        moduleTheme="verification"
        leadingIcon={(
          <FontAwesome name="image" size={iconSizes.action} color={moduleThemes.verification.primary} />
        )}
        disabled={guardandoReemplazo}
        onPress={onSeleccionarEvidencia}
      />
      <PrimaryButton
        title={guardandoReemplazo ? 'Guardando…' : 'Guardar cambio'}
        moduleTheme="verification"
        disabled={!evidenciaSeleccionada || guardandoReemplazo}
        onPress={onGuardarReemplazo}
      />
    </BottomSheetSelector>

    <BinaryChoiceDialog
      visible={resultadoVisible}
      title="Resultado de la llamada"
      message={'¿La integrante contestó la llamada?\n\nAl responder se registrará la ubicación actual del teléfono.'}
      positiveLabel="Sí contestó"
      negativeLabel="No contestó"
      onPositive={onResultadoPositivo}
      onNegative={onResultadoNegativo}
      onDismiss={onDismissResultado}
      busy={guardandoResultado}
    />
  </>
);

const styles = StyleSheet.create({
  requirementText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  evidenceImage: {
    width: '100%',
    height: 190,
    borderRadius: radius.md,
    backgroundColor: colors.gray[100],
    resizeMode: 'contain',
  },
});
