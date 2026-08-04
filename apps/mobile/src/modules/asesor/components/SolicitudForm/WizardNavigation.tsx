import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../../../theme/tokens';
import { WIZARD_STEPS } from '../../types/constants';

interface WizardNavigationProps {
  currentStep: number;
}

export const WizardNavigation: React.FC<WizardNavigationProps> = ({ currentStep }) => {
  return (
    <View style={styles.container}>
      <View style={styles.stepsContainer}>
        {WIZARD_STEPS.map((step) => (
          <View key={step.id} style={styles.stepWrapper}>
            <View
              style={[
                styles.stepCircle,
                currentStep === step.id && styles.stepCircleActive,
                currentStep > step.id && styles.stepCircleCompleted,
              ]}
            >
              <Text
                style={[
                  styles.stepNumber,
                  currentStep === step.id && styles.stepNumberActive,
                  currentStep > step.id && styles.stepNumberCompleted,
                ]}
                allowFontScaling={false}
              >
                {step.id}
              </Text>
            </View>
            <Text
              style={[
                styles.stepLabel,
                currentStep === step.id && styles.stepLabelActive
              ]}
              allowFontScaling={false}
            >
              {step.shortTitle}
            </Text>
            {step.id < WIZARD_STEPS.length && (
              <View
                style={[
                  styles.connector,
                  currentStep > step.id && styles.connectorCompleted,
                ]}
              />
            )}
          </View>
        ))}
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title} allowFontScaling={false}>
          PASO {currentStep} DE {WIZARD_STEPS.length}
        </Text>
        <Text style={styles.subtitle} allowFontScaling={false}>
          {WIZARD_STEPS.find(s => s.id === currentStep)?.title}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
  stepWrapper: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
  },
  stepCircleCompleted: {
    backgroundColor: colors.success,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[600],
  },
  stepNumberActive: {
    color: colors.white,
  },
  stepNumberCompleted: {
    color: colors.white,
  },
  stepLabel: {
    fontSize: 10,
    color: colors.gray[600],
    textAlign: 'center',
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  connector: {
    position: 'absolute',
    top: 16,
    left: '50%',
    width: '100%',
    height: 2,
    backgroundColor: colors.gray[200],
    zIndex: -1,
  },
  connectorCompleted: {
    backgroundColor: colors.success,
  },
  titleContainer: {
    paddingHorizontal: spacing.md,
  },
  title: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
  },
});
