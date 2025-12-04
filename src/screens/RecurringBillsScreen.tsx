import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/format';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AVAILABLE_EMOJIS } from '../constants';
import { AddRecurringBillModal } from '../components/AddRecurringBillModal';
import { PaymentModal } from '../components/PaymentModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../components/Header';

export const RecurringBillsScreen = () => {
  const { recurringBills, markBillAsPaid, markBillAsUnpaid, deleteRecurringBill, categories, theme } = useFinance();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [billToPay, setBillToPay] = useState<any>(null);

  const sortedBills = useMemo(() => {
    return [...recurringBills].sort((a, b) => a.dueDay - b.dueDay);
  }, [recurringBills]);

  const totalBills = useMemo(() => {
    return recurringBills.reduce((acc, bill) => acc + bill.amount, 0);
  }, [recurringBills]);

  const handlePay = (bill: any) => {
    setBillToPay(bill);
    setPaymentModalVisible(true);
  };

  const handleConfirmPayment = (billId: string, amount: number, isPartial: boolean) => {
    markBillAsPaid(billId, amount, isPartial);
  };

  const handleUnpay = (id: string) => {
    Alert.alert(
      'Desfazer Pagamento',
      'Deseja marcar esta conta como pendente? O lançamento no extrato será removido.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => markBillAsUnpaid(id) }
      ]
    );
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Excluir Conta',
      'Tem certeza que deseja excluir esta conta fixa?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => deleteRecurringBill(id) }
      ]
    );
  };

  const handleEdit = (bill: any) => {
    setSelectedBill(bill);
    setModalVisible(true);
  };

  const getStatusColor = (bill: any) => {
    if (bill.isPaid) return theme.success;
    const today = new Date().getDate();
    if (today > bill.dueDay) return theme.danger;
    if (bill.dueDay - today <= 3) return theme.warning;
    return theme.textLight;
  };

  const getStatusText = (bill: any) => {
    if (bill.isPaid) return 'Pago';
    const today = new Date().getDate();
    if (today > bill.dueDay) return 'Atrasado';
    if (bill.dueDay - today <= 3) return 'Vence em breve';
    return 'Pendente';
  };

  const renderItem = ({ item }: { item: any }) => {
    const category = categories.find(c => c.id === item.categoryId);
    const statusColor = getStatusColor(item);
    const hasPartialPayments = item.partialPayments && item.partialPayments.length > 0;
    const originalAmount = item.originalAmount || item.amount;
    const paidAmount = hasPartialPayments 
      ? item.partialPayments.reduce((sum: number, p: any) => sum + p.amount, 0)
      : (item.isPaid ? originalAmount : 0);
    const paymentProgress = originalAmount > 0 ? (paidAmount / originalAmount) * 100 : 0;

    return (
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <View style={styles.cardContent}>
          <View style={[styles.iconContainer, { backgroundColor: (category?.color || theme.gray) + '20' }]}>
            {AVAILABLE_EMOJIS.includes(category?.icon || '') ? (
              <Text style={{ fontSize: 24 }}>{category?.icon}</Text>
            ) : (
              <Ionicons name={category?.icon as any || 'calendar'} size={24} color={category?.color || theme.gray} />
            )}
          </View>

          <View style={styles.infoContainer}>
            <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
            <Text style={[styles.dueDate, { color: theme.textLight }]}>Vence dia {item.dueDay}</Text>
            
            {/* Payment Progress */}
            {hasPartialPayments && !item.isPaid && (
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: theme.gray + '30' }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { backgroundColor: theme.warning, width: `${Math.min(paymentProgress, 100)}%` }
                    ]} 
                  />
                </View>
                <Text style={[styles.progressText, { color: theme.warning }]}>
                  {formatCurrency(paidAmount)} de {formatCurrency(originalAmount)}
                </Text>
              </View>
            )}
            
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {hasPartialPayments && !item.isPaid ? 'Parcialmente pago' : getStatusText(item)}
              </Text>
            </View>
          </View>

          <View style={styles.actionContainer}>
            <Text style={[styles.amount, { color: theme.text }]}>
              {hasPartialPayments && !item.isPaid 
                ? formatCurrency(item.amount) 
                : formatCurrency(originalAmount)
              }
            </Text>
            {hasPartialPayments && !item.isPaid && (
              <Text style={[styles.remainingLabel, { color: theme.textLight }]}>restante</Text>
            )}
            {!item.isPaid ? (
              <TouchableOpacity 
                style={[styles.payButton, { backgroundColor: theme.success }]}
                onPress={() => handlePay(item)}
              >
                <Text style={styles.payButtonText}>Pagar</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.payButton, { backgroundColor: theme.textLight + '40' }]}
                onPress={() => handleUnpay(item.id)}
              >
                <Text style={[styles.payButtonText, { color: theme.text }]}>Desfazer</Text>
              </TouchableOpacity>
            )}
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <Header 
        title="Contas Fixas" 
        subtitle="Gerencie seus pagamentos mensais"
      />

      {/* Total Card */}
      <LinearGradient
        colors={['#4A90E2', '#50E3C2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.totalCard}
      >
        <View style={styles.totalContent}>
          <Text style={styles.totalLabel}>Contas Fixas</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalBills)}</Text>
        </View>
        <View style={styles.totalIcon}>
          <Ionicons name="trending-up" size={32} color="rgba(255,255,255,0.5)" />
        </View>
      </LinearGradient>

      <FlatList
        data={sortedBills}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={theme.gray} />
            <Text style={[styles.emptyText, { color: theme.textLight }]}>Nenhuma conta fixa cadastrada</Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: theme.primary, shadowColor: theme.primary }]} 
        onPress={() => {
          setSelectedBill(null);
          setModalVisible(true);
        }}
      >
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>

      <AddRecurringBillModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        billToEdit={selectedBill}
      />

      <PaymentModal
        visible={paymentModalVisible}
        onClose={() => {
          setPaymentModalVisible(false);
          setBillToPay(null);
        }}
        bill={billToPay}
        onConfirmPayment={handleConfirmPayment}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'column',
    alignItems: 'stretch',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  dueDate: {
    fontSize: 12,
    marginBottom: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  actionContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  remainingLabel: {
    fontSize: 10,
    marginTop: -2,
    marginBottom: 4,
  },
  payButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  payButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 6,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  totalCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  totalContent: {
    flex: 1,
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  totalValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: -1,
  },
  totalIcon: {
    transform: [{ rotate: '15deg' }],
  },
});
