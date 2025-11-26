import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate } from '../utils/format';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import { AddIncomeModal } from '../components/AddIncomeModal';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../components/Header';

const { width } = Dimensions.get('window');

export const DashboardScreen = () => {
  const { balance, expenses, incomes, categories, recurringBills, theme, isValuesVisible } = useFinance();
  const [isIncomeModalVisible, setIsIncomeModalVisible] = useState(false);
  const navigation = useNavigation<any>();

  const totalExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return expenses
      .filter(e => {
        const date = new Date(e.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [expenses]);

  const pendingBillsCount = useMemo(() => {
    return recurringBills.filter(bill => !bill.isPaid).length;
  }, [recurringBills]);

  const chartData = useMemo(() => {
    const categoryTotals: { [key: string]: number } = {};
    expenses.forEach(expense => {
      if (!categoryTotals[expense.categoryId]) {
        categoryTotals[expense.categoryId] = 0;
      }
      categoryTotals[expense.categoryId] += expense.amount;
    });

    return Object.keys(categoryTotals).map(catId => {
      const category = categories.find(c => c.id === catId);
      return {
        name: category ? category.name : 'Outros',
        population: categoryTotals[catId],
        color: category ? category.color : theme.gray,
        legendFontColor: theme.textLight,
        legendFontSize: 12,
      };
    }).sort((a, b) => b.population - a.population);
  }, [expenses, categories, theme]);

  const recentIncomes = useMemo(() => {
    return [...incomes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
  }, [incomes]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Header 
          title="Visão Geral" 
          subtitle="Bem-vindo de volta" 
          showProfile 
        />

        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: theme.primary }]}>
          <View>
            <Text style={styles.balanceLabel}>Saldo Atual</Text>
            <Text style={styles.balanceValue}>
              {isValuesVisible ? formatCurrency(balance) : '••••••'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.addBalanceButton}
            onPress={() => setIsIncomeModalVisible(true)}
          >
            <Ionicons name="add" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Summary Row */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
            <View style={[styles.iconContainer, { backgroundColor: theme.danger + '20' }]}>
              <Ionicons name="arrow-down" size={20} color={theme.danger} />
            </View>
            <Text style={[styles.summaryLabel, { color: theme.textLight }]}>Gastos (Mês)</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>
              {isValuesVisible ? formatCurrency(totalExpenses) : '••••••'}
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
             <View style={[styles.iconContainer, { backgroundColor: theme.warning + '20' }]}>
              <Ionicons name="alert" size={20} color={theme.warning} />
            </View>
            <Text style={[styles.summaryLabel, { color: theme.textLight }]}>Contas Pendentes</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{pendingBillsCount}</Text>
          </View>
        </View>

        {/* Chart Section */}
        {chartData.length > 0 && (
          <View style={[styles.chartContainer, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Gastos por Categoria</Text>
            <PieChart
              data={chartData}
              width={width - 40}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        )}

        {/* Recent Incomes */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Entradas Recentes</Text>
        </View>

        {recentIncomes.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textLight }]}>Nenhuma entrada registrada.</Text>
        ) : (
          recentIncomes.map(income => (
            <View key={income.id} style={[styles.incomeItem, { backgroundColor: theme.card }]}>
              <View style={[styles.incomeIcon, { backgroundColor: theme.success + '20' }]}>
                <Ionicons name="arrow-up" size={20} color={theme.success} />
              </View>
              <View style={styles.incomeDetails}>
                <Text style={[styles.incomeDescription, { color: theme.text }]}>{income.description || 'Entrada'}</Text>
                <Text style={[styles.incomeDate, { color: theme.textLight }]}>{formatDate(income.date)}</Text>
              </View>
              <Text style={[styles.incomeAmount, { color: theme.success }]}>
                + {isValuesVisible ? formatCurrency(income.amount) : '••••••'}
              </Text>
            </View>
          ))
        )}

      </ScrollView>

      <AddIncomeModal 
        visible={isIncomeModalVisible} 
        onClose={() => setIsIncomeModalVisible(false)} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceValue: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  addBalanceButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chartContainer: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
  },
  incomeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  incomeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  incomeDetails: {
    flex: 1,
  },
  incomeDescription: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  incomeDate: {
    fontSize: 12,
  },
  incomeAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
