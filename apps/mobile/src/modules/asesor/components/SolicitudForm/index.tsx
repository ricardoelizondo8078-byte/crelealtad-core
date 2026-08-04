import React, { lazy, Suspense } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { WizardNavigation } from './WizardNavigation';
import { SolicitudFormData, DocumentoRequerido } from '../../types/solicitud.types';
import { colors } from '../../../../theme/tokens';

// Lazy load de steps para mejor performance
const Step1PersonalData = lazy(() => import('./Step1PersonalData').then(m => ({ default: m.Step1PersonalData })));
const Step2Domicilio = lazy(() => import('./Step2Domicilio').then(m => ({ default: m.Step2Domicilio })));
const Step3Referencias = lazy(() => import('./Step3Referencias').then(m => ({ default: m.Step3Referencias })));
const Step4Negocio = lazy(() => import('./Step4Negocio').then(m => ({ default: m.Step4Negocio })));
const Step5Beneficiario = lazy(() => import('./Step5Beneficiario').then(m => ({ default: m.Step5Beneficiario })));
const Step6Validaciones = lazy(() => import('./Step6Validaciones').then(m => ({ default: m.Step6Validaciones })));
const Step7Documentos = lazy(() => import('./Step7Documentos').then(m => ({ default: m.Step7Documentos })));

interface SolicitudFormProps {
  step: number;
  data: SolicitudFormData;
  documentos: DocumentoRequerido[];
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
  updateField: (field: string, value: any) => void;
  openSelector: (field: string) => void;
  updateDocument: (docId: string, updates: Partial<DocumentoRequerido>) => void;
  scrollViewRef: any;
}

export const SolicitudForm: React.FC<SolicitudFormProps> = ({
  step,
  data,
  documentos,
  onNext,
  onBack,
  onSubmit,
  updateField,
  openSelector,
  updateDocument,
  scrollViewRef,
}) => {
  const renderStep = () => {
    const stepProps = {
      data,
      onNext,
      onBack,
      updateField,
      openSelector,
      scrollViewRef,
    };

    switch (step) {
      case 1:
        return <Step1PersonalData {...stepProps} />;
      case 2:
        return <Step2Domicilio {...stepProps} />;
      case 3:
        return <Step3Referencias {...stepProps} />;
      case 4:
        return <Step4Negocio {...stepProps} />;
      case 5:
        return <Step5Beneficiario {...stepProps} />;
      case 6:
        return <Step6Validaciones {...stepProps} />;
      case 7:
        return (
          <Step7Documentos
            data={data}
            documentos={documentos}
            onBack={onBack}
            onSubmit={onSubmit}
            updateDocument={updateDocument}
            scrollViewRef={scrollViewRef}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <WizardNavigation currentStep={step} />
      <Suspense fallback={<ActivityIndicator size="large" color={colors.primary} />}>
        {renderStep()}
      </Suspense>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
