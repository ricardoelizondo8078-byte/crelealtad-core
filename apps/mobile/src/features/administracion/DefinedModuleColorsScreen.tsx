import React from 'react';
import { DEFINED_MODULE_COLOR_SAMPLES } from './defined-module-colors.catalog';
import { ModuleColorReviewScreen } from './ModuleColorReviewScreen';

interface DefinedModuleColorsScreenProps {
  onBack: () => void;
}

export const DefinedModuleColorsScreen: React.FC<DefinedModuleColorsScreenProps> = ({ onBack }) => (
  <ModuleColorReviewScreen
    onBack={onBack}
    items={DEFINED_MODULE_COLOR_SAMPLES}
    helperText="Documentación, Verificación y Análisis tienen un color definido."
  />
);
