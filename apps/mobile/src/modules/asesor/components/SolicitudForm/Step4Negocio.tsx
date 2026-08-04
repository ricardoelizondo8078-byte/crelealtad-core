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
    const ingreso = parseFloat(data.negocioIngresoSemanal || '0');
    const otros = parseFloat(data.negocioOtrosIngresos || '0');
    const gastos = parseFloat(data.negocioGastos || '0');
    const total = ingreso + otros - gastos;
    updateField('negocioTotal', total.toString());
  }, [data.negocioIngresoSemanal, data.negocioOtrosIngresos, data.negocioGastos]);

  const validateStep = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!data.negocioGiro?.trim()) newErrors.negocioGiro = 'Campo obligatorio';
    if (!data.negocioIngresoSemanal?.trim()) newErrors.negocioIngresoSemanal = 'Campo obligatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <ScrollView ref={scrollViewRef} style={styles.container}>
      <Card style={styles.card}>
        <FormField label="Giro del Negocio *" value={data.negocioGiro || ''} onChangeText={(val) => updateField('negocioGiro', normalizeUppercaseText(val))} error={errors.negocioGiro} placeholder="ABARROTES" />
        <FormField label="Domicilio del Negocio" value={data.negocioDomicilio || ''} onChangeText={(val) => updateField('negocioDomicilio', normalizeUppercaseText(val))} placeholder="CALLE Y NÚMERO" />
        <FormField label="Código Postal" value={data.negocioCodigoPostal || ''} onChangeText={(val) => updateField('negocioCodigoPostal', normalizeDigits(val))} keyboardType="number-pad" maxLength={5} />
        <SelectorField label="Colonia" value={data.negocioColonia || ''} onPress={() => openSelector('negocio_colonia')} placeholder="Seleccionar" />
        <SelectorField label="Municipio" value={data.negocioMunicipio || ''} onPress={() => openSelector('negocio_municipio')} placeholder="Seleccionar" />
        <FormField label="Estado" value={data.negocioEstado || ''} onChangeText={(val) => updateField('negocioEstado', normalizeUppercaseText(val))} placeholder="JALISCO" />
        <SelectorField label="¿Desde Cuándo?" value={data.negocioDesdeCuando || ''} onPress={() => openSelector('negocioDesdeCuando')} placeholder="Seleccionar" />
        <FormField label="Ingreso Semanal *" value={data.negocioIngresoSemanal || ''} onChangeText={(val) => updateField('negocioIngresoSemanal', normalizeDigits(val))} error={errors.negocioIngresoSemanal} keyboardType="number-pad" placeholder="3500" />
        <FormField label="Otros Ingresos" value={data.negocioOtrosIngresos || ''} onChangeText={(val) => updateField('negocioOtrosIngresos', normalizeDigits(val))} keyboardType="number-pad" placeholder="500" />
        <FormField label="Gastos Semanales" value={data.negocioGastos || ''} onChangeText={(val) => updateField('negocioGastos', normalizeDigits(val))} keyboardType="number-pad" placeholder="1500" />
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
