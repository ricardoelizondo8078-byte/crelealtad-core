import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Card,
  PickerField,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
  SelectorField,
  StatusBadge,
} from '../../components/ui';
import {
  colors,
  iconSizes,
  moduleThemes,
  radius,
  spacing,
  typography,
} from '../../theme/tokens';
import type { MotivoSinMedidorLuz } from './verificacion-imagenes-domicilio.api';
import {
  IMAGENES_DOMICILIO,
  OPCIONES_MOTIVO_SIN_MEDIDOR_LUZ,
  obtenerEtiquetaMotivoSinMedidorLuz,
} from './verificacion-domicilio.model';
import type {
  ImagenDomicilioPendienteEnPantalla,
  ImagenDomicilioVista,
  TipoImagenDomicilioEnPantalla,
} from './verificacion-individual.types';

interface ImagenDomicilioEnVista {
  titulo: string;
  uri: string;
  headers?: Record<string, string>;
}

interface ImagenesDomicilioSectionProps {
  imagenes: Record<TipoImagenDomicilioEnPantalla, ImagenDomicilioVista | null>;
  pendientes: Record<
    TipoImagenDomicilioEnPantalla,
    ImagenDomicilioPendienteEnPantalla | null
  >;
  errores: Record<TipoImagenDomicilioEnPantalla, string | null>;
  loading: boolean;
  errorResumen: string | null;
  guardandoImagen: TipoImagenDomicilioEnPantalla | null;
  respuestaTieneMedidorLuz: '' | 'Sí' | 'No';
  motivoSinMedidorLuz: MotivoSinMedidorLuz | null;
  guardandoRespuestaMedidorLuz: boolean;
  abrirMotivosSinMedidorLuz: boolean;
  versionPopupMotivoMedidor: number;
  onRetryLoad: () => void;
  onOpenImage: (imagen: ImagenDomicilioEnVista) => void;
  onSavePending: (pendiente: ImagenDomicilioPendienteEnPantalla) => void;
  onTakeImage: (tipo: TipoImagenDomicilioEnPantalla) => void;
  onSelectTieneMedidor: (valor: string) => void;
  onSelectMotivoSinMedidor: (etiqueta: string) => void;
}

