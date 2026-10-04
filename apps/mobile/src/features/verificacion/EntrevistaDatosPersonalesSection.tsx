import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  MultiSelectField,
  PhoneCallField,
  PickerField,
  SelectorField,
  StickySectionHeader,
  TextInput,
} from '../../components/ui';
import { spacing } from '../../theme/tokens';
import { normalizeCurrencyInput } from '../../utils/currency';
import { formatPhone } from '../../utils/input';
import {
  FAMILIARES_DOMICILIO,
  MOTIVOS_NO_VIVE_EN_DOMICILIO,
} from './verificacion-entrevista.catalog';

interface EntrevistaDatosPersonalesSectionProps {
  nombreIntegrante: string;
  viveEnDomicilioDeclarado: string;
  motivoNoViveEnDomicilio: string;
  tipoDomicilio: string;
  familiarDomicilio: string;
  aniosEnDomicilio: string;
  personasVivenCasa: string;
  quienViveConUsted: string[];
  quienesVivenConUstedSabenDelCredito: string;
  tieneOtroIngresoHogar: string;
  otroIngresoSemanal: string;
  imagenesDomicilio: React.ReactNode;
  telefonoConfirmado: string;
  telefonoSecundario: string;
  telefonoPrincipalEstaConfirmado: boolean;
  telefonoSecundarioEstaConfirmado: boolean;
  onViveEnDomicilioChange: (value: string) => void;
  onMotivoNoViveEnDomicilioChange: (value: string) => void;
  onTipoDomicilioChange: (value: string) => void;
  onFamiliarDomicilioChange: (value: string) => void;
  onAniosEnDomicilioChange: (value: string) => void;
  onPersonasVivenCasaChange: (value: string) => void;
  onQuienViveConUstedChange: (value: string[]) => void;
  onQuienesVivenConUstedSabenDelCreditoChange: (value: string) => void;
  onTieneOtroIngresoHogarChange: (value: string) => void;
  onOtroIngresoSemanalChange: (value: string) => void;
  onTelefonoConfirmadoChange: (value: string) => void;
  onTelefonoSecundarioChange: (value: string) => void;
  onConfirmarTelefonoPrincipal: () => void;
  onConfirmarTelefonoSecundario: () => void;
  onVerEvidenciaTelefonoPrincipal: () => void;
  onVerEvidenciaTelefonoSecundario: () => void;
}

