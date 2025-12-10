import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFinance } from '../context/FinanceContext';
import { Income } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PieChart } from 'react-native-chart-kit';
import { AddIncomeModal } from '../components/AddIncomeModal';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../components/Header';
import { FinancialHealthCard } from '../components/FinancialHealthCard';
import { WarningCard } from '../components/WarningCard';
import { useAppConfig } from '../context/AppConfigContext';
import { FeatureCardsSlider } from '../components/FeatureCardsSlider';
import { MonthSelector } from '../components/MonthSelector';
import { MonthlyComparisonCard } from '../components/MonthlyComparisonCard';
import { WeeklyReportCard } from '../components/WeeklyReportCard';

const { width } = Dimensions.get('window');

export const DashboardScreen = () => {
  const { balance, expenses, incomes, categories, recurringBills, theme, isValuesVisible, userProfile, deleteIncome, selectedDate } = useFinance();
  const { showWarning, warningMessage } = useAppConfig();
  const [isIncomeModalVisible, setIsIncomeModalVisible] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const navigation = useNavigation<any>();

  const handleDeleteIncome = (income: Income) => {
    Alert.alert(
      'Excluir Entrada',
      'Tem certeza que deseja excluir esta entrada?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => deleteIncome(income.id)
        }
      ]
    );
  };

  const monthlyExpenses = useMemo(() => {
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();

    return expenses.filter(e => {
      const date = new Date(e.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
  }, [expenses, selectedDate]);

  const totalExpenses = useMemo(() => {
    return monthlyExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [monthlyExpenses]);

  const totalIncome = useMemo(() => {
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();

    return incomes
      .filter(i => {
        const date = new Date(i.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [incomes, selectedDate]);

  const currentSavings = totalIncome - totalExpenses;
  const savingsGoal = userProfile.savingsGoal || 0;
  const savingsProgress = savingsGoal > 0 ? Math.min((currentSavings / savingsGoal) * 100, 100) : 0;
  
  // Calculate how much can still be spent while keeping the savings goal
  // Safe to Spend = (Income - Goal) - Expenses
  // If result is negative, it means they overspent or haven't earned enough yet
  const safeToSpend = Math.max(0, (totalIncome - savingsGoal) - totalExpenses);

  const pendingBillsCount = useMemo(() => {
    return recurringBills.filter(bill => !bill.isPaid).length;
  }, [recurringBills]);

  const chartData = useMemo(() => {
    const categoryTotals: { [key: string]: number } = {};
    monthlyExpenses.forEach(expense => {
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
  }, [monthlyExpenses, categories, theme]);

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

        <MonthSelector />

        {/* Feature Cards Slider (Admin) */}
        <FeatureCardsSlider />

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

        {/* Warning Card */}
        {showWarning && warningMessage && (
          <WarningCard message={warningMessage} />
        )}

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

        {/* Financial Health Insight */}
        <FinancialHealthCard 
          income={totalIncome} 
          expenses={totalExpenses} 
          savingsGoal={savingsGoal} 
        />

        {/* Savings Goal Card */}
        {savingsGoal > 0 && (
          <View style={[styles.savingsCard, { backgroundColor: theme.card }]}>
            <View style={styles.savingsHeader}>
              <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20', marginBottom: 0 }]}>
                <Ionicons name="wallet" size={20} color={theme.primary} />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0, marginLeft: 10, fontSize: 16 }]}>
                Meta de Economia
              </Text>
            </View>
            
            <View style={styles.savingsInfo}>
              <View>
                <Text style={[styles.summaryLabel, { color: theme.textLight }]}>Atual</Text>
                <Text style={[styles.savingsValue, { color: currentSavings >= 0 ? theme.success : theme.danger }]}>
                  {isValuesVisible ? formatCurrency(currentSavings) : '••••••'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.summaryLabel, { color: theme.textLight }]}>Meta</Text>
                <Text style={[styles.savingsValue, { color: theme.text }]}>
                  {isValuesVisible ? formatCurrency(savingsGoal) : '••••••'}
                </Text>
              </View>
            </View>

            <View style={[styles.progressBarBackground, { backgroundColor: theme.gray + '30' }]}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${savingsProgress}%`,
                    backgroundColor: savingsProgress >= 100 ? theme.success : theme.primary 
                  }
                ]} 
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={[styles.progressText, { color: theme.textLight }]}>
                {savingsProgress.toFixed(0)}% da meta
              </Text>
              <Text style={[styles.progressText, { color: theme.textLight }]}>
                Pode gastar: <Text style={{ color: theme.success, fontWeight: 'bold' }}>{isValuesVisible ? formatCurrency(safeToSpend) : '••••••'}</Text>
              </Text>
            </View>
          </View>
        )}

        {/* Chart Section */}
        {chartData.length > 0 && (
          <View style={[styles.chartContainer, { backgroundColor: theme.card }]}>
            <View style={styles.chartHeader}>
              <View style={[styles.iconContainer, { backgroundColor: theme.secondary + '20', marginBottom: 0 }]}>
                <Ionicons name="pie-chart" size={20} color={theme.secondary} />
              </View>
              <Text style={[styles.chartTitle, { color: theme.text }]}>Gastos por Categoria</Text>
            </View>
            
            <View style={{ alignItems: 'center' }}>
              <PieChart
                data={chartData}
                width={width - 40}
                height={200}
                chartConfig={{
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => theme.text,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="0"
                center={[(width - 40) / 4, 0]}
                hasLegend={false}
              />
            </View>

            <View style={styles.legendContainer}>
              {chartData.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                  <Text style={[styles.legendText, { color: theme.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.legendValue, { color: theme.textLight }]}>
                    {((item.population / totalExpenses) * 100).toFixed(0)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Monthly Comparison */}
        <MonthlyComparisonCard />

        {/* Weekly Report */}
        <WeeklyReportCard />

        {/* Recent Incomes */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Entradas Recentes</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Incomes')}>
            <Text style={{ color: theme.primary, fontWeight: '600' }}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        {recentIncomes.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textLight }]}>Nenhuma entrada registrada.</Text>
        ) : (
          recentIncomes.map(income => (
            <View 
              key={income.id} 
              style={[styles.incomeItem, { backgroundColor: theme.card }]}
            >
              <View style={styles.incomeLeftContent}>
                <LinearGradient
                  colors={[theme.success + '20', theme.success + '10']}
                  style={styles.incomeIcon}
                >
                  <Ionicons name="arrow-up" size={20} color={theme.success} />
                </LinearGradient>
                <View style={styles.incomeDetails}>
                  <Text style={[styles.incomeDescription, { color: theme.text }]}>{income.description || 'Entrada'}</Text>
                  <Text style={[styles.incomeDate, { color: theme.textLight }]}>{formatDate(income.date)}</Text>
                </View>
              </View>

              <View style={styles.incomeRightContent}>
                <Text style={[styles.incomeAmount, { color: theme.success }]}>
                  + {isValuesVisible ? formatCurrency(income.amount) : '••••••'}
                </Text>
                
                <View style={styles.incomeActions}>
                  <TouchableOpacity 
                    onPress={() => {
                      setSelectedIncome(income);
                      setIsIncomeModalVisible(true);
                    }}
                    style={[styles.actionButton, { backgroundColor: theme.primary + '15' }]}
                  >
                    <Ionicons name="pencil" size={16} color={theme.primary} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={() => handleDeleteIncome(income)}
                    style={[styles.actionButton, { backgroundColor: theme.danger + '15' }]}
                  >
                    <Ionicons name="trash-outline" size={16} color={theme.danger || '#FF5252'} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}

      </ScrollView>

      <AddIncomeModal 
        visible={isIncomeModalVisible} 
        onClose={() => {
          setIsIncomeModalVisible(false);
          setSelectedIncome(null);
        }}
        incomeToEdit={selectedIncome}
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
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 6,
    maxWidth: 100,
  },
  legendValue: {
    fontSize: 12,
    fontWeight: 'bold',
    opacity: 0.7,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
  },
  incomeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  incomeLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  incomeRightContent: {
    alignItems: 'flex-end',
  },
  incomeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  incomeDetails: {
    flex: 1,
  },
  incomeDescription: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  incomeDate: {
    fontSize: 12,
  },
  incomeAmount: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  incomeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  savingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  savingsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  savingsValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'right',
  },
});
