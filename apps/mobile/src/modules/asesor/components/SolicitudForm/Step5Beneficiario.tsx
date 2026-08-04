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
    if (!data.beneficiarioNombre?.trim()) newErrors.beneficiarioNombre = 'Campo obligatorio';
    if (!data.beneficiarioParentesco?.trim()) newErrors.beneficiarioParentesco = 'Campo obligatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <ScrollView ref={scrollViewRef} style={styles.container}>
      <Card style={styles.card}>
        <FormField label="Nombre del Beneficiario *" value={data.beneficiarioNombre || ''} onChangeText={(val) => updateField('beneficiarioNombre', normalizeUppercaseText(val))} error={errors.beneficiarioNombre} placeholder="MARÍA PÉREZ" />
        <SelectorField label="Parentesco *" value={data.beneficiarioParentesco || ''} onPress={() => openSelector('beneficiario_parentesco')} error={errors.beneficiarioParentesco} placeholder="Seleccionar" />
        <FormField label="Teléfono" value={data.beneficiarioTelefono || ''} onChangeText={(val) => updateField('beneficiarioTelefono', normalizePhone(val))} keyboardType="phone-pad" placeholder="33 1234 5678" maxLength={12} />
        <FormField label="Dirección" value={data.beneficiarioDireccion || ''} onChangeText={(val) => updateField('beneficiarioDireccion', normalizeUppercaseText(val))} placeholder="CALLE Y NÚMERO" />
      </Card>
      <View style={styles.footer}>
        <SecondaryButton title="Anterior" onPress={onBack} style={{ marginBottom: spacing.sm }} />
        <PrimaryButton title="Siguiente" onPress={() => validateStep() && onNext()} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({ container: { flex: 1 }, card: { margin: spacing.md }, footer: { padding: spacing.md } });
