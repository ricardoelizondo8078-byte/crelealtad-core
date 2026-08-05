import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, FormField, PrimaryButton, SecondaryButton, SelectorField } from '../../../../components/ui';
import { SolicitudFormData } from '../../types/solicitud.types';
import { spacing } from '../../../../theme/tokens';
import { normalizeUppercaseText, normalizePhone } from '../../../../utils/input';

interface Step5Props {
  data: SolicitudFormData;
  onNext: () => void;
  onBack: () => void;
  updateField: (field: string, value: any) => void;
  openSelector: (field: string) => void;
  scrollViewRef: any;
}

export const Step5Beneficiario: React.FC<Step5Props> = ({ data, onNext, onBack, updateField, openSelector, scrollViewRef }) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateStep = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!data.beneficiario_nombre?.trim()) newErrors.beneficiario_nombre = 'Campo obligatorio';
    if (!data.beneficiario_parentesco?.trim()) newErrors.beneficiario_parentesco = 'Campo obligatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <ScrollView ref={scrollViewRef} style={styles.container}>
      <Card style={styles.card}>
        <FormField label="Nombre del Beneficiario *" value={data.beneficiario_nombre || ''} onChangeText={(val) => updateField('beneficiario_nombre', normalizeUppercaseText(val))} error={errors.beneficiario_nombre} placeholder="MARÍA PÉREZ" />
        <SelectorField label="Parentesco *" value={data.beneficiario_parentesco || ''} onPress={() => openSelector('beneficiario_parentesco')} error={errors.beneficiario_parentesco} placeholder="Seleccionar" />
        <FormField label="Teléfono" value={data.beneficiario_telefono || ''} onChangeText={(val) => updateField('beneficiario_telefono', normalizePhone(val))} keyboardType="phone-pad" placeholder="33 1234 5678" maxLength={12} />
        <FormField label="Dirección" value={data.beneficiario_direccion || ''} onChangeText={(val) => updateField('beneficiario_direccion', normalizeUppercaseText(val))} placeholder="CALLE Y NÚMERO" />
      </Card>
      <View style={styles.footer}>
        <SecondaryButton title="Anterior" onPress={onBack} style={{ marginBottom: spacing.sm }} />
        <PrimaryButton title="Siguiente" onPress={() => validateStep() && onNext()} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({ container: { flex: 1 }, card: { margin: spacing.md }, footer: { padding: spacing.md } });
