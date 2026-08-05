import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, FormField, PrimaryButton, SecondaryButton, SelectorField } from '../../../../components/ui';
import { SolicitudFormData } from '../../types/solicitud.types';
import { spacing } from '../../../../theme/tokens';
import { normalizeUppercaseText, normalizeDigits } from '../../../../utils/input';

interface Step4Props {
  data: SolicitudFormData;
  onNext: () => void;
  onBack: () => void;
  updateField: (field: string, value: any) => void;
  openSelector: (field: string) => void;
  scrollViewRef: any;
}

export const Step4Negocio: React.FC<Step4Props> = ({ data, onNext, onBack, updateField, openSelector, scrollViewRef }) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Auto-calcular total
  useEffect(() => {
    const ingreso = parseFloat(data.negocio_ingreso_semanal || '0');
    const otros = parseFloat(data.negocio_otros_ingresos || '0');
    const gastos = parseFloat(data.negocio_gastos || '0');
    const total = ingreso + otros - gastos;
    updateField('negocioTotal', total.toString());
  }, [data.negocio_ingreso_semanal, data.negocio_otros_ingresos, data.negocio_gastos]);

  const validateStep = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!data.negocio_giro?.trim()) newErrors.negocio_giro = 'Campo obligatorio';
    if (!data.negocio_ingreso_semanal?.trim()) newErrors.negocio_ingreso_semanal = 'Campo obligatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <ScrollView ref={scrollViewRef} style={styles.container}>
      <Card style={styles.card}>
        <FormField label="Giro del Negocio *" value={data.negocio_giro || ''} onChangeText={(val) => updateField('negocio_giro', normalizeUppercaseText(val))} error={errors.negocio_giro} placeholder="ABARROTES" />
        <FormField label="Domicilio del Negocio" value={data.negocio_domicilio || ''} onChangeText={(val) => updateField('negocio_domicilio', normalizeUppercaseText(val))} placeholder="CALLE Y NÚMERO" />
        <FormField label="Código Postal" value={data.negocio_codigo_postal || ''} onChangeText={(val) => updateField('negocio_codigo_postal', normalizeDigits(val))} keyboardType="number-pad" maxLength={5} />
        <SelectorField label="Colonia" value={data.negocio_colonia || ''} onPress={() => openSelector('negocio_colonia')} placeholder="Seleccionar" />
        <SelectorField label="Municipio" value={data.negocio_municipio || ''} onPress={() => openSelector('negocio_municipio')} placeholder="Seleccionar" />
        <FormField label="Estado" value={data.negocio_estado || ''} onChangeText={(val) => updateField('negocio_estado', normalizeUppercaseText(val))} placeholder="JALISCO" />
        <SelectorField label="¿Desde Cuándo?" value={data.negocio_desde_cuando || ''} onPress={() => openSelector('negocio_desde_cuando')} placeholder="Seleccionar" />
        <FormField label="Ingreso Semanal *" value={data.negocio_ingreso_semanal || ''} onChangeText={(val) => updateField('negocio_ingreso_semanal', normalizeDigits(val))} error={errors.negocio_ingreso_semanal} keyboardType="number-pad" placeholder="3500" />
        <FormField label="Otros Ingresos" value={data.negocio_otros_ingresos || ''} onChangeText={(val) => updateField('negocio_otros_ingresos', normalizeDigits(val))} keyboardType="number-pad" placeholder="500" />
        <FormField label="Gastos Semanales" value={data.negocio_gastos || ''} onChangeText={(val) => updateField('negocio_gastos', normalizeDigits(val))} keyboardType="number-pad" placeholder="1500" />
        <FormField label="Total (calculado)" value={data.negocioTotal || '0'} editable={false} />
      </Card>
      <View style={styles.footer}>
        <SecondaryButton title="Anterior" onPress={onBack} style={{ marginBottom: spacing.sm }} />
        <PrimaryButton title="Siguiente" onPress={() => validateStep() && onNext()} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({ container: { flex: 1 }, card: { margin: spacing.md }, footer: { padding: spacing.md } });
