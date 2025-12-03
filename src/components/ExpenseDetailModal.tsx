import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Expense } from '../types';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate } from '../utils/format';
import { AVAILABLE_EMOJIS } from '../constants';

const { width } = Dimensions.get('window');

interface ExpenseDetailModalProps {
  visible: boolean;
  onClose: () => void;
  expense: Expense | null;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  visible,
  onClose,
  expense,
  onEdit,
  onDelete,
}) => {
  const { categories, theme } = useFinance();

  if (!expense) return null;

  const category = categories.find(c => c.id === expense.categoryId);
  const formattedDate = new Date(expense.date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

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
        
        <View style={[styles.modalView, { backgroundColor: theme.card }]}>
          {/* Header Actions */}
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
            
            <View style={styles.rightActions}>
              <TouchableOpacity 
                style={[styles.actionIcon, { backgroundColor: theme.primary + '15' }]}
                onPress={() => {
                  onClose();
                  onEdit(expense);
                }}
              >
                <Ionicons name="pencil" size={20} color={theme.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionIcon, { backgroundColor: theme.danger + '15' }]}
                onPress={() => {
                  onClose();
                  onDelete(expense.id);
                }}
              >
                <Ionicons name="trash-outline" size={20} color={theme.danger} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {/* Main Icon & Title */}
            <View style={styles.mainInfo}>
              <View style={[styles.largeIconContainer, { backgroundColor: (category?.color || theme.gray) + '20' }]}>
                {AVAILABLE_EMOJIS.includes(category?.icon || '') ? (
                  <Text style={{ fontSize: 40 }}>{category?.icon}</Text>
                ) : (
                  <Ionicons name={category?.icon as any || 'pricetag'} size={40} color={category?.color || theme.gray} />
                )}
              </View>
              <Text style={[styles.expenseTitle, { color: theme.text }]}>{expense.description}</Text>
            </View>

            {/* Details List */}
            <View style={styles.detailsContainer}>
              
              {/* Category */}
              <View style={styles.detailRow}>
                <Text style={[styles.label, { color: theme.textLight }]}>Categoria</Text>
                <Text style={[styles.value, { color: theme.text }]}>{category?.name || 'Sem Categoria'}</Text>
              </View>
              
              <View style={[styles.separator, { backgroundColor: theme.gray + '20' }]} />

              {/* Amount */}
              <View style={styles.detailRow}>
                <Text style={[styles.label, { color: theme.textLight }]}>Montante</Text>
                <Text style={[styles.amountValue, { color: theme.danger }]}>
                  - {formatCurrency(expense.amount)}
                </Text>
              </View>

              <View style={[styles.separator, { backgroundColor: theme.gray + '20' }]} />

              {/* Date */}
              <View style={styles.detailRow}>
                <Text style={[styles.label, { color: theme.textLight }]}>Data</Text>
                <Text style={[styles.value, { color: theme.text }]}>{formattedDate}</Text>
              </View>

              <View style={[styles.separator, { backgroundColor: theme.gray + '20' }]} />

              {/* Wallet (Hardcoded for now as per image, or could be dynamic if we had wallets) */}
              <View style={styles.detailRow}>
                <Text style={[styles.label, { color: theme.textLight }]}>Carteira</Text>
                <Text style={[styles.value, { color: theme.text }]}>Dinheiro</Text>
              </View>

              <View style={[styles.separator, { backgroundColor: theme.gray + '20' }]} />

              {/* Type */}
              <View style={styles.detailRow}>
                <Text style={[styles.label, { color: theme.textLight }]}>Tipo</Text>
                <Text style={[styles.value, { color: theme.text }]}>Despesa</Text>
              </View>

            </View>
          </ScrollView>
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
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    minHeight: '60%',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  closeButton: {
    padding: 8,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  mainInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  largeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  expenseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  detailsContainer: {
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  label: {
    fontSize: 16,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    width: '100%',
  },
});
