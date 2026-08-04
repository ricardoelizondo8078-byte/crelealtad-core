import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, FormField, PrimaryButton, SecondaryButton, SelectorField } from '../../../../components/ui';
import { SolicitudFormData } from '../../types/solicitud.types';
import { YES_NO_OPTIONS } from '../../types/constants';
import { spacing } from '../../../../theme/tokens';
import { normalizeDigits, formatCurrency } from '../../../../utils/currency';
import { MAX_SOLICITUD_AMOUNT } from '../../../../config/parameters';

interface Step6Props {
  data: SolicitudFormData;
  onNext: () => void;
  onBack: () => void;
  updateField: (field: string, value: any) => void;
  openSelector: (field: string) => void;
  scrollViewRef: any;
}

export const Step6Validaciones: React.FC<Step6Props> = ({ data, onNext, onBack, updateField, openSelector, scrollViewRef }) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateStep = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!data.tieneMedidorLuzSinAdeudo) newErrors.tieneMedidorLuzSinAdeudo = 'Campo obligatorio';
    if (!data.viveMaximo5KmTesorera) newErrors.viveMaximo5KmTesorera = 'Campo obligatorio';
    if (!data.tieneMenos70Anios) newErrors.tieneMenos70Anios = 'Campo obligatorio';
    if (!data.montoSolicitado) {
      newErrors.montoSolicitado = 'Campo obligatorio';
    } else {
      const monto = parseFloat(data.montoSolicitado);
      if (monto > MAX_SOLICITUD_AMOUNT) {
        newErrors.montoSolicitado = `Máximo ${formatCurrency(MAX_SOLICITUD_AMOUNT)}`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <ScrollView ref={scrollViewRef} style={styles.container}>
      <Card style={styles.card}>
        <SelectorField label="¿Tiene medidor de luz sin adeudo? *" value={data.tieneMedidorLuzSinAdeudo || ''} onPress={() => openSelector('tieneMedidorLuzSinAdeudo')} error={errors.tieneMedidorLuzSinAdeudo} placeholder="Seleccionar" />
        <SelectorField label="¿Vive a máximo 5 km de la tesorera? *" value={data.viveMaximo5KmTesorera || ''} onPress={() => openSelector('viveMaximo5KmTesorera')} error={errors.viveMaximo5KmTesorera} placeholder="Seleccionar" />
        <SelectorField label="¿Tiene menos de 70 años? *" value={data.tieneMenos70Anios || ''} onPress={() => openSelector('tiene_menos_70_anios')} error={errors.tieneMenos70Anios} placeholder="Seleccionar" />
        <FormField label="Monto Solicitado *" value={data.montoSolicitado || ''} onChangeText={(val) => updateField('montoSolicitado', normalizeDigits(val))} error={errors.montoSolicitado} keyboardType="number-pad" placeholder="5000" />
      </Card>
      <View style={styles.footer}>
        <SecondaryButton title="Anterior" onPress={onBack} style={{ marginBottom: spacing.sm }} />
        <PrimaryButton title="Siguiente" onPress={() => validateStep() && onNext()} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({ container: { flex: 1 }, card: { margin: spacing.md }, footer: { padding: spacing.md } });
