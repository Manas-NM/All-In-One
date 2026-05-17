import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { MonthlyTotal, CategoryTotal } from '../types';
import {
  COLORS,
  CATEGORY_CONFIG,
  FONT_SIZES,
  SPACING,
  RADIUS,
} from '../utils/constants';
import {
  rf,
  rs,
  rr,
  getScreenHorizontalPadding,
  getChartDimensions,
  pickByDevice,
} from '../utils/responsive';

interface ExpenseChartProps {
  monthlyTotals: MonthlyTotal[];
  categoryTotals: CategoryTotal[];
  currency: string;
}

export default function ExpenseChart({
  monthlyTotals,
  categoryTotals,
  currency,
}: ExpenseChartProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? COLORS.dark : COLORS.light;

  const chartDims = getChartDimensions();
  const horizontalPadding = getScreenHorizontalPadding();
  // Bar width should adapt: thinner bars on small phones so 6 months fit.
  const barWidth = pickByDevice({
    small: 22,
    medium: 28,
    large: 32,
    tablet: 44,
  });
  const barSpacing = pickByDevice({
    small: 12,
    medium: 16,
    large: 18,
    tablet: 24,
  });

  // Prepare bar chart data (reverse to show oldest first)
  const barData = [...monthlyTotals].reverse().map((item) => ({
    value: item.total,
    label: item.month.substring(5), // "01", "02", etc
    frontColor: COLORS.primary,
    topLabelComponent: () => (
      <Text
        style={{
          fontSize: rf(9),
          color: theme.textSecondary,
          marginBottom: 2,
        }}
      >
        {currency}
        {Math.round(item.total)}
      </Text>
    ),
  }));

  // Prepare pie chart data
  const pieData = categoryTotals.map((item) => ({
    value: item.total,
    color: item.color,
    text: CATEGORY_CONFIG[item.category]?.label ?? item.category,
    textColor: theme.text,
  }));

  const totalSpent = categoryTotals.reduce((s, c) => s + c.total, 0);

  return (
    <View style={styles.container}>
      {/* Monthly Bar Chart */}
      {barData.length > 0 && (
        <View
          style={[
            styles.chartCard,
            { backgroundColor: theme.surface, marginHorizontal: horizontalPadding },
          ]}
        >
          <Text style={[styles.chartTitle, { color: theme.text }]}>
            Monthly Spending
          </Text>
          <View style={styles.barChartWrapper}>
            <BarChart
              data={barData}
              barWidth={barWidth}
              spacing={barSpacing}
              roundedTop
              roundedBottom
              hideRules
              xAxisThickness={0}
              yAxisThickness={0}
              yAxisTextStyle={{
                color: theme.textSecondary,
                fontSize: rf(10),
              }}
              xAxisLabelTextStyle={{
                color: theme.textSecondary,
                fontSize: rf(10),
              }}
              noOfSections={4}
              maxValue={Math.max(...barData.map((d) => d.value)) * 1.2 || 100}
              width={chartDims.barWidth}
              height={chartDims.barHeight}
              isAnimated
            />
          </View>
        </View>
      )}

      {/* Category Pie Chart */}
      {pieData.length > 0 && (
        <View
          style={[
            styles.chartCard,
            { backgroundColor: theme.surface, marginHorizontal: horizontalPadding },
          ]}
        >
          <Text style={[styles.chartTitle, { color: theme.text }]}>
            By Category
          </Text>

          <View style={styles.pieWrapper}>
            <PieChart
              data={pieData}
              donut
              radius={chartDims.pieRadius}
              innerRadius={chartDims.pieInnerRadius}
              centerLabelComponent={() => (
                <View style={styles.pieCenter}>
                  <Text style={[styles.pieCenterAmount, { color: theme.text }]}>
                    {currency}
                    {Math.round(totalSpent)}
                  </Text>
                  <Text
                    style={[styles.pieCenterLabel, { color: theme.textSecondary }]}
                  >
                    Total
                  </Text>
                </View>
              )}
            />

            {/* Legend */}
            <View style={styles.legend}>
              {categoryTotals.slice(0, 5).map((item) => (
                <View key={item.category} style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: item.color }]}
                  />
                  <Text
                    style={[styles.legendText, { color: theme.textSecondary }]}
                    numberOfLines={1}
                  >
                    {CATEGORY_CONFIG[item.category]?.label ?? item.category}
                  </Text>
                  <Text style={[styles.legendValue, { color: theme.text }]}>
                    {currency}
                    {Math.round(item.total)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {barData.length === 0 && pieData.length === 0 && (
        <View
          style={[
            styles.chartCard,
            { backgroundColor: theme.surface, marginHorizontal: horizontalPadding },
          ]}
        >
          <View style={styles.emptyState}>
            <Text style={{ fontSize: rf(40), marginBottom: rs(SPACING.sm) }}>
              📊
            </Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Add expenses to see charts
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: rs(SPACING.lg),
  },
  chartCard: {
    borderRadius: rr(RADIUS.xxl),
    padding: rs(SPACING.lg),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    fontSize: rf(FONT_SIZES.subtitle),
    fontWeight: '600',
    marginBottom: rs(SPACING.lg),
  },
  barChartWrapper: {
    alignItems: 'center',
  },
  pieWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pieCenter: {
    alignItems: 'center',
  },
  pieCenterAmount: {
    fontSize: rf(FONT_SIZES.subtitle),
    fontWeight: '700',
  },
  pieCenterLabel: {
    fontSize: rf(FONT_SIZES.caption),
  },
  legend: {
    flex: 1,
    marginLeft: rs(SPACING.xl),
    gap: rs(SPACING.sm),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
  },
  legendDot: {
    width: rs(8),
    height: rs(8),
    borderRadius: rs(4),
  },
  legendText: {
    fontSize: rf(FONT_SIZES.small),
    flex: 1,
  },
  legendValue: {
    fontSize: rf(FONT_SIZES.small),
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: rs(SPACING.xxxl),
  },
  emptyText: {
    fontSize: rf(FONT_SIZES.body),
  },
});
