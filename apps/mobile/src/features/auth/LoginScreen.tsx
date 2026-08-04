import React, { useState, useEffect } from 'react';
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
import { apiUrl } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { colors, fonts, moduleThemes, spacing, radius, shadows } from '../../theme/tokens';
import appConfig from '../../../app.json';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
}

export function LoginScreen() {
  const { login } = useAuth();
  const { height } = useWindowDimensions();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState('');
  const [showUserPicker, setShowUserPicker] = useState(false);

  const greenPrimary = moduleThemes.documentation.primary;
  const isCompact = height < 700;
  const keyHeight = isCompact ? 46 : 52;
  const logoSize = isCompact ? 80 : 96;

  useEffect(() => {
    console.log('🔵 LoginScreen montado, iniciando carga de usuarios...');
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      const url = apiUrl('/auth/login-list');
      console.log('🔵 Intentando cargar usuarios desde:', url);
      const response = await fetch(url);
      console.log('🔵 Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('🔵 Usuarios cargados:', data.length);
        setUsuarios(data);
      } else {
        console.error('❌ Error HTTP:', response.status, response.statusText);
        setError('Error al cargar usuarios');
      }
    } catch (err) {
      console.error('❌ Error cargando usuarios:', err);
      setError('No se pudo conectar al servidor');
    } finally {
      setLoadingUsers(false);
    }
  };

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
    if (!selectedUsuario) {
      setError('Por favor selecciona tu nombre.');
      return;
    }

    if (pin.length !== 4) {
      setError('Ingresa tu PIN de 4 dígitos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(apiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedUsuario.email,
          password: pin, // El PIN se envía como password
        }),
      });

      if (!response.ok) {
        throw new Error('PIN incorrecto.');
      }

      const data = await response.json();
      await login(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
      setPin(''); // Limpiar PIN al fallar
    } finally {
      setLoading(false);
    }
  };

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

  const canSubmit = selectedUsuario !== null && pin.length === 4 && !loading;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[colors.greenGradientTop, colors.greenGradientBottom]}
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
            {/* Selector de nombre */}
            <Text allowFontScaling={false} style={styles.fieldLabel}>SELECCIONA TU NOMBRE</Text>
            <Pressable
              style={styles.userSelector}
              onPress={() => setShowUserPicker(true)}
              disabled={loadingUsers}
            >
              <Text allowFontScaling={false} style={[
                styles.userSelectorText,
                !selectedUsuario && styles.userSelectorPlaceholder,
              ]}>
                {loadingUsers
                  ? 'Cargando...'
                  : selectedUsuario
                  ? selectedUsuario.nombre
                  : '— Elige tu nombre —'}
              </Text>
              <Text allowFontScaling={false} style={styles.chevron}>▼</Text>
            </Pressable>

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
              onPress={handleLogin}
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

        {/* Modal de selección de usuario */}
        {showUserPicker && (
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowUserPicker(false)}
          >
            <Pressable style={styles.pickerCard} onPress={(e) => e.stopPropagation()}>
              <Text allowFontScaling={false} style={styles.pickerTitle}>Selecciona tu nombre</Text>
              <ScrollView style={styles.pickerList}>
                {usuarios.map((usuario) => (
                  <Pressable
                    key={usuario.id}
                    style={({ pressed }) => [
                      styles.pickerItem,
                      pressed && styles.pickerItemPressed,
                      selectedUsuario?.id === usuario.id && styles.pickerItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedUsuario(usuario);
                      setPin('');
                      setError('');
                      setShowUserPicker(false);
                    }}
                  >
                    <Text allowFontScaling={false} style={styles.pickerItemText}>{usuario.nombre}</Text>
                    {selectedUsuario?.id === usuario.id && (
                      <Text allowFontScaling={false} style={styles.checkmark}>✓</Text>
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </Pressable>
          </Pressable>
        )}
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
    color: colors.white,
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
    color: 'rgba(255, 255, 255, 0.65)',
  },
  appVersion: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
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
  userSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginBottom: 16,
  },
  userSelectorText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.textPrimary,
  },
  userSelectorPlaceholder: {
    color: colors.textSecondary,
  },
  chevron: {
    fontSize: 20,
    color: colors.textSecondary,
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
    backgroundColor: moduleThemes.documentation.primary,
    borderColor: moduleThemes.documentation.primary,
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
    color: moduleThemes.documentation.primary,
  },
  loginButton: {
    height: 50,
    backgroundColor: moduleThemes.documentation.primary,
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    padding: 20,
  },
  pickerTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerList: {
    maxHeight: 400,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  pickerItemPressed: {
    backgroundColor: colors.background,
  },
  pickerItemSelected: {
    backgroundColor: moduleThemes.documentation.headerAccent,
    borderColor: moduleThemes.documentation.primary,
  },
  pickerItemText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.textPrimary,
  },
  checkmark: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: moduleThemes.documentation.primary,
  },
});
