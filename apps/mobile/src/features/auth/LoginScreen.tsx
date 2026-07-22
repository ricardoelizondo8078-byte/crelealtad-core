import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton, ScreenContainer } from '../../components/ui';
import { apiUrl } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../theme/tokens';

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa tu email y contraseña');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(apiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Credenciales inválidas');
      }

      const data = await response.json();
      await login(data);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer contentStyle={styles.container}>
      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>CRELEALTAD</Text>
          </View>
          <Text style={styles.subtitle}>Sistema de Gestión de Créditos</Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="usuario@crelealtad.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <PrimaryButton title={loading ? 'Iniciando sesión...' : 'Iniciar sesión'} onPress={handleLogin} moduleTheme="documentation" disabled={loading} />
        </View>

        {/* Credenciales de prueba */}
        <View style={styles.demoCredentials}>
          <Text style={styles.demoTitle}>Credenciales de prueba:</Text>
          <Text style={styles.demoText}>Email: admin@crelealtad.com</Text>
          <Text style={styles.demoText}>Contraseña: Crelealtad2024!</Text>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoText: {
    ...typography.title,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    gap: spacing.md,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
  },
  demoCredentials: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  demoTitle: {
    ...typography.bodyStrong,
    color: '#92400E',
    marginBottom: spacing.xs,
  },
  demoText: {
    ...typography.body,
    color: '#92400E',
    fontSize: 14,
  },
});
