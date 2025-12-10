import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useFinance } from '../context/FinanceContext';
import { useMonthlyComparison } from '../hooks/useMonthlyComparison';
import { formatCurrency } from '../utils/format';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export const MonthlyComparisonCard = () => {
  const { theme, isValuesVisible } = useFinance();
  const { monthlyData, currentMonthChange, maxTotal, averageTotal } = useMonthlyComparison(6);

  if (monthlyData.every(m => m.total === 0)) {
    return null; // Don't show if no data
  }

  const renderChangeIndicator = () => {
    if (currentMonthChange === null) return null;
    
    const isPositive = currentMonthChange > 0;
    const isNeutral = currentMonthChange === 0;
    
    return (
      <View style={[
        styles.changeIndicator,
        { 
          backgroundColor: isNeutral 
            ? theme.gray + '20' 
            : isPositive 
              ? theme.danger + '20' 
              : theme.success + '20' 
        }
      ]}>
        {!isNeutral && (
          <Ionicons 
            name={isPositive ? 'trending-up' : 'trending-down'} 
            size={14} 
            color={isPositive ? theme.danger : theme.success} 
          />
        )}
        <Text style={[
          styles.changeText,
          { color: isNeutral ? theme.textLight : isPositive ? theme.danger : theme.success }
        ]}>
          {isNeutral ? '0%' : `${isPositive ? '+' : ''}${currentMonthChange.toFixed(0)}%`}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
          <Ionicons name="bar-chart" size={20} color={theme.primary} />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, { color: theme.text }]}>Comparativo Mensal</Text>
          <Text style={[styles.subtitle, { color: theme.textLight }]}>Últimos 6 meses</Text>
        </View>
        {renderChangeIndicator()}
      </View>

      {/* Bar Chart */}
      <View style={styles.chartContainer}>
        {monthlyData.map((month, index) => {
          const barHeight = maxTotal > 0 ? (month.total / maxTotal) * 100 : 0;
          const isCurrentMonth = index === monthlyData.length - 1;
          const isAboveAverage = month.total > averageTotal;
          
          return (
            <View key={`${month.year}-${month.month}`} style={styles.barWrapper}>
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.bar,
                    { 
                      height: `${Math.max(barHeight, 5)}%`,
                      backgroundColor: isCurrentMonth 
                        ? theme.primary 
                        : isAboveAverage 
                          ? theme.warning + '80'
                          : theme.success + '60',
                    }
                  ]} 
                />
              </View>
              <Text style={[
                styles.barLabel, 
                { 
                  color: isCurrentMonth ? theme.primary : theme.textLight,
                  fontWeight: isCurrentMonth ? '700' : '500'
                }
              ]}>
                {month.label}
              </Text>
              <Text style={[
                styles.barValue, 
                { 
                  color: isCurrentMonth ? theme.text : theme.textLight,
                  fontWeight: isCurrentMonth ? '600' : '400'
                }
              ]}>
                {isValuesVisible ? formatCurrency(month.total).replace('R$', '').trim() : '••••'}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Average Line Indicator */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.success + '60' }]} />
          <Text style={[styles.legendText, { color: theme.textLight }]}>Abaixo da média</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.warning + '80' }]} />
          <Text style={[styles.legendText, { color: theme.textLight }]}>Acima da média</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  changeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingHorizontal: 8,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  barContainer: {
    width: '100%',
    height: 100,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '70%',
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 11,
    marginTop: 8,
    textTransform: 'capitalize',
  },
  barValue: {
    fontSize: 10,
    marginTop: 2,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 20,
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
    fontSize: 11,
  },
});
