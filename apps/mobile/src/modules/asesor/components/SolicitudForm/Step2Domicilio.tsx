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

    if (!data.domCalle?.trim()) newErrors.domCalle = 'Campo obligatorio';
    if (!data.domNumExt?.trim()) newErrors.domNumExt = 'Campo obligatorio';
    if (!data.domCodigoPostal?.trim()) newErrors.domCodigoPostal = 'Campo obligatorio';
    if (!data.domColonia?.trim()) newErrors.domColonia = 'Campo obligatorio';
    if (!data.domMunicipio?.trim()) newErrors.domMunicipio = 'Campo obligatorio';
    if (!data.domEstado?.trim()) newErrors.domEstado = 'Campo obligatorio';

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
          value={data.domCalle || ''}
          onChangeText={(val) => updateField('domCalle', normalizeUppercaseText(val))}
          error={errors.domCalle}
          placeholder="AV. JUÁREZ"
        />

        <FormField
          label="Número Exterior *"
          value={data.domNumExt || ''}
          onChangeText={(val) => updateField('domNumExt', normalizeUppercaseText(val))}
          error={errors.domNumExt}
          placeholder="123"
        />

        <FormField
          label="Número Interior"
          value={data.domNumInt || ''}
          onChangeText={(val) => updateField('domNumInt', normalizeUppercaseText(val))}
          placeholder="DEPTO 2"
        />

        <FormField
          label="Entre Calles"
          value={data.domEntreCalles || ''}
          onChangeText={(val) => updateField('domEntreCalles', normalizeUppercaseText(val))}
          placeholder="HIDALGO Y MORELOS"
        />

        <FormField
          label="Código Postal *"
          value={data.domCodigoPostal || ''}
          onChangeText={(val) => updateField('domCodigoPostal', normalizeDigits(val))}
          error={errors.domCodigoPostal}
          keyboardType="number-pad"
          placeholder="44100"
          maxLength={5}
        />

        <SelectorField
          label="Colonia *"
          value={data.domColonia || ''}
          onPress={() => openSelector('colonia')}
          error={errors.domColonia}
          placeholder="Seleccionar"
        />

        <SelectorField
          label="Municipio *"
          value={data.domMunicipio || ''}
          onPress={() => openSelector('municipio')}
          error={errors.domMunicipio}
          placeholder="Seleccionar"
        />

        <FormField
          label="Estado *"
          value={data.domEstado || ''}
          onChangeText={(val) => updateField('domEstado', normalizeUppercaseText(val))}
          error={errors.domEstado}
          placeholder="JALISCO"
        />

        <FormField
          label="Teléfono de Domicilio"
          value={data.domTelefono || ''}
          onChangeText={(val) => updateField('domTelefono', normalizePhone(val))}
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
