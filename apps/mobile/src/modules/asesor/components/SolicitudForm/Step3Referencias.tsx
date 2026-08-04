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
    if (!data.referencia1Nombre?.trim()) newErrors.referencia1Nombre = 'Campo obligatorio';
    if (!data.referencia1Parentesco?.trim()) newErrors.referencia1Parentesco = 'Campo obligatorio';
    if (!data.referencia1Telefono?.trim()) newErrors.referencia1Telefono = 'Campo obligatorio';

    // Referencia 2
    if (!data.referencia2Nombre?.trim()) newErrors.referencia2Nombre = 'Campo obligatorio';
    if (!data.referencia2Parentesco?.trim()) newErrors.referencia2Parentesco = 'Campo obligatorio';
    if (!data.referencia2Telefono?.trim()) newErrors.referencia2Telefono = 'Campo obligatorio';

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
          value={data.referencia1Nombre || ''}
          onChangeText={(val) => updateField('referencia1Nombre', normalizeUppercaseText(val))}
          error={errors.referencia1Nombre}
          placeholder="PEDRO LÓPEZ"
        />

        <SelectorField
          label="Parentesco *"
          value={data.referencia1Parentesco || ''}
          onPress={() => openSelector('referencia1Parentesco')}
          error={errors.referencia1Parentesco}
          placeholder="Seleccionar"
        />

        <FormField
          label="Teléfono *"
          value={data.referencia1Telefono || ''}
          onChangeText={(val) => updateField('referencia1Telefono', normalizePhone(val))}
          error={errors.referencia1Telefono}
          keyboardType="phone-pad"
          placeholder="33 1234 5678"
          maxLength={12}
        />

        <FormField
          label="Dirección"
          value={data.referencia1Direccion || ''}
          onChangeText={(val) => updateField('referencia1Direccion', normalizeUppercaseText(val))}
          placeholder="CALLE Y NÚMERO"
        />
      </Card>

      {/* Referencia 2 */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>REFERENCIA PERSONAL 2</Text>

        <FormField
          label="Nombre Completo *"
          value={data.referencia2Nombre || ''}
          onChangeText={(val) => updateField('referencia2Nombre', normalizeUppercaseText(val))}
          error={errors.referencia2Nombre}
          placeholder="ANA GARCÍA"
        />

        <SelectorField
          label="Parentesco *"
          value={data.referencia2Parentesco || ''}
          onPress={() => openSelector('referencia2Parentesco')}
          error={errors.referencia2Parentesco}
          placeholder="Seleccionar"
        />

        <FormField
          label="Teléfono *"
          value={data.referencia2Telefono || ''}
          onChangeText={(val) => updateField('referencia2Telefono', normalizePhone(val))}
          error={errors.referencia2Telefono}
          keyboardType="phone-pad"
          placeholder="33 1234 5678"
          maxLength={12}
        />

        <FormField
          label="Dirección"
          value={data.referencia2Direccion || ''}
          onChangeText={(val) => updateField('referencia2Direccion', normalizeUppercaseText(val))}
          placeholder="CALLE Y NÚMERO"
        />
      </Card>

      {/* Pareja */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>DATOS DE LA PAREJA (Opcional)</Text>

        <FormField
          label="Nombre de la Pareja"
          value={data.parejaNombre || ''}
          onChangeText={(val) => updateField('parejaNombre', normalizeUppercaseText(val))}
          placeholder="MARÍA HERNÁNDEZ"
        />

        <FormField
          label="Actividad"
          value={data.parejaActividad || ''}
          onChangeText={(val) => updateField('parejaActividad', normalizeUppercaseText(val))}
          placeholder="COMERCIANTE"
        />

        <FormField
          label="Ingreso Semanal"
          value={data.parejaIngresoSemanal || ''}
          onChangeText={(val) => updateField('parejaIngresoSemanal', normalizeDigits(val))}
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
