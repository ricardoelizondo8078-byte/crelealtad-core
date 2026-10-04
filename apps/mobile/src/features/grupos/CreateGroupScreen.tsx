import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppHeader, Card, FormField, PrimaryButton, ScreenContainer, ScreenTitleBar } from '../../components/ui';
import { api, ApiError } from '../../services/api-client';
import { colors, moduleThemes, radius, spacing, typography } from '../../theme/tokens';
import { normalizeUppercaseText } from '../../utils/input';

interface CreateGroupScreenProps {
  onBack?: () => void;
  onCreated?: (result: CreatedGroupResult) => void;
}

interface CreatedGroupResult {
  expedienteId: string | null;
  es_grupo_nuevo_ciclo_1: boolean;
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
      const data = await api.post<Partial<CreatedGroupResult>>('/grupos', {
        nombre: name.trim(),
      });

      const createdGroup: CreatedGroupResult = {
        expedienteId: data.expedienteId ?? null,
        // El alta de /grupos siempre inicia el primer ciclo; la API vigente lo confirma
        // explícitamente y este respaldo conserva la marca durante la navegación inmediata.
        es_grupo_nuevo_ciclo_1: data.es_grupo_nuevo_ciclo_1 ?? Boolean(data.expedienteId),
      };

      // Mensaje de confirmación mejorado
      Alert.alert(
        'Grupo Creado',
        `El grupo se ha creado correctamente.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setName('');
              onCreated?.(createdGroup);
            }
          }
        ]
      );
    } catch (error) {
      let errorMessage = 'Error al crear el grupo';
      const details = error instanceof ApiError && typeof error.data === 'object' && error.data !== null
        ? error.data as { message?: string | string[] }
        : undefined;
      if (details?.message) {
        errorMessage = Array.isArray(details.message)
          ? details.message.join(', ')
          : details.message;
      } else if (error instanceof Error) {
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
