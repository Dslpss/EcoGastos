import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/format';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  bill: {
    id: string;
    name: string;
    amount: number;
    categoryId: string;
  } | null;
  onConfirmPayment: (billId: string, amount: number, isPartial: boolean) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  onClose,
  bill,
  onConfirmPayment,
}) => {
  const { theme } = useFinance();
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full');
  const [partialAmount, setPartialAmount] = useState('');

  useEffect(() => {
    if (visible && bill) {
      setPaymentType('full');
      setPartialAmount('');
    }
  }, [visible, bill]);

  const handleConfirm = () => {
    if (!bill) return;

    if (paymentType === 'full') {
      onConfirmPayment(bill.id, bill.amount, false);
    } else {
      const amount = parseFloat(partialAmount.replace(',', '.'));
      if (isNaN(amount) || amount <= 0) {
        return;
      }
      if (amount > bill.amount) {
        return;
      }
      onConfirmPayment(bill.id, amount, true);
    }
    onClose();
  };

  const formatInputValue = (value: string) => {
    // Remove tudo exceto números e vírgula/ponto
    const cleaned = value.replace(/[^\d,\.]/g, '');
    return cleaned;
  };

  const isValidAmount = () => {
    if (paymentType === 'full') return true;
    const amount = parseFloat(partialAmount.replace(',', '.'));
    return !isNaN(amount) && amount > 0 && amount <= (bill?.amount || 0);
  };

  const getRemainingAmount = () => {
    if (!bill) return 0;
    const paid = parseFloat(partialAmount.replace(',', '.')) || 0;
    return Math.max(0, bill.amount - paid);
  };

  if (!bill) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.overlay}
        >
          <View style={[styles.container, { backgroundColor: theme.card }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>Pagar Conta</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.textLight} />
              </TouchableOpacity>
            </View>

            {/* Bill Info */}
            <View style={[styles.billInfo, { backgroundColor: theme.background }]}>
              <Text style={[styles.billName, { color: theme.text }]}>{bill.name}</Text>
              <Text style={[styles.billAmount, { color: theme.primary }]}>
                {formatCurrency(bill.amount)}
              </Text>
            </View>

            {/* Payment Options */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Como deseja pagar?
            </Text>

            {/* Full Payment Option */}
            <TouchableOpacity
              style={[
                styles.optionCard,
                { 
                  backgroundColor: theme.background,
                  borderColor: paymentType === 'full' ? theme.success : 'transparent',
                  borderWidth: 2,
                },
              ]}
              onPress={() => setPaymentType('full')}
            >
              <View style={[styles.radioOuter, { borderColor: paymentType === 'full' ? theme.success : theme.textLight }]}>
                {paymentType === 'full' && (
                  <View style={[styles.radioInner, { backgroundColor: theme.success }]} />
                )}
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>
                  Valor Completo
                </Text>
                <Text style={[styles.optionDescription, { color: theme.textLight }]}>
                  Pagar {formatCurrency(bill.amount)}
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color={theme.success} />
            </TouchableOpacity>

            {/* Partial Payment Option */}
            <TouchableOpacity
              style={[
                styles.optionCard,
                { 
                  backgroundColor: theme.background,
                  borderColor: paymentType === 'partial' ? theme.warning : 'transparent',
                  borderWidth: 2,
                },
              ]}
              onPress={() => setPaymentType('partial')}
            >
              <View style={[styles.radioOuter, { borderColor: paymentType === 'partial' ? theme.warning : theme.textLight }]}>
                {paymentType === 'partial' && (
                  <View style={[styles.radioInner, { backgroundColor: theme.warning }]} />
                )}
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>
                  Valor Parcial
                </Text>
                <Text style={[styles.optionDescription, { color: theme.textLight }]}>
                  Pagar apenas uma parte do valor
                </Text>
              </View>
              <Ionicons name="pie-chart" size={24} color={theme.warning} />
            </TouchableOpacity>

            {/* Partial Amount Input */}
            {paymentType === 'partial' && (
              <View style={styles.partialInputContainer}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Quanto deseja pagar?
                </Text>
                <View style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: theme.primary }]}>
                  <Text style={[styles.currencySymbol, { color: theme.primary }]}>R$</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    value={partialAmount}
                    onChangeText={(text) => setPartialAmount(formatInputValue(text))}
                    placeholder="0,00"
                    placeholderTextColor={theme.textLight}
                    keyboardType="decimal-pad"
                    autoFocus
                  />
                </View>
                
                {partialAmount && (
                  <View style={styles.remainingInfo}>
                    <Text style={[styles.remainingLabel, { color: theme.textLight }]}>
                      Valor restante:
                    </Text>
                    <Text style={[styles.remainingValue, { color: theme.danger }]}>
                      {formatCurrency(getRemainingAmount())}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Confirm Button */}
            <TouchableOpacity
              style={[
                styles.confirmButton,
                { 
                  backgroundColor: isValidAmount() ? theme.success : theme.gray,
                },
              ]}
              onPress={handleConfirm}
              disabled={!isValidAmount()}
            >
              <Ionicons name="checkmark" size={20} color="#FFF" />
              <Text style={styles.confirmButtonText}>
                {paymentType === 'full' 
                  ? 'Confirmar Pagamento' 
                  : `Pagar ${partialAmount ? formatCurrency(parseFloat(partialAmount.replace(',', '.')) || 0) : 'R$ 0,00'}`
                }
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  billInfo: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  billName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  billAmount: {
    fontSize: 28,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
  },
  partialInputContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
  },
  remainingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  remainingLabel: {
    fontSize: 14,
  },
  remainingValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  confirmButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
