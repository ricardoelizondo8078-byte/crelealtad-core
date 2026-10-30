import FontAwesome from '@expo/vector-icons/FontAwesome';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  colors,
  iconSizes,
  radius,
  spacing,
  touchTargets,
  typography,
  type ModuleThemeKey,
} from '../../theme/tokens';
import { formatPhone, validatePhone10 } from '../../utils/input';

interface ContactCallRowProps {
  label: string;
  name: string;
  phone?: string | null;
  onCall: () => void;
  moduleTheme?: ModuleThemeKey;
}

export const ContactCallRow: React.FC<ContactCallRowProps> = ({
  label,
  name,
  phone,
  onCall,
}) => {
  const normalizedPhone = phone ?? '';
  const canCall = validatePhone10(normalizedPhone);
  const displayedPhone = canCall ? formatPhone(normalizedPhone) : 'Sin teléfono';

  return (
    <View
      accessible={!canCall}
      accessibilityLabel={canCall ? undefined : `${label}: ${name}. Sin teléfono disponible.`}
      style={styles.row}
    >
      <View testID="contact-call-identity" style={styles.identity}>
        <Text allowFontScaling={false} style={styles.label}>{label}</Text>
        <Text allowFontScaling={false} numberOfLines={1} style={styles.name}>{name}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Llamar a ${name} al ${displayedPhone}`}
        accessibilityState={{ disabled: !canCall }}
        disabled={!canCall}
        onPress={onCall}
        style={({ pressed }) => [
          styles.callBox,
          !canCall && styles.callBoxDisabled,
          pressed && canCall && styles.callBoxPressed,
        ]}
      >
        <View
          testID="contact-call-phone-value"
          style={[styles.phoneValue, !canCall && styles.callPartDisabled]}
        >
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={[styles.phone, !canCall && styles.phoneDisabled]}
          >
            {displayedPhone}
          </Text>
        </View>
        <View
          testID="contact-call-phone-icon-box"
          style={[styles.phoneIconBox, !canCall && styles.callPartDisabled]}
        >
          <FontAwesome
            testID="contact-call-phone-icon"
            accessible={false}
            name="phone"
            size={iconSizes.action}
            color={canCall ? colors.textPrimary : colors.textSecondary}
          />
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    minHeight: touchTargets.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  identity: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  label: {
    ...typography.notificationBadge,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    width: '100%',
  },
  callBox: {
    minHeight: touchTargets.minimum,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  phoneValue: {
    minHeight: touchTargets.minimum - spacing.xs,
    minWidth: 116,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.infoSoft,
    paddingHorizontal: spacing.sm,
  },
  phoneIconBox: {
    width: touchTargets.minimum - spacing.xs,
    minHeight: touchTargets.minimum - spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.infoSoft,
  },
  callBoxDisabled: {
    opacity: 0.7,
  },
  callPartDisabled: {
    backgroundColor: colors.gray[100],
  },
  callBoxPressed: {
    opacity: 0.75,
  },
  phone: {
    ...typography.bodyStrong,
    color: colors.info,
  },
  phoneDisabled: {
    color: colors.textSecondary,
  },
});
