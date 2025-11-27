import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Modal, StyleSheet, TouchableOpacity, Alert, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFinance } from '../context/FinanceContext';
import { Income } from '../types';
import { formatDate } from '../utils/format';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  visible: boolean;
  onClose: () => void;
  incomeToEdit?: Income | null;
}

export const AddIncomeModal: React.FC<Props> = ({ visible, onClose, incomeToEdit }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('');
  const [date, setDate] = useState(new Date());

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [tempSalary, setTempSalary] = useState('');
  
  const { addIncome, editIncome, deleteIncome, userProfile, updateUserProfile, theme } = useFinance();

  useEffect(() => {
    if (visible && incomeToEdit) {
      setAmount(incomeToEdit.amount.toString());
      setDescription(incomeToEdit.description);
      setDate(new Date(incomeToEdit.date));
    } else if (visible && !incomeToEdit) {
      setAmount('');
      setDescription('');
      setSavingsGoal('');
      setDate(new Date());
    }
  }, [visible, incomeToEdit]);

  const handleSave = () => {
    if (!amount || isNaN(Number(amount))) {
      Alert.alert('Erro', 'Por favor, insira um valor válido.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Erro', 'Por favor, insira uma descrição.');
      return;
    }

    const incomeData = {
      amount: Number(amount),
      description,
      date: date.toISOString(),
    };

    if (incomeToEdit) {
      editIncome({ ...incomeToEdit, ...incomeData });
    } else {
      addIncome(incomeData);
    }

    if (savingsGoal) {
      updateUserProfile({
        ...userProfile,
        savingsGoal: parseFloat(savingsGoal.replace(',', '.'))
      });
    }

    setAmount('');
    setDescription('');
    setSavingsGoal('');
    setDate(new Date());
    onClose();
  };

  const handleQuickSalary = () => {
    if (userProfile.salaryAmount) {
      setAmount(userProfile.salaryAmount.toString());
      setDescription('Salário');
    } else {
      setIsEditingSalary(true);
    }
  };

  const handleSaveSalary = async () => {
    if (!tempSalary || isNaN(Number(tempSalary))) {
      Alert.alert('Erro', 'Valor inválido');
      return;
    }
    
    try {
      await updateUserProfile({
        ...userProfile,
        salaryAmount: parseFloat(tempSalary.replace(',', '.'))
      });
      setIsEditingSalary(false);
      setTempSalary('');
    } catch (e) {
      Alert.alert('Erro', 'Falha ao salvar salário');
    }
  };

  const handleDelete = () => {
    if (!incomeToEdit) return;

    Alert.alert(
      'Excluir Entrada',
      'Tem certeza que deseja excluir esta entrada? O valor será descontado do seu saldo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => {
            deleteIncome(incomeToEdit.id);
            onClose();
          }
        }
      ]
    );
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
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
                {incomeToEdit ? 'Editar Entrada' : 'Nova Entrada'}
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
                  style={[styles.amountInput, { color: theme.success }]}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={theme.textLight}
                  autoFocus
                />
              </View>

              {/* Quick Salary Button / Editor */}
              {isEditingSalary ? (
                <View style={styles.salaryEditContainer}>
                  <TextInput
                    style={[styles.salaryEditInput, { color: theme.text, borderColor: theme.success }]}
                    value={tempSalary}
                    onChangeText={setTempSalary}
                    placeholder="Novo valor"
                    placeholderTextColor={theme.textLight}
                    keyboardType="numeric"
                    autoFocus
                  />
                  <TouchableOpacity onPress={handleSaveSalary} style={[styles.salaryEditButton, { backgroundColor: theme.success }]}>
                    <Ionicons name="checkmark" size={20} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setIsEditingSalary(false)} style={[styles.salaryEditButton, { backgroundColor: theme.gray }]}>
                    <Ionicons name="close" size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.quickSalaryContainer}>
                  <TouchableOpacity 
                    style={[
                      styles.quickSalaryButton, 
                      { borderColor: userProfile.salaryAmount ? theme.success : theme.textLight }
                    ]}
                    onPress={handleQuickSalary}
                  >
                    <Ionicons 
                      name={userProfile.salaryAmount ? "cash-outline" : "add-circle-outline"} 
                      size={16} 
                      color={userProfile.salaryAmount ? theme.success : theme.textLight} 
                      style={{ marginRight: 6 }} 
                    />
                    <Text style={[
                      styles.quickSalaryText, 
                      { color: userProfile.salaryAmount ? theme.success : theme.textLight }
                    ]}>
                      {userProfile.salaryAmount 
                        ? `Usar Salário (R$ ${userProfile.salaryAmount.toFixed(2)})`
                        : 'Definir Salário Padrão'}
                    </Text>
                  </TouchableOpacity>
                  
                  {/* Edit Icon */}
                  <TouchableOpacity 
                    onPress={() => {
                      setTempSalary(userProfile.salaryAmount?.toString() || '');
                      setIsEditingSalary(true);
                    }}
                    style={styles.editSalaryIcon}
                  >
                    <Ionicons name="pencil" size={16} color={theme.textLight} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Description Input */}
              <View style={[styles.inputGroup, { backgroundColor: theme.background }]}>
                <Ionicons name="create-outline" size={20} color={theme.success} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Descrição (ex: Salário)"
                  placeholderTextColor={theme.textLight}
                />
              </View>

              {/* Date Input */}
              <TouchableOpacity 
                style={[styles.inputGroup, { backgroundColor: theme.background }]} 
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={theme.success} style={styles.inputIcon} />
                <Text style={[styles.inputText, { color: theme.text }]}>{formatDate(date.toISOString())}</Text>
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  themeVariant="light"
                />
              )}

              {/* Savings Goal Input */}
              <View style={[styles.inputGroup, { backgroundColor: theme.background }]}>
                <Ionicons name="wallet-outline" size={20} color={theme.success} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={savingsGoal}
                  onChangeText={setSavingsGoal}
                  placeholder="Meta de Economia (Opcional)"
                  placeholderTextColor={theme.textLight}
                  keyboardType="numeric"
                />
              </View>

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
                  <Text style={styles.saveButtonText}>
                    {incomeToEdit ? 'Salvar Alterações' : 'Adicionar Entrada'}
                  </Text>
                  <Ionicons name="checkmark-circle" size={24} color="#FFF" style={styles.saveIcon} />
                </LinearGradient>
              </TouchableOpacity>

              {incomeToEdit && (
                <TouchableOpacity 
                  style={styles.deleteButton} 
                  onPress={handleDelete}
                >
                  <Ionicons name="trash-outline" size={20} color={theme.danger || '#FF5252'} />
                  <Text style={[styles.deleteButtonText, { color: theme.danger || '#FF5252' }]}>Excluir Entrada</Text>
                </TouchableOpacity>
              )}

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
    maxHeight: '85%',
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
    minWidth: 120, // Increased minWidth
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
  inputText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButtonContainer: {
    borderRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginTop: 16,
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
  quickSalaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: -16,
  },
  quickSalaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickSalaryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  editSalaryIcon: {
    padding: 8,
    marginLeft: 4,
  },
  salaryEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: -16,
  },
  salaryEditInput: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: 120,
    marginRight: 8,
    fontSize: 14,
  },
  salaryEditButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 12,
  },
  deleteButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
});
