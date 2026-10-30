import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  colors,
  iconSizes,
  moduleThemes,
  radius,
  spacing,
  touchTargets,
  typography,
  type ModuleThemeKey,
} from '../../theme/tokens';
import { Card } from './Card';

export interface SummaryDetailItem {
  label: string;
  value: string;
  middleValue?: string;
  middleTone?: 'positive' | 'warning' | 'negative' | 'neutral';
  tableColumns?: boolean;
  tableTrailingValue?: string;
  tableTrailingDetail?: string;
  tableTrailingTone?: 'positive' | 'warning' | 'negative' | 'neutral';
  sectionDividerAfter?: boolean;
  trailingValue?: string;
  trailingTone?: 'positive' | 'warning' | 'negative' | 'neutral';
  valueTone?: 'positive' | 'warning' | 'negative' | 'neutral';
  onPress?: () => void;
  actionIcon?: ComponentProps<typeof FontAwesome>['name'];
  actionFilled?: boolean;
  actionIndicator?: string;
  actionIndicatorAccessibilityLabel?: string;
  actionIndicatorTone?: 'positive' | 'warning' | 'negative' | 'neutral';
  actionCompact?: boolean;
  actionAccessibilityLabel?: string;
  actionSegments?: readonly {
    value: string;
    tone: 'positive' | 'warning' | 'negative';
    accessibilityLabel: string;
  }[];
}

interface SummaryDetailsCardProps {
  items: readonly SummaryDetailItem[];
  moduleTheme?: ModuleThemeKey;
}

