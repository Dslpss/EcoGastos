import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFinance } from '../context/FinanceContext';
import { useWeeklyReport } from '../hooks/useWeeklyReport';
import { formatCurrency } from '../utils/format';
import { Ionicons } from '@expo/vector-icons';

export const WeeklyReportCard = () => {
  const { theme, isValuesVisible } = useFinance();
  const report = useWeeklyReport();

  const renderChangeIndicator = () => {
    if (report.percentChange === null) return null;
    
    const isPositive = report.percentChange > 0;
    const isNeutral = report.percentChange === 0;
    
    return (
      <View style={[
        styles.changeTag,
        { 
          backgroundColor: isNeutral 
            ? theme.gray + '20' 
            : isPositive 
              ? theme.danger + '15' 
              : theme.success + '15' 
        }
      ]}>
        {!isNeutral && (
          <Ionicons 
            name={isPositive ? 'arrow-up' : 'arrow-down'} 
            size={12} 
            color={isPositive ? theme.danger : theme.success} 
          />
        )}
        <Text style={[
          styles.changeTagText,
          { color: isNeutral ? theme.textLight : isPositive ? theme.danger : theme.success }
        ]}>
          {isNeutral ? '0%' : `${Math.abs(report.percentChange).toFixed(0)}%`}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: theme.secondary + '20' }]}>
          <Ionicons name="calendar" size={20} color={theme.secondary} />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, { color: theme.text }]}>Resumo da Semana</Text>
          <Text style={[styles.subtitle, { color: theme.textLight }]}>
            {report.weekStartDate} - {report.weekEndDate}
          </Text>
        </View>
      </View>

      {/* Main Stats */}
      <View style={[styles.mainStatsContainer, { backgroundColor: theme.background }]}>
        <View style={styles.mainStatItem}>
          <Text style={[styles.mainStatLabel, { color: theme.textLight }]}>Total da Semana</Text>
          <View style={styles.mainStatValueRow}>
            <Text style={[styles.mainStatValue, { color: theme.text }]}>
              {isValuesVisible ? formatCurrency(report.currentWeekTotal) : '••••••'}
            </Text>
            {renderChangeIndicator()}
          </View>
          <Text style={[styles.comparisonText, { color: theme.textLight }]}>
            Semana anterior: {isValuesVisible ? formatCurrency(report.previousWeekTotal) : '••••'}
          </Text>
        </View>
      </View>

      {/* Quick Stats Row */}
      <View style={styles.quickStatsRow}>
        <View style={[styles.quickStatCard, { backgroundColor: theme.primary + '10' }]}>
          <Ionicons name="today-outline" size={18} color={theme.primary} />
          <Text style={[styles.quickStatValue, { color: theme.text }]}>
            {isValuesVisible ? formatCurrency(report.dailyAverage) : '••••'}
          </Text>
          <Text style={[styles.quickStatLabel, { color: theme.textLight }]}>Média/dia</Text>
        </View>
        <View style={[styles.quickStatCard, { backgroundColor: theme.warning + '10' }]}>
          <Ionicons name="receipt-outline" size={18} color={theme.warning} />
          <Text style={[styles.quickStatValue, { color: theme.text }]}>
            {report.totalTransactions}
          </Text>
          <Text style={[styles.quickStatLabel, { color: theme.textLight }]}>Transações</Text>
        </View>
      </View>

      {/* Top Categories */}
      {report.topCategories.length > 0 && (
        <View style={styles.categoriesSection}>
          <Text style={[styles.categoriesSectionTitle, { color: theme.text }]}>
            Top Categorias
          </Text>
          {report.topCategories.map((category, index) => (
            <View key={category.categoryId} style={styles.categoryItem}>
              <View style={styles.categoryLeft}>
                <View style={[styles.categoryDot, { backgroundColor: category.categoryColor }]} />
                <Text style={[styles.categoryName, { color: theme.text }]} numberOfLines={1}>
                  {category.categoryName}
                </Text>
              </View>
              <View style={styles.categoryRight}>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { 
                        width: `${category.percentage}%`,
                        backgroundColor: category.categoryColor + '80'
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.categoryValue, { color: theme.textLight }]}>
                  {isValuesVisible ? formatCurrency(category.total) : '••••'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Empty State */}
      {report.currentWeekTotal === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="leaf-outline" size={32} color={theme.success} />
          <Text style={[styles.emptyStateText, { color: theme.text }]}>
            🎉 Nenhum gasto essa semana!
          </Text>
        </View>
      )}
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
    marginBottom: 16,
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
  mainStatsContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  mainStatItem: {},
  mainStatLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  mainStatValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mainStatValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  changeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
  },
  changeTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  comparisonText: {
    fontSize: 11,
    marginTop: 6,
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickStatCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  quickStatLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoriesSection: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  categoriesSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBarContainer: {
    width: 60,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  categoryValue: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 70,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