export const EntrevistaDatosPersonalesSection: React.FC<EntrevistaDatosPersonalesSectionProps> = ({
  nombreIntegrante,
  viveEnDomicilioDeclarado,
  motivoNoViveEnDomicilio,
  tipoDomicilio,
  familiarDomicilio,
  aniosEnDomicilio,
  personasVivenCasa,
  quienViveConUsted,
  quienesVivenConUstedSabenDelCredito,
  tieneOtroIngresoHogar,
  otroIngresoSemanal,
  imagenesDomicilio,
  telefonoConfirmado,
  telefonoSecundario,
  telefonoPrincipalEstaConfirmado,
  telefonoSecundarioEstaConfirmado,
  onViveEnDomicilioChange,
  onMotivoNoViveEnDomicilioChange,
  onTipoDomicilioChange,
  onFamiliarDomicilioChange,
  onAniosEnDomicilioChange,
  onPersonasVivenCasaChange,
  onQuienViveConUstedChange,
  onQuienesVivenConUstedSabenDelCreditoChange,
  onTieneOtroIngresoHogarChange,
  onOtroIngresoSemanalChange,
  onTelefonoConfirmadoChange,
  onTelefonoSecundarioChange,
  onConfirmarTelefonoPrincipal,
  onConfirmarTelefonoSecundario,
  onVerEvidenciaTelefonoPrincipal,
  onVerEvidenciaTelefonoSecundario,
}) => (
  <>
    <View style={styles.sectionHeader}>
      <StickySectionHeader title="DATOS PERSONALES" moduleTheme="verification" />
    </View>

    <SelectorField
      label={`${nombreIntegrante}, ¿vive en este domicilio?`}
      value={viveEnDomicilioDeclarado}
      options={['Sí', 'No']}
      onSelect={(respuesta) => {
        onViveEnDomicilioChange(respuesta);
        onMotivoNoViveEnDomicilioChange('');
      }}
      moduleTheme="verification"
      required
    />

    {viveEnDomicilioDeclarado === 'No' ? (
      <PickerField
        label="¿Por qué no vive en este domicilio?"
        value={motivoNoViveEnDomicilio}
        options={MOTIVOS_NO_VIVE_EN_DOMICILIO}
        onSelect={onMotivoNoViveEnDomicilioChange}
        placeholder="Seleccionar motivo"
        moduleTheme="verification"
        autoOpen
        confirmSelection
        highlightSelectedValue
        selectionTone="danger"
        required
      />
    ) : null}

    <SelectorField
      label="¿Renta, o es Dueña del domicilio?"
      value={tipoDomicilio}
      options={['Renta', 'Dueña', 'Familiar']}
      onSelect={(opcion) => {
        onTipoDomicilioChange(opcion);
        if (opcion !== 'Familiar') onFamiliarDomicilioChange('');
      }}
      moduleTheme="verification"
      required
    />

    {tipoDomicilio === 'Familiar' ? (
      <PickerField
        label="¿De qué familiar es el domicilio?"
        value={familiarDomicilio}
        options={FAMILIARES_DOMICILIO}
        onSelect={onFamiliarDomicilioChange}
        placeholder="Seleccionar familiar"
        moduleTheme="verification"
        autoOpen
        confirmSelection
        highlightSelectedValue
        required
      />
    ) : null}

    <SelectorField
      label="¿Hace cuántos años vive en este domicilio?"
      value={aniosEnDomicilio}
      options={['0-1 años', '1-3 años', '3+ años']}
      onSelect={onAniosEnDomicilioChange}
      moduleTheme="verification"
      required
    />

    <SelectorField
      label="¿Cuántas personas viven en casa?"
      value={personasVivenCasa}
      options={['1', '2', '3', '4', '5', '≥6']}
      onSelect={onPersonasVivenCasaChange}
      moduleTheme="verification"
      variant="countBubbles"
      required
    />

    <MultiSelectField
      label="¿Quién vive actualmente con usted?"
      value={quienViveConUsted}
      options={['Conyuge', 'Hijos', 'Padres', 'Hermanos', 'Otros']}
      onSelect={onQuienViveConUstedChange}
      helperText="Selecciona todas las opciones que apliquen"
      moduleTheme="verification"
      required
    />

    <SelectorField
      label="¿Saben los que viven con usted del crédito?"
      value={quienesVivenConUstedSabenDelCredito}
      options={['Sí', 'No']}
      onSelect={onQuienesVivenConUstedSabenDelCreditoChange}
      moduleTheme="verification"
      required
    />

    <SelectorField
      label="¿Alguien más aporta ingresos al hogar?"
      value={tieneOtroIngresoHogar}
      options={['Sí', 'No']}
      onSelect={(respuesta) => {
        onTieneOtroIngresoHogarChange(respuesta);
        if (respuesta === 'No') onOtroIngresoSemanalChange('');
      }}
      moduleTheme="verification"
      required
    />

    {tieneOtroIngresoHogar === 'Sí' ? (
      <TextInput
        label="¿A cuánto asciende la aportación semanal?"
        value={otroIngresoSemanal}
        onChangeText={(value) => onOtroIngresoSemanalChange(normalizeCurrencyInput(value))}
        keyboardType="numeric"
        placeholder="$ 0"
        moduleTheme="verification"
        highlightWhenFilled
        required
      />
    ) : null}

    <View style={styles.imagenesDomicilio}>{imagenesDomicilio}</View>

    <PhoneCallField
      label="¿Me puede confirmar su número?"
      value={telefonoConfirmado}
      onChangeText={(value) => onTelefonoConfirmadoChange(formatPhone(value))}
      onCall={onConfirmarTelefonoPrincipal}
      onViewEvidence={onVerEvidenciaTelefonoPrincipal}
      errorText={telefonoConfirmado && telefonoConfirmado.replace(/\D/g, '').length !== 10
        ? 'Captura un número de 10 dígitos.'
        : undefined}
      actionLabel="Confirmar"
      confirmed={telefonoPrincipalEstaConfirmado}
      callAccessibilityLabel="Confirmar el número y elegir llamada telefónica o WhatsApp"
      required
    />

    <PhoneCallField
      label="¿Tiene algún número secundario?"
      value={telefonoSecundario}
      onChangeText={(value) => onTelefonoSecundarioChange(formatPhone(value))}
      onCall={onConfirmarTelefonoSecundario}
      onViewEvidence={onVerEvidenciaTelefonoSecundario}
      helperText="Opcional"
      errorText={telefonoSecundario && telefonoSecundario.replace(/\D/g, '').length !== 10
        ? 'Captura un número de 10 dígitos.'
        : undefined}
      actionLabel="Confirmar"
      confirmed={telefonoSecundarioEstaConfirmado}
      callAccessibilityLabel="Confirmar el número secundario y elegir llamada telefónica o WhatsApp"
    />
  </>
);

const styles = StyleSheet.create({
  sectionHeader: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  imagenesDomicilio: {
    marginBottom: spacing.lg,
  },
});
