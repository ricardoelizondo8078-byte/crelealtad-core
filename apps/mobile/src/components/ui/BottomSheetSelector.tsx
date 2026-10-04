import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, spacing, touchTargets, typography } from '../../theme/tokens';

interface BottomSheetSelectorProps {
  visible: boolean;
  title: string;
  message?: string;
  children: React.ReactNode;
  dismissOnBackdrop?: boolean;
  onClose: () => void;
}

export const BottomSheetSelector: React.FC<BottomSheetSelectorProps> = ({
  visible,
  title,
  message,
  children,
  dismissOnBackdrop = false,
  onClose,
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.overlay}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={dismissOnBackdrop ? 'Cerrar' : undefined}
        accessible={dismissOnBackdrop}
        style={StyleSheet.absoluteFill}
        onPress={dismissOnBackdrop ? onClose : undefined}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardArea}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.heading}>
              <Text allowFontScaling={false} style={styles.title}>{title}</Text>
              {message ? <Text allowFontScaling={false} style={styles.message}>{message}</Text> : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text allowFontScaling={false} style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  keyboardArea: {
    width: '100%',
    maxHeight: '88%',
  },
  sheet: {
    maxHeight: '100%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  handle: {
    width: 48,
    height: 4,
    alignSelf: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.gray[300],
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  heading: {
    flex: 1,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  closeButton: {
    width: touchTargets.minimum,
    height: touchTargets.minimum,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[100],
  },
  closeText: {
    color: colors.textPrimary,
    fontSize: 26,
    lineHeight: 28,
  },
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
});
