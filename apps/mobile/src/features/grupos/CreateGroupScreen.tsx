import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppHeader, Card, FormField, PrimaryButton, ScreenContainer, ScreenTitleBar } from '../../components/ui';
import { api } from '../../services/api-client';
import { colors, moduleThemes, radius, spacing, typography } from '../../theme/tokens';
import { normalizeUppercaseText } from '../../utils/input';

interface CreateGroupScreenProps {
  onBack?: () => void;
  onCreated?: () => void;
}

export const CreateGroupScreen: React.FC<CreateGroupScreenProps> = ({ onBack, onCreated }) => {
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setNameError('El nombre del grupo es obligatorio');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await api.post<any>('/grupos', {
        name: name.trim(),
        createdBy: 'advisor',
      });

      console.log('✅ Grupo creado exitosamente:', JSON.stringify(data));

      // Mensaje de confirmación mejorado
      Alert.alert(
        'Grupo Creado',
        `El grupo se ha creado correctamente.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setName('');
              onCreated?.();
            }
          }
        ]
      );
    } catch (error: any) {
      console.log('❌ Error completo:', error);
      console.log('❌ Error message:', error.message);
      console.log('❌ Error status:', error.status);
      console.log('❌ Error data:', JSON.stringify(error.data));

      let errorMessage = 'Error al crear el grupo';
      if (error.data?.message) {
        errorMessage = Array.isArray(error.data.message)
          ? error.data.message.join(', ')
          : error.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <AppHeader showBackButton onBackPress={onBack} moduleTheme="documentation" />
      <ScreenTitleBar title="Crear Grupo" moduleTheme="documentation" />
      <View style={styles.content}>
        <Card>
          <Text allowFontScaling={false} style={styles.subtitle}>
            <Text allowFontScaling={false} style={styles.subtitleEmphasis}>Registra</Text> el nombre del grupo para iniciar la documentación.
          </Text>
          <FormField label="Nombre del grupo" required helperText="Se guardará en mayúsculas" errorText={nameError}>
            <TextInput allowFontScaling={false}
              style={styles.input}
              placeholder="Nombre del grupo"
              value={name}
              autoCapitalize="characters"
              onChangeText={(value) => {
                setName(normalizeUppercaseText(value));
                if (nameError) {
                  setNameError(undefined);
                }
              }}
            />
          </FormField>
          <PrimaryButton title={isSubmitting ? 'Creando...' : 'Crear grupo'} onPress={handleSubmit} disabled={isSubmitting} moduleTheme="documentation" />
        </Card>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  subtitle: { color: colors.textSecondary, marginBottom: spacing.sm, ...typography.body },
  subtitleEmphasis: { color: moduleThemes.documentation.primary, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
});
