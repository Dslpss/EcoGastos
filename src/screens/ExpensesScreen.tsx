import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, Alert, Animated } from 'react-native';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/format';
import { Ionicons } from '@expo/vector-icons';
import { AddExpenseModal } from '../components/AddExpenseModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../components/Header';
import { LinearGradient } from 'expo-linear-gradient';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const ExpensesScreen = () => {
  const { expenses, deleteExpense, categories, theme } = useFinance();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);

  // Group expenses by date
  const sections = useMemo(() => {
    const sorted = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const grouped: { [key: string]: any[] } = {};
    
    sorted.forEach(expense => {
      const date = new Date(expense.date);
      const dateKey = format(date, 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(expense);
    });

    return Object.keys(grouped).map(dateKey => {
      const date = parseISO(dateKey);
      let title = format(date, "dd 'de' MMMM", { locale: ptBR });
      
      if (isToday(date)) title = 'Hoje';
      if (isYesterday(date)) title = 'Ontem';

      return {
        title,
        data: grouped[dateKey],
        date: dateKey // for sorting if needed, but keys are already sorted by insertion order usually if processed from sorted array
      };
    });
  }, [expenses]);

  const totalMonth = useMemo(() => {
    const now = new Date();
    return expenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [expenses]);

  const handleDelete = (id: string) => {
    Alert.alert(
      'Excluir Despesa',
      'Tem certeza que deseja excluir esta despesa?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => deleteExpense(id) }
      ]
    );
  };

  const handleEdit = (expense: any) => {
    setSelectedExpense(expense);
    setModalVisible(true);
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const category = categories.find(c => c.id === item.categoryId);
    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: theme.card }]}
        onLongPress={() => handleDelete(item.id)}
        onPress={() => handleEdit(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: (category?.color || theme.gray) + '15' }]}>
          <Ionicons name={category?.icon as any || 'pricetag'} size={20} color={category?.color || theme.gray} />
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={[styles.description, { color: theme.text }]} numberOfLines={1}>{item.description}</Text>
          <Text style={[styles.category, { color: theme.textLight }]}>{category?.name || 'Sem Categoria'}</Text>
        </View>

        <View style={styles.amountContainer}>
          <Text style={[styles.amount, { color: theme.text }]}>{formatCurrency(item.amount)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section: { title } }: any) => (
    <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
      <Text style={[styles.sectionTitle, { color: theme.textLight }]}>{title}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Header 
          title="Extrato" 
          subtitle="Seus gastos detalhados"
        />

        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={
            <LinearGradient
              colors={[theme.primary, theme.secondary]}
              style={styles.summaryCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.summaryContent}>
                <View>
                  <Text style={styles.summaryLabel}>Gastos do Mês</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(totalMonth)}</Text>
                </View>
                <View style={styles.summaryIcon}>
                  <Ionicons name="trending-down" size={32} color="#FFF" />
                </View>
              </View>
            </LinearGradient>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color={theme.gray} />
              <Text style={[styles.emptyText, { color: theme.textLight }]}>Nenhum gasto registrado</Text>
            </View>
          }
        />

        <TouchableOpacity 
          style={[styles.fab, { shadowColor: theme.primary }]} 
          onPress={() => {
            setSelectedExpense(null);
            setModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.primary, theme.secondary]}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add" size={32} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>

        <AddExpenseModal 
          visible={modalVisible} 
          onClose={() => setModalVisible(false)}
          expenseToEdit={selectedExpense}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  summaryCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  summaryValue: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  summaryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  sectionHeader: {
    paddingVertical: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContainer: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    fontWeight: '500',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
});
