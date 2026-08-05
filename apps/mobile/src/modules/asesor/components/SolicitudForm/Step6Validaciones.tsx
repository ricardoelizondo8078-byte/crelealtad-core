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
    if (!data.tiene_medidor_luz) newErrors.tiene_medidor_luz = 'Campo obligatorio';
    if (!data.vive_max_5km_tesorera) newErrors.vive_max_5km_tesorera = 'Campo obligatorio';
    if (!data.tieneMenos70Anios) newErrors.tieneMenos70Anios = 'Campo obligatorio';
    if (!data.monto_solicitado) {
      newErrors.monto_solicitado = 'Campo obligatorio';
    } else {
      const monto = parseFloat(data.monto_solicitado);
      if (monto > MAX_SOLICITUD_AMOUNT) {
        newErrors.monto_solicitado = `Máximo ${formatCurrency(MAX_SOLICITUD_AMOUNT)}`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <ScrollView ref={scrollViewRef} style={styles.container}>
      <Card style={styles.card}>
        <SelectorField label="¿Tiene medidor de luz sin adeudo? *" value={data.tiene_medidor_luz || ''} onPress={() => openSelector('tiene_medidor_luz')} error={errors.tiene_medidor_luz} placeholder="Seleccionar" />
        <SelectorField label="¿Vive a máximo 5 km de la tesorera? *" value={data.vive_max_5km_tesorera || ''} onPress={() => openSelector('vive_max_5km_tesorera')} error={errors.vive_max_5km_tesorera} placeholder="Seleccionar" />
        <SelectorField label="¿Tiene menos de 70 años? *" value={data.tieneMenos70Anios || ''} onPress={() => openSelector('tiene_menos_70_anios')} error={errors.tieneMenos70Anios} placeholder="Seleccionar" />
        <FormField label="Monto Solicitado *" value={data.monto_solicitado || ''} onChangeText={(val) => updateField('monto_solicitado', normalizeDigits(val))} error={errors.monto_solicitado} keyboardType="number-pad" placeholder="5000" />
      </Card>
      <View style={styles.footer}>
        <SecondaryButton title="Anterior" onPress={onBack} style={{ marginBottom: spacing.sm }} />
        <PrimaryButton title="Siguiente" onPress={() => validateStep() && onNext()} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({ container: { flex: 1 }, card: { margin: spacing.md }, footer: { padding: spacing.md } });
