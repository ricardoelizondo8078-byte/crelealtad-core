import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import { Card, FormField, PrimaryButton, SecondaryButton, SelectorField } from '../../../../components/ui';
import { SolicitudFormData } from '../../types/solicitud.types';
import { spacing, colors } from '../../../../theme/tokens';
import { normalizeUppercaseText, normalizePhone, normalizeDigits } from '../../../../utils/input';

interface Step3Props {
  data: SolicitudFormData;
  onNext: () => void;
  onBack: () => void;
  updateField: (field: string, value: any) => void;
  openSelector: (field: string) => void;
  scrollViewRef: any;
}

export const Step3Referencias: React.FC<Step3Props> = ({
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

    // Referencia 1
    if (!data.ref1_nombre?.trim()) newErrors.ref1_nombre = 'Campo obligatorio';
    if (!data.ref1_parentesco?.trim()) newErrors.ref1_parentesco = 'Campo obligatorio';
    if (!data.ref1_telefono?.trim()) newErrors.ref1_telefono = 'Campo obligatorio';

    // Referencia 2
    if (!data.ref2_nombre?.trim()) newErrors.ref2_nombre = 'Campo obligatorio';
    if (!data.ref2_parentesco?.trim()) newErrors.ref2_parentesco = 'Campo obligatorio';
    if (!data.ref2_telefono?.trim()) newErrors.ref2_telefono = 'Campo obligatorio';

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
      {/* Referencia 1 */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>REFERENCIA PERSONAL 1</Text>

        <FormField
          label="Nombre Completo *"
          value={data.ref1_nombre || ''}
          onChangeText={(val) => updateField('ref1_nombre', normalizeUppercaseText(val))}
          error={errors.ref1_nombre}
          placeholder="PEDRO LÓPEZ"
        />

        <SelectorField
          label="Parentesco *"
          value={data.ref1_parentesco || ''}
          onPress={() => openSelector('ref1_parentesco')}
          error={errors.ref1_parentesco}
          placeholder="Seleccionar"
        />

        <FormField
          label="Teléfono *"
          value={data.ref1_telefono || ''}
          onChangeText={(val) => updateField('ref1_telefono', normalizePhone(val))}
          error={errors.ref1_telefono}
          keyboardType="phone-pad"
          placeholder="33 1234 5678"
          maxLength={12}
        />

        <FormField
          label="Dirección"
          value={data.ref1_direccion || ''}
          onChangeText={(val) => updateField('ref1_direccion', normalizeUppercaseText(val))}
          placeholder="CALLE Y NÚMERO"
        />
      </Card>

      {/* Referencia 2 */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>REFERENCIA PERSONAL 2</Text>

        <FormField
          label="Nombre Completo *"
          value={data.ref2_nombre || ''}
          onChangeText={(val) => updateField('ref2_nombre', normalizeUppercaseText(val))}
          error={errors.ref2_nombre}
          placeholder="ANA GARCÍA"
        />

        <SelectorField
          label="Parentesco *"
          value={data.ref2_parentesco || ''}
          onPress={() => openSelector('ref2_parentesco')}
          error={errors.ref2_parentesco}
          placeholder="Seleccionar"
        />

        <FormField
          label="Teléfono *"
          value={data.ref2_telefono || ''}
          onChangeText={(val) => updateField('ref2_telefono', normalizePhone(val))}
          error={errors.ref2_telefono}
          keyboardType="phone-pad"
          placeholder="33 1234 5678"
          maxLength={12}
        />

        <FormField
          label="Dirección"
          value={data.ref2_direccion || ''}
          onChangeText={(val) => updateField('ref2_direccion', normalizeUppercaseText(val))}
          placeholder="CALLE Y NÚMERO"
        />
      </Card>

      {/* Pareja */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>DATOS DE LA PAREJA (Opcional)</Text>

        <FormField
          label="Nombre de la Pareja"
          value={data.pareja_nombre || ''}
          onChangeText={(val) => updateField('pareja_nombre', normalizeUppercaseText(val))}
          placeholder="MARÍA HERNÁNDEZ"
        />

        <FormField
          label="Actividad"
          value={data.pareja_actividad || ''}
          onChangeText={(val) => updateField('pareja_actividad', normalizeUppercaseText(val))}
          placeholder="COMERCIANTE"
        />

        <FormField
          label="Ingreso Semanal"
          value={data.pareja_ingreso_semanal || ''}
          onChangeText={(val) => updateField('pareja_ingreso_semanal', normalizeDigits(val))}
          keyboardType="number-pad"
          placeholder="2000"
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  footer: { padding: spacing.md },
});
