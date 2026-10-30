import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  colors,
  layout,
  moduleThemes,
  type ModuleThemeKey,
  radius,
  spacing,
  typography,
} from '../../theme/tokens';
import { useResponsiveLayout } from './ResponsiveContent';

export interface StepFlowItem {
  id: number | string;
  title: string;
  complete?: boolean;
}

export type StepFlowItemState = 'complete' | 'current' | 'pending';

interface StepFlowLayoutProps {
  children?: React.ReactNode;
  currentStepId: number | string;
  moduleTheme: ModuleThemeKey;
  sidebarTitle?: string;
  steps: readonly StepFlowItem[];
}

export const getStepFlowItemState = (
  step: StepFlowItem,
  currentStepId: number | string,
): StepFlowItemState => {
  if (step.id === currentStepId) return 'current';
  return step.complete ? 'complete' : 'pending';
};

export const StepFlowLayout: React.FC<StepFlowLayoutProps> = ({
  children,
  currentStepId,
  moduleTheme,
  sidebarTitle = 'Pasos de la solicitud',
  steps,
}) => {
  const { isDesktop } = useResponsiveLayout();
  const theme = moduleThemes[moduleTheme];

  if (!isDesktop) return <>{children}</>;

  return (
    <View style={styles.desktopShell}>
      <View
        accessibilityLabel={`${sidebarTitle}. ${steps.length} pasos`}
        style={styles.stepRail}
      >
        <Text allowFontScaling={false} style={styles.railTitle}>{sidebarTitle}</Text>

        <View style={styles.stepList}>
          {steps.map((step, index) => {
            const state = getStepFlowItemState(step, currentStepId);
            const stateLabel = state === 'complete'
              ? 'Completado'
              : state === 'current'
                ? 'Paso actual'
                : 'Pendiente';

            return (
              <View
                accessible
                accessibilityLabel={`Paso ${index + 1} de ${steps.length}: ${step.title}. ${stateLabel}`}
                key={String(step.id)}
                style={[
                  styles.stepRow,
                  state === 'current' && {
                    backgroundColor: theme.headerAccent,
                    borderColor: theme.primary,
                  },
                ]}
              >
                <View
                  style={[
                    styles.stepNumber,
                    state !== 'pending' && { backgroundColor: theme.primary },
                  ]}
                >
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.stepNumberText,
                      state !== 'pending' && { color: theme.primaryText },
                    ]}
                  >
                    {state === 'complete' ? '✓' : index + 1}
                  </Text>
                </View>

                <Text
                  allowFontScaling={false}
                  style={[
                    styles.stepTitle,
                    state === 'current' && styles.stepTitleCurrent,
                  ]}
                >
                  {step.title}
                </Text>

                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={[
                    styles.stateDot,
                    state !== 'pending' && { backgroundColor: theme.primary },
                  ]}
                />
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.activeStepContent}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  desktopShell: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: layout.stepFlowDesktopGap,
    paddingHorizontal: layout.desktopGutter,
    paddingTop: spacing.md,
  },
  stepRail: {
    width: layout.stepFlowRailWidth,
    flexShrink: 0,
    alignSelf: 'stretch',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
  },
  railTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  stepList: {
    gap: spacing.sm,
  },
  stepRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.sm,
  },
  stepNumber: {
    width: 34,
    height: 34,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[300],
    borderRadius: radius.pill,
  },
  stepNumberText: {
    ...typography.bodyStrong,
    color: colors.gray[700],
  },
  stepTitle: {
    ...typography.body,
    flex: 1,
    color: colors.textSecondary,
  },
  stepTitleCurrent: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  stateDot: {
    width: 10,
    height: 10,
    flexShrink: 0,
    backgroundColor: colors.gray[300],
    borderRadius: radius.pill,
  },
  activeStepContent: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  },
});