export const SummaryDetailsCard: React.FC<SummaryDetailsCardProps> = ({
  items,
  moduleTheme = 'general',
}) => {
  const theme = moduleThemes[moduleTheme];

  return (
    <Card
      moduleTheme={moduleTheme}
      variant="outlined"
      style={styles.card}
    >
      <View>
        {items.map((item, index) => {
          const accessibilityLabel = item.actionAccessibilityLabel
            ?? `${item.label}: ${item.middleValue ? `${item.middleValue}, ` : ''}${item.value}${item.tableTrailingValue
              ? `, cálculo: ${item.tableTrailingValue}`
              : ''}${item.tableTrailingDetail
              ? `, diferencia: ${item.tableTrailingDetail}`
              : ''}${item.trailingValue
              ? `, ${item.trailingTone === 'positive'
                ? 'rango compatible'
                : item.trailingTone === 'negative'
                  ? 'rango no compatible'
                  : 'referencia'}: ${item.trailingValue}`
              : ''}`;
          const rowStyle = [
            styles.row,
            item.tableColumns && styles.tableRow,
            index < items.length - 1 && styles.rowDivider,
            item.sectionDividerAfter && {
              borderBottomWidth: 2,
              borderBottomColor: theme.primary,
            },
          ];
          const content = item.tableColumns ? (
            <>
              <View
                testID={`summary-detail-table-label-${index}`}
                style={[styles.tableLabelCell, { borderRightColor: theme.primary }]}
              >
                <Text
                  allowFontScaling={false}
                  numberOfLines={1}
                  style={[styles.label, styles.tableLabelText]}
                >
                  {item.label}
                </Text>
              </View>
              <View
                testID={`summary-detail-table-value-${index}`}
                style={[styles.tableValueCell, { borderRightColor: theme.primary }]}
              >
                <Text allowFontScaling={false} style={[styles.value, styles.tableValueText]}>
                  {item.value}
                </Text>
              </View>
              <View
                testID={item.tableTrailingValue
                  ? `summary-detail-table-result-${index}`
                  : `summary-detail-table-empty-${index}`}
                style={styles.tableEmptyCell}
              >
                {item.tableTrailingValue ? (
                  <View
                    testID={`summary-detail-table-result-content-${index}`}
                    style={styles.tableResultContent}
                  >
                    <View
                      testID={item.tableTrailingTone
                        ? `summary-detail-table-result-tone-${item.tableTrailingTone}-${index}`
                        : `summary-detail-table-result-value-${index}`}
                      style={[
                        styles.primaryBadge,
                        item.tableTrailingTone
                          ? toneStyle(item.tableTrailingTone)
                          : styles.trailingNeutral,
                      ]}
                    >
                      <Text allowFontScaling={false} style={styles.trailingBadgeValue}>
                        {item.tableTrailingValue}
                      </Text>
                    </View>
                    {item.tableTrailingDetail ? (
                      <View
                        testID={`summary-detail-table-result-detail-${index}`}
                        style={[
                          styles.primaryBadge,
                          item.tableTrailingTone
                            ? toneStyle(item.tableTrailingTone)
                            : styles.trailingNeutral,
                        ]}
                      >
                        <Text allowFontScaling={false} style={styles.tableResultDetail}>
                          {item.tableTrailingDetail}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </>
          ) : (
            <>
              {item.actionSegments ? (
                <View style={styles.actionLabelColumn}>
                  <Text allowFontScaling={false} style={[styles.label, styles.actionLabel]}>
                    {item.label}
                  </Text>
                  <View
                    testID={`summary-detail-action-segments-${index}`}
                    accessible={false}
                    style={styles.actionSegments}
                  >
                    {item.actionSegments.map((segment, segmentIndex) => (
                      <View
                        key={`${segment.tone}-${segmentIndex}`}
                        testID={`summary-detail-action-segment-${segment.tone}-${index}`}
                        accessible
                        accessibilityLabel={segment.accessibilityLabel}
                        style={[
                          styles.actionSegment,
                          toneStyle(segment.tone),
                          segmentIndex > 0 && styles.actionSegmentDivider,
                        ]}
                      >
                        <Text
                          testID={`summary-detail-action-segment-value-${segment.tone}-${index}`}
                          allowFontScaling={false}
                          style={styles.actionSegmentValue}
                        >
                          {segment.value}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <Text allowFontScaling={false} style={styles.label}>{item.label}</Text>
              )}
              {item.middleValue ? (
                <View style={styles.splitValue}>
                  {item.middleTone ? (
                    <View
                      testID={`summary-detail-middle-${item.middleTone}-${index}`}
                      style={[styles.primaryBadge, toneStyle(item.middleTone)]}
                    >
                      <Text allowFontScaling={false} style={styles.trailingBadgeValue}>
                        {item.middleValue}
                      </Text>
                    </View>
                  ) : (
                    <Text allowFontScaling={false} style={styles.splitPrimaryValue}>
                      {item.middleValue}
                    </Text>
                  )}
                  <Text allowFontScaling={false} style={styles.value}>{item.value}</Text>
                </View>
              ) : item.trailingValue ? (
                <View style={styles.splitValue}>
                  {item.valueTone ? (
                    <View
                      testID={`summary-detail-primary-${item.valueTone}-${index}`}
                      style={[
                        styles.primaryBadge,
                        toneStyle(item.valueTone),
                      ]}
                    >
                      <Text allowFontScaling={false} style={styles.trailingBadgeValue}>
                        {item.value}
                      </Text>
                    </View>
                  ) : (
                    <Text allowFontScaling={false} style={styles.splitPrimaryValue}>
                      {item.value}
                    </Text>
                  )}
                  {item.trailingTone ? (
                    <View
                      testID={`summary-detail-trailing-${item.trailingTone}-${index}`}
                      style={[
                        styles.trailingBadge,
                        toneStyle(item.trailingTone),
                      ]}
                    >
                      <Text allowFontScaling={false} style={styles.trailingMark}>
                        {item.trailingTone === 'positive'
                          ? '✓'
                          : item.trailingTone === 'negative'
                            ? '×'
                            : item.trailingTone === 'warning'
                              ? '!'
                              : '•'}
                      </Text>
                      <Text allowFontScaling={false} style={styles.trailingBadgeValue}>
                        {item.trailingValue}
                      </Text>
                    </View>
                  ) : (
                    <Text allowFontScaling={false} style={styles.trailingValue}>
                      {item.trailingValue}
                    </Text>
                  )}
                </View>
              ) : item.valueTone ? (
                <View style={styles.valueBadgeContainer}>
                  <View
                    testID={`summary-detail-value-${item.valueTone}-${index}`}
                    style={[styles.primaryBadge, toneStyle(item.valueTone)]}
                  >
                    <Text allowFontScaling={false} style={styles.trailingBadgeValue}>
                      {item.value}
                    </Text>
                  </View>
                </View>
              ) : item.onPress ? (
                <>
                  {item.actionIndicator ? (
                    <View
                      testID={`summary-detail-action-indicator-${index}`}
                      accessible
                      accessibilityLabel={item.actionIndicatorAccessibilityLabel}
                      style={[
                        styles.actionIndicator,
                        item.actionIndicatorTone && toneStyle(item.actionIndicatorTone),
                      ]}
                    >
                      <Text allowFontScaling={false} style={styles.actionIndicatorText}>
                        {item.actionIndicator}
                      </Text>
                    </View>
                  ) : null}
                  <View
                    testID={`summary-detail-action-container-${index}`}
                    style={[
                      styles.actionValueContainer,
                      item.actionCompact && styles.actionValueContainerCompact,
                    ]}
                  >
                    <Pressable
                      testID={`summary-detail-action-button-${index}`}
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel={accessibilityLabel}
                      accessibilityHint="Abre las fotografías guardadas"
                      onPress={item.onPress}
                      style={({ pressed }) => [
                        styles.actionValue,
                        {
                          borderColor: theme.primary,
                          backgroundColor: item.actionFilled ? theme.primary : colors.surface,
                        },
                        pressed && styles.rowPressed,
                      ]}
                    >
                      {item.actionIcon ? (
                        <FontAwesome
                          name={item.actionIcon}
                          size={iconSizes.action}
                          color={item.actionFilled ? theme.primaryText : theme.primary}
                          testID={`summary-detail-action-icon-${item.actionIcon}-${index}`}
                        />
                      ) : null}
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.actionValueText,
                          item.actionFilled && { color: theme.primaryText },
                        ]}
                      >
                        {item.value}
                      </Text>
                      {!item.actionIcon ? (
                        <Text
                          allowFontScaling={false}
                          style={[
                            styles.actionChevron,
                            { color: item.actionFilled ? theme.primaryText : theme.primary },
                          ]}
                        >
                          ›
                        </Text>
                      ) : null}
                    </Pressable>
                  </View>
                </>
              ) : (
                <Text allowFontScaling={false} style={styles.value}>{item.value}</Text>
              )}
            </>
          );

          return (
            <View
              key={`${item.label}-${index}`}
              testID={`summary-detail-row-${index}`}
              accessible={!item.onPress}
              accessibilityLabel={item.onPress ? undefined : accessibilityLabel}
              style={rowStyle}
            >
              {content}
            </View>
          );
        })}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  row: {
    minHeight: touchTargets.minimum,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tableRow: {
    minHeight: touchTargets.primary,
    gap: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  label: {
    ...typography.captionStrong,
    color: colors.textSecondary,
    flex: 0.9,
  },
  actionLabelColumn: {
    flex: 0.9,
    alignSelf: 'stretch',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  actionLabel: {
    flex: 0,
  },
  actionSegments: {
    minHeight: spacing.xxxl,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.textPrimary,
    borderRadius: radius.pill,
  },
  actionSegment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: spacing.xs,
    paddingVertical: 0,
  },
  actionSegmentDivider: {
    borderLeftWidth: 1,
    borderLeftColor: colors.textPrimary,
  },
  actionSegmentValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  tableLabelCell: {
    alignSelf: 'stretch',
    width: '33%',
    justifyContent: 'center',
    borderRightWidth: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  tableEmptyCell: {
    alignSelf: 'stretch',
    width: '40%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  tableValueCell: {
    alignSelf: 'stretch',
    width: '27%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tableLabelText: {
    flex: 0,
  },
  tableValueText: {
    flex: 0,
    textAlign: 'center',
  },
  tableResultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  tableResultDetail: {
    ...typography.captionStrong,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  value: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flex: 1.2,
    textAlign: 'right',
  },
  splitValue: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  splitPrimaryValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    textAlign: 'left',
  },
  trailingValue: {
    ...typography.captionStrong,
    color: colors.textSecondary,
    flexShrink: 0,
    textAlign: 'right',
  },
  trailingBadge: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  primaryBadge: {
    flexShrink: 0,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  trailingPositive: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  trailingWarning: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
  },
  trailingNegative: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  trailingNeutral: {
    backgroundColor: colors.white,
    borderColor: colors.textPrimary,
  },
  trailingMark: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  trailingBadgeValue: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  valueBadgeContainer: {
    flex: 1.2,
    alignItems: 'flex-end',
  },
  actionValueContainer: {
    flex: 1.2,
    alignItems: 'stretch',
  },
  actionValueContainerCompact: {
    flex: 0.85,
  },
  actionIndicator: {
    width: touchTargets.minimum,
    height: touchTargets.minimum,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.textPrimary,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
  },
  actionIndicatorText: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
  actionValue: {
    width: '100%',
    minHeight: touchTargets.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 2,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  actionValueText: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  actionChevron: {
    ...typography.sectionTitle,
  },
});

const toneStyle = (tone: NonNullable<SummaryDetailItem['valueTone']>) => ({
  positive: styles.trailingPositive,
  warning: styles.trailingWarning,
  negative: styles.trailingNegative,
  neutral: styles.trailingNeutral,
}[tone]);
