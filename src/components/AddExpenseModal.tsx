import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Modal, StyleSheet, TouchableOpacity, Alert, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFinance } from '../context/FinanceContext';
import { Expense } from '../types';
import { formatDate } from '../utils/format';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AVAILABLE_EMOJIS } from '../constants';
import { ReceiptScanner } from './ReceiptScanner';

interface Props {
  visible: boolean;
  onClose: () => void;
  expenseToEdit?: Expense | null;
}

export const AddExpenseModal: React.FC<Props> = ({ visible, onClose, expenseToEdit }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { addExpense, updateExpense, categories, deleteExpense, theme } = useFinance();

  useEffect(() => {
    if (expenseToEdit) {
      setAmount(expenseToEdit.amount.toString());
      setDescription(expenseToEdit.description);
      setCategoryId(expenseToEdit.categoryId);
      setDate(new Date(expenseToEdit.date));
    } else {
      resetForm();
    }
  }, [expenseToEdit, visible]);

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setCategoryId('');
    setDate(new Date());
  };

  const handleSave = () => {
    if (!amount || isNaN(Number(amount))) {
      Alert.alert('Erro', 'Por favor, insira um valor válido.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Erro', 'Por favor, insira uma descrição.');
      return;
    }
    if (!categoryId) {
      Alert.alert('Erro', 'Por favor, selecione uma categoria.');
      return;
    }

    const expenseData = {
      amount: Number(amount),
      description,
      categoryId,
      date: date.toISOString(),
    };

    if (expenseToEdit) {
      updateExpense({
        ...expenseData,
        id: expenseToEdit.id
      });
    } else {
      addExpense(expenseData);
    }

    resetForm();
    onClose();
  };

  const handleScanComplete = (data: any) => {
    if (data.amount) setAmount(data.amount.toString());
    if (data.description) setDescription(data.description);
     if (data.date) {
      const parsedDate = new Date(data.date);
       if (!isNaN(parsedDate.getTime())) {
         setDate(parsedDate);
       }
    }
    
    if (data.category) {
      // Try to find a matching category
      const matchedCategory = categories.find(c => 
        c.name.toLowerCase().includes(data.category.toLowerCase()) || 
        data.category.toLowerCase().includes(c.name.toLowerCase())
      );
      if (matchedCategory) {
        setCategoryId(matchedCategory.id);
      }
    }
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
                {expenseToEdit ? 'Editar Despesa' : 'Nova Despesa'}
              </Text>
              <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.gray + '20' }]}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              
              {!expenseToEdit && (
                <View style={{ marginBottom: 24 }}>
                  <ReceiptScanner onScanComplete={handleScanComplete} theme={theme} />
                </View>
              )}

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
                  autoFocus={!expenseToEdit}
                />
              </View>

              {/* Description Input */}
              <View style={[styles.inputGroup, { backgroundColor: theme.background }]}>
                <Ionicons name="create-outline" size={20} color={theme.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Descrição (ex: Almoço)"
                  placeholderTextColor={theme.textLight}
                />
              </View>

              {/* Date Input */}
              <TouchableOpacity 
                style={[styles.inputGroup, { backgroundColor: theme.background }]} 
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={theme.primary} style={styles.inputIcon} />
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

              {/* Categories */}
              <Text style={[styles.sectionLabel, { color: theme.textLight }]}>Categoria</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.categoriesContainer}
              >
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      categoryId === cat.id 
                        ? { backgroundColor: cat.color, borderColor: cat.color, transform: [{ scale: 1.05 }] }
                        : { backgroundColor: theme.background, borderColor: theme.gray }
                    ]}
                    onPress={() => setCategoryId(cat.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.categoryIcon, 
                      { backgroundColor: categoryId === cat.id ? 'rgba(255,255,255,0.2)' : cat.color + '20' }
                    ]}>
                      {AVAILABLE_EMOJIS.includes(cat.icon || '') ? (
                        <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
                      ) : (
                        <Ionicons 
                          name={cat.icon as any || 'pricetag'} 
                          size={16} 
                          color={categoryId === cat.id ? '#FFF' : cat.color} 
                        />
                      )}
                    </View>
                    <Text style={[
                      styles.categoryText,
                      { color: categoryId === cat.id ? '#FFF' : theme.text }
                    ]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Save Button */}
              <TouchableOpacity 
                style={[styles.saveButtonContainer, { shadowColor: theme.primary }]} 
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[theme.primary, theme.secondary]}
                  style={styles.saveButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.saveButtonText}>Salvar Despesa</Text>
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
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    marginTop: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  categoriesContainer: {
    paddingRight: 20,
    marginBottom: 32,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    marginRight: 12,
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButtonContainer: {
    borderRadius: 20,
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
