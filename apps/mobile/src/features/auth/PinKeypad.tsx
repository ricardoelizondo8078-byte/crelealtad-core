import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, moduleThemes, radius, spacing } from '../../theme/tokens';

interface PinKeypadProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'backspace'],
] as const;

export function PinKeypad({ value, onChange, disabled = false }: PinKeypadProps) {
  const { height } = useWindowDimensions();
  const keyHeight = height < 700 ? 46 : 52;

  const feedback = () => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const append = (digit: string) => {
    if (disabled || value.length >= 4) return;
    feedback();
    onChange(`${value}${digit}`);
  };

  const remove = () => {
    if (disabled || value.length === 0) return;
    feedback();
    onChange(value.slice(0, -1));
  };

  return (
    <View>
      <View
        accessible
        accessibilityLabel={`PIN capturado: ${value.length} de 4 dígitos`}
        style={styles.pinDotsContainer}
      >
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[styles.pinDot, value.length > index && styles.pinDotFilled]}
          />
        ))}
      </View>

      <View style={styles.keypad}>
        {KEYS.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((key, keyIndex) => {
              if (key === '') {
                return <View key={keyIndex} style={styles.key} />;
              }
              const isBackspace = key === 'backspace';
              return (
                <Pressable
                  key={keyIndex}
                  accessibilityRole="button"
                  accessibilityLabel={isBackspace ? 'Borrar último dígito' : `Dígito ${key}`}
                  disabled={disabled}
                  onPress={isBackspace ? remove : () => append(key)}
                  style={({ pressed }) => [
                    styles.key,
                    { height: keyHeight },
                    pressed && styles.keyPressed,
                    disabled && styles.keyDisabled,
                  ]}
                >
                  <Text
                    allowFontScaling={false}
                    style={[styles.keyText, isBackspace && styles.backspaceText]}
                  >
                    {isBackspace ? '⌫' : key}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  pinDot: {
    width: 12,
    height: 12,
    borderRadius: radius.pill,
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
    marginBottom: spacing.lg,
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
  keyDisabled: {
    opacity: 0.5,
  },
  keyText: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    color: moduleThemes.general.primary,
  },
  backspaceText: {
    color: colors.danger,
  },
});
