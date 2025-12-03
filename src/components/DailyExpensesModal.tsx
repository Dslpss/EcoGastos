import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Expense } from '../types';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/format';
import { AVAILABLE_EMOJIS } from '../constants';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DailyExpensesModalProps {
  visible: boolean;
  onClose: () => void;
  date: string; // YYYY-MM-DD
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export const DailyExpensesModal: React.FC<DailyExpensesModalProps> = ({
  visible,
  onClose,
  date,
  onEdit,
  onDelete,
}) => {
  const { expenses, categories, theme } = useFinance();

  const dailyExpenses = expenses.filter(e => {
    const expenseDate = format(new Date(e.date), 'yyyy-MM-dd');
    return expenseDate === date;
  });

  // Parse the date string correctly to avoid timezone issues
  const formattedDate = date ? format(parseISO(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '';

  const renderItem = ({ item }: { item: Expense }) => {
    const category = categories.find(c => c.id === item.categoryId);
    return (
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <View style={styles.cardContent}>
          <View style={[styles.iconContainer, { backgroundColor: (category?.color || theme.gray) + '15' }]}>
            {AVAILABLE_EMOJIS.includes(category?.icon || '') ? (
              <Text style={{ fontSize: 20 }}>{category?.icon}</Text>
            ) : (
              <Ionicons name={category?.icon as any || 'pricetag'} size={20} color={category?.color || theme.gray} />
            )}
          </View>
          
          <View style={styles.infoContainer}>
            <Text style={[styles.description, { color: theme.text }]} numberOfLines={1}>{item.description}</Text>
            <Text style={[styles.category, { color: theme.textLight }]}>{category?.name || 'Sem Categoria'}</Text>
          </View>

          <View style={styles.amountContainer}>
            <Text style={[styles.amount, { color: theme.text }]}>{formatCurrency(item.amount)}</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.primary + '15', marginRight: 8 }]}
            onPress={() => {
              onClose();
              onEdit(item);
            }}
          >
            <Ionicons name="create-outline" size={18} color={theme.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.danger + '15' }]}
            onPress={() => {
                onClose();
                onDelete(item.id);
            }}
          >
            <Ionicons name="trash-outline" size={18} color={theme.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1} />
        
        <View style={[styles.modalView, { backgroundColor: theme.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>{formattedDate}</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.gray + '20' }]}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {dailyExpenses.length > 0 ? (
            <FlatList
              data={dailyExpenses}
              renderItem={renderItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color={theme.textLight} />
              <Text style={[styles.emptyText, { color: theme.textLight }]}>Nenhum gasto neste dia</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  modalView: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    height: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
    marginRight: 8,
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
  },
  amountContainer: {
    marginRight: 12,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
  },
});
