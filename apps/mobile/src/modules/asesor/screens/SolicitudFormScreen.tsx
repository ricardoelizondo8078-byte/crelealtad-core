import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ScreenContainer, AppHeader } from '../../../components/ui';
import { SolicitudForm } from '../components/SolicitudForm';
import { useSolicitudForm } from '../hooks/useSolicitudForm';
import { colors } from '../../../theme/tokens';

interface SolicitudFormScreenProps {
  route: {
    params: {
      integranteId: string;
      integranteNombre?: string;
      groupName?: string;
      integrantePosition?: number;
      integrantesTotal?: number;
      initialStep?: number;
    };
  };
  navigation: any;
}

export const SolicitudFormScreen: React.FC<SolicitudFormScreenProps> = ({ route, navigation }) => {
  const {
    integranteId,
    integranteNombre,
    groupName,
    integrantePosition,
    integrantesTotal,
    initialStep,
  } = route.params;

  const {
    currentStep,
    formData,
    isLoading,
    documentos,
    scrollViewRef,
    handleNext,
    handleBack,
    handleSubmit,
    updateFormData,
    openSelector,
    updateDocument,
  } = useSolicitudForm({
    integranteId,
    integranteNombre,
    initialStep,
    onSaved: () => {
      navigation.goBack();
    },
    onDataChange: (data) => {
      // Callback para actualizar datos en pantalla padre si es necesario
      console.log('Datos actualizados:', data);
    },
  });

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  const title = groupName
    ? `${groupName} - ${integrantePosition}/${integrantesTotal}`
    : 'Nueva Solicitud';

  return (
    <ScreenContainer>
      <AppHeader
        title={title}
        onBack={currentStep === 1 ? () => navigation.goBack() : undefined}
        showBack
      />

      <SolicitudForm
        step={currentStep}
        data={formData}
        documentos={documentos}
        onNext={handleNext}
        onBack={handleBack}
        onSubmit={handleSubmit}
        updateField={updateFormData}
        openSelector={openSelector}
        updateDocument={updateDocument}
        scrollViewRef={scrollViewRef}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
