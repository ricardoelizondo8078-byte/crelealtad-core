import React, { useEffect, useState } from 'react';
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
import {
  codigoParametroEntrevista,
  etiquetaParametroEntrevista,
  useOpcionesEntrevista,
} from './verificacion-entrevista-parametros';

const CONVIVIENTES_RESPALDO: Record<string, string> = {
  'Cónyuge': 'CONYUGE',
  Conyuge: 'CONYUGE',
  Hijos: 'HIJOS',
  Padres: 'PADRES',
  Hermanos: 'HERMANOS',
  Otros: 'OTROS',
};

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
}) => {
  const opcionesMotivoNoVive = useOpcionesEntrevista('MOTIVO_NO_VIVE_DOMICILIO', MOTIVOS_NO_VIVE_EN_DOMICILIO);
  const opcionesTipoDomicilio = useOpcionesEntrevista('TIPO_DOMICILIO', ['Renta', 'Dueña', 'Familiar']);
  const opcionesFamiliarDomicilio = useOpcionesEntrevista('FAMILIAR_DOMICILIO', FAMILIARES_DOMICILIO);
  const opcionesAntiguedadDomicilio = useOpcionesEntrevista('ANTIGUEDAD_DOMICILIO', ['0-1 años', '1-3 años', '3+ años']);
  const opcionesPersonasCasa = useOpcionesEntrevista('PERSONAS_VIVEN_CASA', ['1', '2', '3', '4', '5', '≥6']);
  const opcionesConvivientes = useOpcionesEntrevista('CONVIVIENTES', ['Cónyuge', 'Hijos', 'Padres', 'Hermanos', 'Otros']);
  const esDomicilioFamiliar = codigoParametroEntrevista('TIPO_DOMICILIO', tipoDomicilio, {
    Renta: 'RENTA', Dueña: 'PROPIA', Familiar: 'FAMILIAR',
  }) === 'FAMILIAR';
  const [abrirMotivoNoVive, setAbrirMotivoNoVive] = useState(false);
  const [abrirFamiliarDomicilio, setAbrirFamiliarDomicilio] = useState(false);

  useEffect(() => {
    const normalizados = [...new Set(quienViveConUsted.map((etiqueta) => {
      const codigo = codigoParametroEntrevista('CONVIVIENTES', etiqueta, CONVIVIENTES_RESPALDO);
      return codigo
        ? etiquetaParametroEntrevista('CONVIVIENTES', codigo, CONVIVIENTES_RESPALDO) || etiqueta
        : etiqueta;
    }))];
    if (
      normalizados.length !== quienViveConUsted.length
      || normalizados.some((etiqueta, indice) => etiqueta !== quienViveConUsted[indice])
    ) {
      onQuienViveConUstedChange(normalizados);
    }
  }, [onQuienViveConUstedChange, opcionesConvivientes, quienViveConUsted]);

  return (
    <>
    <View style={styles.sectionHeader}>
      <StickySectionHeader title="DATOS PERSONALES" moduleTheme="verification" />
    </View>

    <SelectorField
      label={`${nombreIntegrante}, ¿vive en este domicilio?`}
      value={viveEnDomicilioDeclarado}
      options={['Sí', 'No']}
      onSelect={(respuesta) => {
        setAbrirMotivoNoVive(respuesta === 'No');
        onViveEnDomicilioChange(respuesta);
        onMotivoNoViveEnDomicilioChange('');
      }}
      moduleTheme="verification"
      required
    />

    {viveEnDomicilioDeclarado === 'No' ? (
      <PickerField
        key={`motivo-no-vive-${abrirMotivoNoVive && !motivoNoViveEnDomicilio.trim() ? 'abrir' : 'cerrado'}`}
        label="¿Por qué no vive en este domicilio?"
        value={motivoNoViveEnDomicilio}
        options={[...opcionesMotivoNoVive]}
        onSelect={(value) => {
          setAbrirMotivoNoVive(false);
          onMotivoNoViveEnDomicilioChange(value);
        }}
        placeholder="Seleccionar motivo"
        moduleTheme="verification"
        autoOpen={abrirMotivoNoVive && !motivoNoViveEnDomicilio.trim()}
        confirmSelection
        highlightSelectedValue
        selectionTone="danger"
        required
      />
    ) : null}

    <SelectorField
      label="¿Renta, o es Dueña del domicilio?"
      value={tipoDomicilio}
      options={[...opcionesTipoDomicilio]}
      onSelect={(opcion) => {
        const familiar = codigoParametroEntrevista('TIPO_DOMICILIO', opcion, {
          Renta: 'RENTA', Dueña: 'PROPIA', Familiar: 'FAMILIAR',
        }) === 'FAMILIAR';
        setAbrirFamiliarDomicilio(familiar);
        onTipoDomicilioChange(opcion);
        if (!familiar) onFamiliarDomicilioChange('');
      }}
      moduleTheme="verification"
      required
    />

    {esDomicilioFamiliar ? (
      <PickerField
        key={`familiar-domicilio-${abrirFamiliarDomicilio && !familiarDomicilio.trim() ? 'abrir' : 'cerrado'}`}
        label="¿De qué familiar es el domicilio?"
        value={familiarDomicilio}
        options={[...opcionesFamiliarDomicilio]}
        onSelect={(value) => {
          setAbrirFamiliarDomicilio(false);
          onFamiliarDomicilioChange(value);
        }}
        placeholder="Seleccionar familiar"
        moduleTheme="verification"
        autoOpen={abrirFamiliarDomicilio && !familiarDomicilio.trim()}
        confirmSelection
        highlightSelectedValue
        required
      />
    ) : null}

    <SelectorField
      label="¿Hace cuántos años vive en este domicilio?"
      value={aniosEnDomicilio}
      options={[...opcionesAntiguedadDomicilio]}
      onSelect={onAniosEnDomicilioChange}
      moduleTheme="verification"
      required
    />

    <SelectorField
      label="¿Cuántas personas viven en casa?"
      value={personasVivenCasa}
      options={[...opcionesPersonasCasa]}
      onSelect={onPersonasVivenCasaChange}
      moduleTheme="verification"
      variant="countBubbles"
      required
    />

    <MultiSelectField
      label="¿Quién vive actualmente con usted?"
      value={quienViveConUsted}
      options={[...opcionesConvivientes]}
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
};

const styles = StyleSheet.create({
  sectionHeader: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  imagenesDomicilio: {
    marginBottom: spacing.lg,
  },
});
