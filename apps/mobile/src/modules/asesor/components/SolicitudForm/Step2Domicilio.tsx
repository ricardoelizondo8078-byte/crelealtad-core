import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, FormField, PrimaryButton, SecondaryButton, SelectorField } from '../../../../components/ui';
import { SolicitudFormData } from '../../types/solicitud.types';
import { spacing } from '../../../../theme/tokens';
import { normalizeUppercaseText, normalizePhone, normalizeDigits } from '../../../../utils/input';

interface Step2Props {
  data: SolicitudFormData;
  onNext: () => void;
  onBack: () => void;
  updateField: (field: string, value: any) => void;
  openSelector: (field: string) => void;
  scrollViewRef: any;
}

export const Step2Domicilio: React.FC<Step2Props> = ({
  data,
  onNext,
  onBack,
  updateField,
  openSelector,
  scrollViewRef,
}) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateStep = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!data.dom_calle?.trim()) newErrors.dom_calle = 'Campo obligatorio';
    if (!data.dom_num_ext?.trim()) newErrors.dom_num_ext = 'Campo obligatorio';
    if (!data.dom_codigo_postal?.trim()) newErrors.dom_codigo_postal = 'Campo obligatorio';
    if (!data.dom_colonia?.trim()) newErrors.dom_colonia = 'Campo obligatorio';
    if (!data.dom_municipio?.trim()) newErrors.dom_municipio = 'Campo obligatorio';
    if (!data.dom_estado?.trim()) newErrors.dom_estado = 'Campo obligatorio';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      onNext();
    }
  };

  return (
    <ScrollView ref={scrollViewRef} style={styles.container} showsVerticalScrollIndicator={false}>
      <Card style={styles.card}>
        <FormField
          label="Calle *"
          value={data.dom_calle || ''}
          onChangeText={(val) => updateField('dom_calle', normalizeUppercaseText(val))}
          error={errors.dom_calle}
          placeholder="AV. JUÁREZ"
        />

        <FormField
          label="Número Exterior *"
          value={data.dom_num_ext || ''}
          onChangeText={(val) => updateField('dom_num_ext', normalizeUppercaseText(val))}
          error={errors.dom_num_ext}
          placeholder="123"
        />

        <FormField
          label="Número Interior"
          value={data.dom_num_int || ''}
          onChangeText={(val) => updateField('dom_num_int', normalizeUppercaseText(val))}
          placeholder="DEPTO 2"
        />

        <FormField
          label="Entre Calles"
          value={data.dom_entre_calles || ''}
          onChangeText={(val) => updateField('dom_entre_calles', normalizeUppercaseText(val))}
          placeholder="HIDALGO Y MORELOS"
        />

        <FormField
          label="Código Postal *"
          value={data.dom_codigo_postal || ''}
          onChangeText={(val) => updateField('dom_codigo_postal', normalizeDigits(val))}
          error={errors.dom_codigo_postal}
          keyboardType="number-pad"
          placeholder="44100"
          maxLength={5}
        />

        <SelectorField
          label="Colonia *"
          value={data.dom_colonia || ''}
          onPress={() => openSelector('colonia')}
          error={errors.dom_colonia}
          placeholder="Seleccionar"
        />

        <SelectorField
          label="Municipio *"
          value={data.dom_municipio || ''}
          onPress={() => openSelector('municipio')}
          error={errors.dom_municipio}
          placeholder="Seleccionar"
        />

        <FormField
          label="Estado *"
          value={data.dom_estado || ''}
          onChangeText={(val) => updateField('dom_estado', normalizeUppercaseText(val))}
          error={errors.dom_estado}
          placeholder="JALISCO"
        />

        <FormField
          label="Teléfono de Domicilio"
          value={data.dom_telefono || ''}
          onChangeText={(val) => updateField('dom_telefono', normalizePhone(val))}
          keyboardType="phone-pad"
          placeholder="33 1234 5678"
          maxLength={12}
        />
      </Card>

      <View style={styles.footer}>
        <SecondaryButton title="Anterior" onPress={onBack} style={{ marginBottom: spacing.sm }} />
        <PrimaryButton title="Siguiente" onPress={handleNext} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { margin: spacing.md },
  footer: { padding: spacing.md },
});
