import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PickerField } from '../../components/ui/PickerField';
import { StickySectionHeader } from '../../components/ui/StickySectionHeader';
import { TextInput } from '../../components/ui/TextInput';
import { colors, radius, spacing, typography } from '../../theme/tokens';

export interface ProductoFinancieraFormulario {
  semanas: string;
  tasa: string;
  seguro: string;
  apertura: string;
  retencion: string;
  base: string;
  refinanciamiento: string;
  descripcion: string;
}

export interface SucursalFinancieraFormulario {
  zona: string;
  direccion: string;
  numeroAsesoras: string;
  valorSucursal: string;
}

interface FinancieraProductMarketFieldsProps {
  producto: ProductoFinancieraFormulario;
  numeroSucursales: string;
  sucursales: SucursalFinancieraFormulario[];
  onProductoChange: (campo: keyof ProductoFinancieraFormulario, value: string) => void;
  onNumeroSucursalesChange: (value: string) => void;
  onSucursalChange: (
    index: number,
    campo: keyof SucursalFinancieraFormulario,
    value: string,
  ) => void;
  disabled?: boolean;
}

const CAMPOS_PRODUCTO: {
  campo: keyof ProductoFinancieraFormulario;
  label: string;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad';
}[] = [
  { campo: 'semanas', label: 'Semanas', keyboardType: 'number-pad' },
  { campo: 'tasa', label: 'Tasa', keyboardType: 'decimal-pad' },
  { campo: 'seguro', label: 'Seguro' },
  { campo: 'apertura', label: 'Apertura' },
  { campo: 'retencion', label: 'Retención' },
  { campo: 'base', label: 'Base' },
  { campo: 'refinanciamiento', label: 'Refinanciamiento' },
];

export const OPCIONES_NUMERO_SUCURSALES = Array.from(
  { length: 11 },
  (_, index) => String(index),
);

const cantidadSucursales = (value: string): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 10) : 0;
};

export const FinancieraProductMarketFields: React.FC<
  FinancieraProductMarketFieldsProps
> = ({
  producto,
  numeroSucursales,
  sucursales,
  onProductoChange,
  onNumeroSucursalesChange,
  onSucursalChange,
  disabled = false,
}) => {
  const totalSucursales = cantidadSucursales(numeroSucursales);

  return (
    <>
      <StickySectionHeader
        title="PRODUCTO"
        moduleTheme="parameters"
        placement="standalone"
      />
      {CAMPOS_PRODUCTO.map(({ campo, label, keyboardType }) => (
        <TextInput
          key={campo}
          label={label}
          accessibilityLabel={label}
          value={producto[campo]}
          onChangeText={(value) => onProductoChange(campo, value)}
          keyboardType={keyboardType}
          moduleTheme="parameters"
          editable={!disabled}
          strongBorder
        />
      ))}
      <TextInput
        label="Descripción"
        accessibilityLabel="Descripción"
        value={producto.descripcion}
        onChangeText={(value) => onProductoChange('descripcion', value)}
        moduleTheme="parameters"
        multiline
        numberOfLines={5}
        maxLength={10000}
        textAlignVertical="top"
        editable={!disabled}
        strongBorder
      />

      <StickySectionHeader
        title="PARTICIPACIÓN MERCADO"
        moduleTheme="parameters"
        placement="standalone"
      />
      <PickerField
        label="Número de sucursales"
        value={numeroSucursales}
        options={OPCIONES_NUMERO_SUCURSALES}
        onSelect={onNumeroSucursalesChange}
        placeholder="Seleccionar..."
        moduleTheme="parameters"
        confirmSelection
        disabled={disabled}
      />

      {Array.from({ length: totalSucursales }, (_, index) => {
        const sucursal = sucursales[index] ?? {
          zona: '',
          direccion: '',
          numeroAsesoras: '',
          valorSucursal: '',
        };
        return (
          <View key={`sucursal-${index + 1}`} style={styles.sucursalCard}>
            <Text allowFontScaling={false} style={styles.sucursalTitle}>
              Sucursal {index + 1}
            </Text>
            <TextInput
              label="Zona"
              accessibilityLabel={`Zona de sucursal ${index + 1}`}
              value={sucursal.zona}
              onChangeText={(value) => onSucursalChange(index, 'zona', value)}
              moduleTheme="parameters"
              editable={!disabled}
              strongBorder
            />
            <TextInput
              label="Dirección"
              accessibilityLabel={`Dirección de sucursal ${index + 1}`}
              value={sucursal.direccion}
              onChangeText={(value) => onSucursalChange(index, 'direccion', value)}
              moduleTheme="parameters"
              multiline
              numberOfLines={2}
              editable={!disabled}
              strongBorder
            />
            <TextInput
              label="# Asesoras"
              accessibilityLabel={`Número de asesoras de sucursal ${index + 1}`}
              value={sucursal.numeroAsesoras}
              onChangeText={(value) => onSucursalChange(
                index,
                'numeroAsesoras',
                value.replace(/\D/g, ''),
              )}
              keyboardType="number-pad"
              moduleTheme="parameters"
              editable={!disabled}
              strongBorder
            />
            <TextInput
              label="Valor $ de sucursal"
              accessibilityLabel={`Valor de sucursal ${index + 1}`}
              value={sucursal.valorSucursal}
              onChangeText={(value) => onSucursalChange(index, 'valorSucursal', value)}
              keyboardType="decimal-pad"
              moduleTheme="parameters"
              editable={!disabled}
              strongBorder
            />
          </View>
        );
      })}
    </>
  );
};

const styles = StyleSheet.create({
  sucursalCard: {
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[400],
    borderRadius: radius.md,
    backgroundColor: colors.gray[50],
  },
  sucursalTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
});
