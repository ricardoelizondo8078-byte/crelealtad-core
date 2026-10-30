import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  AppHeader,
  Card,
  PrimaryButton,
  ScreenContainer,
  ScreenTitleBar,
  SecondaryButton,
  SectionTitle,
  StatusBadge,
} from '../../components/ui';
import { colors, moduleThemes, spacing, typography } from '../../theme/tokens';
import {
  MODULE_COLOR_REVIEW_ITEMS,
  type ModuleColorReviewItem,
} from './module-color-review.catalog';

interface ModuleColorReviewScreenProps {
  onBack: () => void;
  items?: readonly ModuleColorReviewItem[];
  helperText?: string;
}

export const ModuleColorReviewScreen: React.FC<ModuleColorReviewScreenProps> = ({
  onBack,
  items = MODULE_COLOR_REVIEW_ITEMS,
  helperText = 'Esta pantalla sólo muestra los colores vigentes; no guarda cambios.',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const current = items[currentIndex];
  const theme = current.themeOverride ?? moduleThemes[current.moduleTheme];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === items.length - 1;

  return (
    <ScreenContainer moduleTheme={current.moduleTheme} themeOverride={current.themeOverride}>
      <AppHeader
        showBackButton
        onBackPress={onBack}
        moduleTheme={current.moduleTheme}
        themeOverride={current.themeOverride}
      />
      <ScreenTitleBar
        title={current.title}
        moduleTheme={current.moduleTheme}
        themeOverride={current.themeOverride}
      />

      <View style={styles.content}>
        <View>
          <Text allowFontScaling={false} style={styles.progressText}>
            VISTA {currentIndex + 1} DE {items.length}
          </Text>
          <Text allowFontScaling={false} style={styles.colorText}>
            Encabezado {theme.headerBg} · Barra {theme.titleBarBg} · Botón {theme.primary}
          </Text>
        </View>

        <Card
          variant="outlined"
          moduleTheme={current.moduleTheme}
          themeOverride={current.themeOverride}
          style={styles.previewCard}
        >
          {current.statusLabel ? (
            <StatusBadge
              label={current.statusLabel}
              tone={current.statusTone ?? 'progress'}
            />
          ) : null}
          <SectionTitle title={current.title} />
          <Text allowFontScaling={false} style={styles.description}>
            {current.description}
          </Text>
        </Card>

        <PrimaryButton
          title={current.actionLabel}
          moduleTheme={current.moduleTheme}
          themeOverride={current.themeOverride}
          onPress={() => undefined}
          accessibilityLabel={`${current.actionLabel}. Botón de muestra de ${current.title}`}
          style={styles.sampleButton}
        />

        <View style={styles.navigationRow}>
          <SecondaryButton
            title="Anterior"
            moduleTheme={current.moduleTheme}
            disabled={isFirst}
            onPress={() => setCurrentIndex((index) => Math.max(0, index - 1))}
          />
          <SecondaryButton
            title={isLast ? 'Primero' : 'Siguiente'}
            moduleTheme={current.moduleTheme}
            onPress={() => setCurrentIndex((index) => (
              isLast ? 0 : Math.min(items.length - 1, index + 1)
            ))}
          />
        </View>

        <Text allowFontScaling={false} style={styles.helperText}>
          {helperText}
        </Text>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  progressText: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  colorText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  previewCard: {
    gap: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
  },
  sampleButton: {
    flex: 0,
  },
  navigationRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  helperText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
