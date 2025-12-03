import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Modal, StyleSheet, TouchableOpacity, Alert, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFinance } from '../context/FinanceContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RecurringIncome } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  incomeToEdit?: RecurringIncome | null;
}

export const AddRecurringIncomeModal: React.FC<Props> = ({ visible, onClose, incomeToEdit }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const { addRecurringIncome, updateRecurringIncome, theme } = useFinance();

  useEffect(() => {
    if (incomeToEdit) {
      setName(incomeToEdit.name);
      setAmount(incomeToEdit.amount.toString());
      setDescription(incomeToEdit.description || '');
      
      // Set date to current month/year but with the income's payment day
      const now = new Date();
      const incomeDate = new Date(now.getFullYear(), now.getMonth(), incomeToEdit.paymentDay);
      setDate(incomeDate);
    } else {
      setName('');
      setAmount('');
      setDescription('');
      setDate(new Date());
    }
  }, [incomeToEdit, visible]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Por favor, insira um nome.');
      return;
    }
    if (!amount || isNaN(Number(amount))) {
      Alert.alert('Erro', 'Por favor, insira um valor válido.');
      return;
    }
    const day = date.getDate();

    if (incomeToEdit) {
      updateRecurringIncome({
        ...incomeToEdit,
        name,
        amount: Number(amount),
        paymentDay: day,
        description,
      });
    } else {
      addRecurringIncome({
        id: Date.now().toString(),
        name,
        amount: Number(amount),
        paymentDay: day,
        description,
        isReceived: false,
      });
    }

    setName('');
    setAmount('');
    setDescription('');
    setDate(new Date());
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={[styles.container, { backgroundColor: theme.card }]}>
            
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>
                {incomeToEdit ? 'Editar Renda Fixa' : 'Nova Renda Fixa'}
              </Text>
              <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.gray + '20' }]}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              
              {/* Amount Input */}
              <View style={styles.amountContainer}>
                <Text style={[styles.currencySymbol, { color: theme.textLight }]}>R$</Text>
                <TextInput
                  style={[styles.amountInput, { color: theme.text }]}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={theme.textLight}
                />
              </View>

              {/* Name Input */}
              <View style={[styles.inputGroup, { backgroundColor: theme.background }]}>
                <Ionicons name="wallet-outline" size={20} color={theme.success} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Nome (ex: Salário)"
                  placeholderTextColor={theme.textLight}
                />
              </View>

              {/* Description Input */}
              <View style={[styles.inputGroup, { backgroundColor: theme.background }]}>
                <Ionicons name="document-text-outline" size={20} color={theme.success} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Descrição (opcional)"
                  placeholderTextColor={theme.textLight}
                />
              </View>

              {/* Payment Day Input */}
              <View style={[styles.inputGroup, { backgroundColor: theme.background }]}>
                <Ionicons name="calendar-number-outline" size={20} color={theme.success} style={styles.inputIcon} />
                <TouchableOpacity 
                  onPress={() => setShowDatePicker(true)}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <Text style={[styles.input, { color: theme.text }]}>
                    Dia {date.getDate()} de cada mês
                  </Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setDate(selectedDate);
                    }
                  }}
                  maximumDate={new Date(new Date().getFullYear() + 1, 11, 31)}
                  minimumDate={new Date(2000, 0, 1)}
                />
              )}

              {/* Save Button */}
              <TouchableOpacity 
                style={[styles.saveButtonContainer, { shadowColor: theme.success }]} 
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[theme.success, '#2ecc71']}
                  style={styles.saveButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.saveButtonText}>Salvar Renda</Text>
                  <Ionicons name="checkmark-circle" size={24} color="#FFF" style={styles.saveIcon} />
                </LinearGradient>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
  },
  container: {
    borderRadius: 32,
    margin: 16,
    marginBottom: 34,
    padding: 24,
    paddingBottom: 24,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    marginRight: 8,
    marginTop: 8,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: 'bold',
    minWidth: 120,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  saveButtonContainer: {
    borderRadius: 20,
    marginTop: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 12,
  },
  saveIcon: {
    marginLeft: 4,
  },
});
