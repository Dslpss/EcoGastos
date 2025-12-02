import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { getFinancialHealth } from '../utils/financialInsights';
import { AVAILABLE_EMOJIS } from '../constants';

interface Props {
  income: number;
  expenses: number;
  savingsGoal: number;
}

export const FinancialHealthCard: React.FC<Props> = ({ income, expenses, savingsGoal }) => {
  const { theme } = useFinance();

  const health = useMemo(() => {
    return getFinancialHealth(income, expenses, savingsGoal);
  }, [income, expenses, savingsGoal]);

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <View style={[styles.iconContainer, { backgroundColor: health.color + '20' }]}>
        {AVAILABLE_EMOJIS.includes(health.icon || '') ? (
          <Text style={{ fontSize: 24 }}>{health.icon}</Text>
        ) : (
          <Ionicons name={health.icon as any} size={24} color={health.color} />
        )}
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Análise Financeira</Text>
        <Text style={[styles.message, { color: theme.textLight }]}>{health.message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
});
