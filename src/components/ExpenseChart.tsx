import React from 'react';
import { View, Text, StyleSheet, useColorScheme, Dimensions } from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { MonthlyTotal, CategoryTotal } from '../types';
import { COLORS, CATEGORY_CONFIG } from '../utils/constants';

interface ExpenseChartProps {
  monthlyTotals: MonthlyTotal[];
  categoryTotals: CategoryTotal[];
  currency: string;
}

const screenWidth = Dimensions.get('window').width;

export default function ExpenseChart({
  monthlyTotals,
  categoryTotals,
  currency,
}: ExpenseChartProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? COLORS.dark : COLORS.light;

  // Prepare bar chart data (reverse to show oldest first)
  const barData = [...monthlyTotals].reverse().map((item) => ({
    value: item.total,
    label: item.month.substring(5), // "01", "02", etc
    frontColor: COLORS.primary,
    topLabelComponent: () => (
      <Text style={{ fontSize: 9, color: theme.textSecondary, marginBottom: 2 }}>
        {currency}{Math.round(item.total)}
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
        <View style={[styles.chartCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>
            Monthly Spending
          </Text>
          <View style={styles.barChartWrapper}>
            <BarChart
              data={barData}
              barWidth={28}
              spacing={16}
              roundedTop
              roundedBottom
              hideRules
              xAxisThickness={0}
              yAxisThickness={0}
              yAxisTextStyle={{ color: theme.textSecondary, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: theme.textSecondary, fontSize: 10 }}
              noOfSections={4}
              maxValue={Math.max(...barData.map((d) => d.value)) * 1.2 || 100}
              width={screenWidth - 100}
              height={150}
              isAnimated
            />
          </View>
        </View>
      )}

      {/* Category Pie Chart */}
      {pieData.length > 0 && (
        <View style={[styles.chartCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>
            By Category
          </Text>

          <View style={styles.pieWrapper}>
            <PieChart
              data={pieData}
              donut
              radius={70}
              innerRadius={45}
              centerLabelComponent={() => (
                <View style={styles.pieCenter}>
                  <Text style={[styles.pieCenterAmount, { color: theme.text }]}>
                    {currency}{Math.round(totalSpent)}
                  </Text>
                  <Text style={[styles.pieCenterLabel, { color: theme.textSecondary }]}>
                    Total
                  </Text>
                </View>
              )}
            />

            {/* Legend */}
            <View style={styles.legend}>
              {categoryTotals.slice(0, 5).map((item) => (
                <View key={item.category} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text
                    style={[styles.legendText, { color: theme.textSecondary }]}
                    numberOfLines={1}
                  >
                    {CATEGORY_CONFIG[item.category]?.label ?? item.category}
                  </Text>
                  <Text style={[styles.legendValue, { color: theme.text }]}>
                    {currency}{Math.round(item.total)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {barData.length === 0 && pieData.length === 0 && (
        <View style={[styles.chartCard, { backgroundColor: theme.surface }]}>
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>📊</Text>
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
    gap: 16,
  },
  chartCard: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
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
    fontSize: 16,
    fontWeight: '700',
  },
  pieCenterLabel: {
    fontSize: 10,
  },
  legend: {
    flex: 1,
    marginLeft: 20,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    flex: 1,
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
  },
});
