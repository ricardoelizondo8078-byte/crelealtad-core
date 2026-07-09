import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppHeader, Card, FormField, PrimaryButton, ScreenContainer, ScreenTitleBar } from '../../components/ui';
import { apiUrl } from '../../config/api';
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
      const response = await fetch(apiUrl('/grupos'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          createdBy: 'advisor',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create group');
      }

      const data = await response.json();
      Alert.alert('Success', `Group created: ${data.name}`);
      setName('');
      onCreated?.();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unexpected error');
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
          <Text style={styles.subtitle}>
            <Text style={styles.subtitleEmphasis}>Registra</Text> el nombre del grupo para iniciar la documentación.
          </Text>
          <FormField label="Nombre del grupo" required helperText="Se guardará en mayúsculas" errorText={nameError}>
            <TextInput
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