export const ImagenesDomicilioSection: React.FC<ImagenesDomicilioSectionProps> = ({
  imagenes,
  pendientes,
  errores,
  loading,
  errorResumen,
  guardandoImagen,
  respuestaTieneMedidorLuz,
  motivoSinMedidorLuz,
  guardandoRespuestaMedidorLuz,
  abrirMotivosSinMedidorLuz,
  versionPopupMotivoMedidor,
  onRetryLoad,
  onOpenImage,
  onSavePending,
  onTakeImage,
  onSelectTieneMedidor,
  onSelectMotivoSinMedidor,
}) => (
  <View style={styles.content}>
    <SectionTitle title="Imágenes del domicilio" />
    <Text allowFontScaling={false} style={styles.helpText}>
      La fachada es obligatoria. Si el domicilio tiene medidor de luz, su fotografía también es
      obligatoria. La fotografía con la integrante es opcional.
    </Text>

    <Card variant="warning">
      <Text allowFontScaling={false} style={styles.cameraNoticeText}>
        Usa únicamente la cámara del dispositivo. Cada imagen se guarda con la ubicación
        y el usuario que realizó la verificación.
      </Text>
    </Card>

    {loading && (
      <View style={styles.loading}>
        <ActivityIndicator color={moduleThemes.verification.primary} />
        <Text allowFontScaling={false} style={styles.helpText}>
          Consultando imágenes guardadas…
        </Text>
      </View>
    )}

    {errorResumen && (
      <Card variant="warning">
        <Text allowFontScaling={false} style={styles.errorText}>
          {errorResumen}
        </Text>
        <SecondaryButton
          title="Intentar nuevamente"
          moduleTheme="verification"
          disabled={loading}
          onPress={onRetryLoad}
        />
      </Card>
    )}

    {IMAGENES_DOMICILIO.map((imagen) => {
      if (imagen.tipo === 'MEDIDOR_LUZ' && respuestaTieneMedidorLuz !== 'Sí') {
        return null;
      }

      const guardada = imagenes[imagen.tipo];
      const pendiente = pendientes[imagen.tipo];
      const error = errores[imagen.tipo];
      const guardando = guardandoImagen === imagen.tipo;
      const uri = pendiente?.uri ?? guardada?.uri;
      const headers = pendiente ? undefined : guardada?.headers;
      const estado = guardando
        ? 'GUARDANDO…'
        : pendiente
          ? 'PENDIENTE DE ENVÍO'
          : guardada
            ? 'GUARDADA'
            : imagen.obligatoria
              ? 'PENDIENTE'
              : 'OPCIONAL';
      const numeroVisible = imagen.tipo === 'FACHADA'
        ? 1
        : imagen.tipo === 'MEDIDOR_LUZ'
          ? 2
          : respuestaTieneMedidorLuz === 'Sí' ? 3 : 2;

      return (
        <React.Fragment key={imagen.tipo}>
          <Card style={styles.card}>
            <View style={styles.header}>
              <Text allowFontScaling={false} style={styles.title}>
                {numeroVisible}. {imagen.titulo}
              </Text>
              <StatusBadge
                label={estado}
                tone={guardada && !pendiente ? 'success' : imagen.obligatoria ? 'pending' : 'progress'}
              />
            </View>

            {uri ? (
              <View style={styles.preview}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`Abrir ${imagen.titulo.toLowerCase()} en pantalla completa`}
                  accessibilityHint="Permite ampliar la imagen con pellizco y recorrerla arrastrando."
                  onPress={() => onOpenImage({
                    titulo: imagen.titulo,
                    uri,
                    headers,
                  })}
                >
                  <Image
                    source={{ uri, headers }}
                    style={styles.image}
                    accessibilityLabel={`Vista previa de ${imagen.titulo.toLowerCase()}`}
                  />
                </TouchableOpacity>
                {error && (
                  <Text allowFontScaling={false} style={styles.errorText}>
                    {error}
                  </Text>
                )}
                {pendiente && (
                  <PrimaryButton
                    title={guardando ? 'Guardando…' : 'Reintentar envío'}
                    moduleTheme="verification"
                    disabled={Boolean(guardandoImagen)}
                    accessibilityLabel={`Reintentar el envío de ${imagen.titulo.toLowerCase()}`}
                    onPress={() => onSavePending(pendiente)}
                  />
                )}
                <SecondaryButton
                  title="Volver a tomar"
                  moduleTheme="verification"
                  disabled={Boolean(guardandoImagen) || guardandoRespuestaMedidorLuz}
                  leadingIcon={(
                    <FontAwesome
                      name="camera"
                      size={iconSizes.action}
                      color={moduleThemes.verification.primary}
                    />
                  )}
                  accessibilityLabel={`Volver a tomar la imagen de ${imagen.titulo.toLowerCase()}`}
                  onPress={() => onTakeImage(imagen.tipo)}
                />
              </View>
            ) : (
              <PrimaryButton
                title="Abrir cámara"
                moduleTheme="verification"
                disabled={
                  Boolean(guardandoImagen)
                  || loading
                  || guardandoRespuestaMedidorLuz
                }
                leadingIcon={(
                  <FontAwesome
                    name="camera"
                    size={iconSizes.action}
                    color={moduleThemes.verification.primaryText}
                  />
                )}
                accessibilityLabel={`Abrir cámara para tomar la imagen de ${imagen.titulo.toLowerCase()}`}
                onPress={() => onTakeImage(imagen.tipo)}
              />
            )}
          </Card>

          {imagen.tipo === 'FACHADA' ? (
            <View style={styles.medidorQuestion}>
              <SelectorField
                label="¿TIENE MEDIDOR DE LUZ?"
                required
                value={respuestaTieneMedidorLuz}
                options={['Sí', 'No']}
                onSelect={onSelectTieneMedidor}
                moduleTheme="verification"
                disabled={Boolean(
                  !guardada
                  || pendiente
                  || loading
                  || guardandoImagen
                  || guardandoRespuestaMedidorLuz,
                )}
                helperText={!guardada || pendiente
                  ? 'Guarda primero la fotografía de la fachada para responder.'
                  : undefined}
              />
              {guardandoRespuestaMedidorLuz ? (
                <View style={styles.loading}>
                  <ActivityIndicator color={moduleThemes.verification.primary} />
                  <Text allowFontScaling={false} style={styles.helpText}>
                    Guardando respuesta…
                  </Text>
                </View>
              ) : null}
              {respuestaTieneMedidorLuz === 'No' ? (
                <PickerField
                  key={`motivo-medidor-${versionPopupMotivoMedidor}`}
                  label="¿Por qué no tiene medidor de luz?"
                  required
                  value={obtenerEtiquetaMotivoSinMedidorLuz(motivoSinMedidorLuz)}
                  options={[...OPCIONES_MOTIVO_SIN_MEDIDOR_LUZ]}
                  onSelect={onSelectMotivoSinMedidor}
                  placeholder="Seleccionar motivo"
                  errorText={!motivoSinMedidorLuz && !guardandoRespuestaMedidorLuz
                    ? 'Selecciona un motivo para continuar.'
                    : undefined}
                  moduleTheme="verification"
                  autoOpen={abrirMotivosSinMedidorLuz}
                  confirmSelection
                  highlightSelectedValue
                  selectionTone="danger"
                />
              ) : null}
            </View>
          ) : null}
        </React.Fragment>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
  card: {
    gap: spacing.md,
    borderWidth: 2,
    borderColor: moduleThemes.verification.primary,
  },
  medidorQuestion: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    flex: 1,
  },
  loading: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
  },
  cameraNoticeText: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  helpText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  preview: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: radius.md,
    backgroundColor: colors.gray[100],
  },
});
