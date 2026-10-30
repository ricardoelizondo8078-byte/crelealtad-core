import React from 'react';
import { SelectorField } from '../../components/ui/SelectorField';

export type VisibilidadPopupFinanciera = 'Sí' | 'No';

interface FinancieraPopupVisibilityFieldProps {
  value: VisibilidadPopupFinanciera;
  onChange: (value: VisibilidadPopupFinanciera) => void;
  disabled?: boolean;
}

export const FinancieraPopupVisibilityField: React.FC<
  FinancieraPopupVisibilityFieldProps
> = ({ value, onChange, disabled = false }) => (
  <SelectorField
    label="¿Se muestran en el pop-up?"
    value={value}
    options={['Sí', 'No']}
    onSelect={(nextValue) => onChange(nextValue as VisibilidadPopupFinanciera)}
    moduleTheme="parameters"
    disabled={disabled}
  />
);
