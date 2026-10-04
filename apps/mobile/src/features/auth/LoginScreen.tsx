import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { LoginResponse, useAuth } from '../../context/AuthContext';
import { useProcessingAction } from '../../context/ProcessingContext';
import { TextInput as AppTextInput } from '../../components/ui';
import { api, ApiError } from '../../services/api-client';
import { colors, fonts, moduleThemes, spacing, shadows } from '../../theme/tokens';
import appConfig from '../../../app.json';

const getLoginErrorMessage = (error: unknown): string => {
  if (!(error instanceof ApiError)) {
    return 'No se pudo iniciar sesión. Intenta nuevamente.';
  }

  if (error.status === 0) {
    return error.message;
  }

  if (error.status === 401) {
    return error.message === 'Usuario inactivo o suspendido'
      ? 'Tu acceso está inactivo. Solicita apoyo a tu coordinador.'
      : 'Abreviatura o PIN incorrectos.';
  }

  if (error.status === 429) {
    return 'Demasiados intentos. Espera un minuto e intenta nuevamente.';
  }

  return 'No se pudo iniciar sesión. Intenta nuevamente.';
};

export function LoginScreen() {
  const { login } = useAuth();
  const { height } = useWindowDimensions();
  const [abreviatura, setAbreviatura] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isCompact = height < 700;
  const keyHeight = isCompact ? 46 : 52;
  const logoSize = isCompact ? 80 : 96;

  const handleNumberPress = (num: string) => {
    if (pin.length < 4) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setPin(pin + num);
      setError('');
    }
  };

  const handleBackspace = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleLogin = async () => {
    const identificador = abreviatura.trim();
    if (!identificador) {
      setError('Ingresa tu abreviatura.');
      return;
    }

    if (pin.length !== 4) {
      setError('Ingresa tu PIN de 4 dígitos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await api.post<LoginResponse>(
        '/auth/login',
        {
          abreviatura: identificador,
          pin,
        },
        { requiresAuth: false },
      );

      await login(data);
    } catch (err) {
      setError(getLoginErrorMessage(err));
      setPin(''); // Limpiar PIN al fallar
    } finally {
      setLoading(false);
    }
  };

  const handleLoginPress = useProcessingAction(handleLogin, 'Iniciando sesión…');

  const renderPinDots = () => {
    return (
      <View style={styles.pinDotsContainer}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.pinDot,
              pin.length > i && styles.pinDotFilled,
            ]}
          />
        ))}
      </View>
    );
  };

  const renderNumericKeypad = () => {
    const keys = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'backspace'],
    ];

    return (
      <View style={styles.keypad}>
        {keys.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((key, keyIndex) => {
              if (key === '') {
                return <View key={keyIndex} style={styles.key} />;
              }

              if (key === 'backspace') {
                return (
                  <Pressable
                    key={keyIndex}
                    style={({ pressed }) => [
                      styles.key,
                      { height: keyHeight },
                      pressed && styles.keyPressed,
                    ]}
                    onPress={handleBackspace}
                  >
                    <Text allowFontScaling={false} style={[styles.keyText, { color: colors.danger }]}>⌫</Text>
                  </Pressable>
                );
              }

              return (
                <Pressable
                  key={keyIndex}
                  style={({ pressed }) => [
                    styles.key,
                    { height: keyHeight },
                    pressed && styles.keyPressed,
                  ]}
                  onPress={() => handleNumberPress(key)}
                >
                  <Text allowFontScaling={false} style={styles.keyText}>{key}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  const canSubmit = abreviatura.trim().length > 0 && pin.length === 4 && !loading;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={[moduleThemes.general.headerBg, moduleThemes.general.titleBarBg]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea}>
        {/* Círculos decorativos sutiles */}
        <View style={[styles.decorCircle, styles.decorCircleTop]} />
        <View style={[styles.decorCircle, styles.decorCircleBottom]} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ENCABEZADO */}
          <View style={styles.header}>
            <View style={[styles.logoCard, { width: logoSize, height: logoSize }]}>
              <Image
                source={require('../../../assets/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text allowFontScaling={false} style={styles.appTitle}>CRELEALTAD</Text>
            <View style={styles.subtitleRow}>
              <Text allowFontScaling={false} style={styles.appSubtitle}>Sistema de Cobranza</Text>
              <Text allowFontScaling={false} style={styles.appVersion}>v{appConfig.expo.version}</Text>
            </View>
          </View>

          {/* TARJETA DE LOGIN */}
          <View style={styles.loginCard}>
            <AppTextInput
              label="ABREVIATURA"
              value={abreviatura}
              onChangeText={(value) => {
                setAbreviatura(value.toUpperCase());
                setError('');
              }}
              placeholder="Ej. ANA_VAZQUEZ"
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!loading}
              maxLength={100}
              required
            />

            {/* PIN */}
            <Text allowFontScaling={false} style={[styles.fieldLabel, { marginTop: spacing.lg }]}>
              PIN DE ACCESO
            </Text>
            {renderPinDots()}

            {/* Teclado numérico */}
            {renderNumericKeypad()}

            {/* Botón Entrar */}
            <Pressable
              style={[
                styles.loginButton,
                !canSubmit && styles.loginButtonDisabled,
              ]}
              onPress={handleLoginPress}
              disabled={!canSubmit}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text allowFontScaling={false} style={styles.loginButtonText}>Entrar</Text>
              )}
            </Pressable>

            {/* Mensaje de error */}
            {error ? (
              <Text allowFontScaling={false} style={styles.errorText}>{error}</Text>
            ) : (
              <View style={styles.errorPlaceholder} />
            )}
          </View>
        </ScrollView>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  decorCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decorCircleTop: {
    top: -100,
    right: -100,
  },
  decorCircleBottom: {
    bottom: -100,
    left: -100,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCard: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    ...shadows.card,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  appTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 30,
    color: moduleThemes.general.headerText,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  appSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.gray[800],
  },
  appVersion: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: colors.gray[800],
    marginLeft: 6,
  },
  loginCard: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 20,
    marginHorizontal: 20,
    ...shadows.card,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  fieldLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: 4,
    marginBottom: 14,
  },
  pinDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: moduleThemes.general.primary,
    borderColor: moduleThemes.general.primary,
  },
  keypad: {
    gap: 10,
    marginBottom: 16,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 10,
  },
  key: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyPressed: {
    backgroundColor: colors.background,
  },
  keyText: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    color: moduleThemes.general.primary,
  },
  loginButton: {
    height: 50,
    backgroundColor: moduleThemes.general.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.45,
  },
  loginButtonText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    letterSpacing: 0.5,
    color: colors.white,
  },
  errorPlaceholder: {
    minHeight: 18,
  },
  errorText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
    marginTop: 10,
  },
});
