import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, Alert } from 'react-native';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/format';
import { Ionicons } from '@expo/vector-icons';
import { AddIncomeModal } from '../components/AddIncomeModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../components/Header';
import { LinearGradient } from 'expo-linear-gradient';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const IncomesScreen = () => {
  const { incomes, deleteIncome, theme } = useFinance();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<any>(null);

  // Group incomes by date
  const sections = useMemo(() => {
    const sorted = [...incomes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const grouped: { [key: string]: any[] } = {};
    
    sorted.forEach(income => {
      const date = new Date(income.date);
      const dateKey = format(date, 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(income);
    });

    return Object.keys(grouped).map(dateKey => {
      const date = parseISO(dateKey);
      let title = format(date, "dd 'de' MMMM", { locale: ptBR });
      
      if (isToday(date)) title = 'Hoje';
      if (isYesterday(date)) title = 'Ontem';

      return {
        title,
        data: grouped[dateKey],
        date: dateKey
      };
    });
  }, [incomes]);

  const totalMonth = useMemo(() => {
    const now = new Date();
    return incomes
      .filter(i => {
        const d = new Date(i.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [incomes]);

  const handleDelete = (id: string) => {
    Alert.alert(
      'Excluir Entrada',
      'Tem certeza que deseja excluir esta entrada?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => deleteIncome(id) }
      ]
    );
  };

  const handleEdit = (income: any) => {
    setSelectedIncome(income);
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: any }) => {
    return (
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <View style={styles.cardContent}>
          <LinearGradient
            colors={[theme.success + '20', theme.success + '10']}
            style={styles.iconContainer}
          >
            <Ionicons name="arrow-up" size={20} color={theme.success} />
          </LinearGradient>
          
          <View style={styles.infoContainer}>
            <Text style={[styles.description, { color: theme.text }]} numberOfLines={1}>{item.description || 'Entrada'}</Text>
            <Text style={[styles.date, { color: theme.textLight }]}>{format(new Date(item.date), "HH:mm")}</Text>
          </View>

          <View style={styles.amountContainer}>
            <Text style={[styles.amount, { color: theme.success }]}>+ {formatCurrency(item.amount)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.primary + '15', marginRight: 8 }]}
            onPress={() => handleEdit(item)}
          >
            <Ionicons name="create-outline" size={18} color={theme.primary} />
            <Text style={[styles.actionText, { color: theme.primary }]}>Editar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.danger + '15' }]}
            onPress={() => handleDelete(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color={theme.danger} />
            <Text style={[styles.actionText, { color: theme.danger }]}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </View>
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
          title="Entradas" 
          subtitle="Histórico de ganhos"
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
              colors={[theme.success, '#4CAF50']}
              style={styles.summaryCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.summaryContent}>
                <View>
                  <Text style={styles.summaryLabel}>Ganhos do Mês</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(totalMonth)}</Text>
                </View>
                <View style={styles.summaryIcon}>
                  <Ionicons name="trending-up" size={32} color="#FFF" />
                </View>
              </View>
            </LinearGradient>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={64} color={theme.gray} />
              <Text style={[styles.emptyText, { color: theme.textLight }]}>Nenhuma entrada registrada</Text>
            </View>
          }
        />

        <TouchableOpacity 
          style={[styles.fab, { shadowColor: theme.success }]} 
          onPress={() => {
            setSelectedIncome(null);
            setModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.success, '#4CAF50']}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add" size={32} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>

        <AddIncomeModal 
          visible={modalVisible} 
          onClose={() => setModalVisible(false)}
          incomeToEdit={selectedIncome}
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
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
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
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 12,
    fontWeight: '500',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
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
