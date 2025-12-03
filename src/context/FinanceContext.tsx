import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import { FinanceState, Expense, Category, RecurringBill, RecurringIncome, Income, UserProfile, AppSettings } from '../types';
import { DEFAULT_CATEGORIES, THEME } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync, scheduleBillNotification, cancelBillNotification, cancelAllNotifications, scheduleAllBillNotifications } from '../utils/notifications';
import { financeAPI, authAPI } from '../services/api';
import { useAuth } from './AuthContext';

interface FinanceContextData {
  balance: number;
  expenses: Expense[];
  incomes: Income[];
  categories: Category[];
  recurringBills: RecurringBill[];
  userProfile: UserProfile;
  settings: AppSettings;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<string>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addIncome: (income: Omit<Income, 'id'>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  editIncome: (income: Income) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addRecurringBill: (bill: Omit<RecurringBill, 'id'>) => Promise<void>;
  updateRecurringBill: (bill: RecurringBill) => Promise<void>;
  deleteRecurringBill: (id: string) => Promise<void>;
  updateBalance: (amount: number) => void;
  markBillAsPaid: (id: string) => Promise<void>;
  markBillAsUnpaid: (id: string) => Promise<void>;
  updateUserProfile: (profile: UserProfile) => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  isLoading: boolean;
  theme: typeof THEME.light;
  isValuesVisible: boolean;
  toggleValuesVisibility: () => void;
  clearData: () => Promise<void>;
  selectedDate: Date;
  changeMonth: (increment: number) => void;
  // Recurring Income
  recurringIncomes: RecurringIncome[];
  addRecurringIncome: (income: RecurringIncome) => Promise<void>;
  updateRecurringIncome: (income: RecurringIncome) => Promise<void>;
  deleteRecurringIncome: (id: string) => Promise<void>;
  markIncomeAsReceived: (id: string) => Promise<void>;
  markIncomeAsUnaccounted: (id: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextData>({} as FinanceContextData);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, currentUser, isLoading: isAuthLoading } = useAuth();
  const [balance, setBalance] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  const [recurringIncomes, setRecurringIncomes] = useState<RecurringIncome[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: 'Usuário', email: 'usuario@exemplo.com', savingsGoal: 0 });
  const [settings, setSettings] = useState<AppSettings>({ isDarkMode: true, notificationsEnabled: true, biometricsEnabled: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isValuesVisible, setIsValuesVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const changeMonth = (increment: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setSelectedDate(newDate);
  };

  const toggleValuesVisibility = () => {
    setIsValuesVisible(prev => !prev);
  };

  // Load data when authenticated
  useEffect(() => {
    if (isAuthLoading) return;

    if (isAuthenticated) {
      loadData();
    } else {
      // Reset state on logout
      setBalance(0);
      setExpenses([]);
      setIncomes([]);
      setCategories(DEFAULT_CATEGORIES);
      setRecurringBills([]);
      setRecurringIncomes([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, isAuthLoading]);

  // Update user profile when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setUserProfile({
        name: currentUser.name,
        email: currentUser.email,
        savingsGoal: currentUser.profile?.savingsGoal || 0,
        salaryDay: currentUser.profile?.salaryDay,
        salaryAmount: currentUser.profile?.salaryAmount,
      });
      if (currentUser.settings) {
        setSettings(prev => ({ ...prev, ...currentUser.settings }));
      }
    }
  }, [currentUser]);

  // Check for Payday
  useEffect(() => {
    if (userProfile.salaryDay) {
      checkPayday();
    }
  }, [userProfile.salaryDay]);

  const checkPayday = async () => {
    const today = new Date();
    const currentDay = today.getDate();
    
    if (currentDay === userProfile.salaryDay) {
      const currentMonthKey = `${today.getMonth()}-${today.getFullYear()}`;
      const lastAlert = await AsyncStorage.getItem('@eco_gastos_payday_alert');
      
      if (lastAlert !== currentMonthKey) {
        Alert.alert(
          '💸 Dia do Pagamento!',
          'Hoje é o dia do seu pagamento. O que deseja fazer?',
          [
            { text: 'Mais tarde', style: 'cancel' },
            { 
              text: 'Gerar Relatório', 
              onPress: () => {
                Alert.alert('Dica', 'Vá em Ajustes > Relatórios para gerar seu PDF detalhado.');
              } 
            },
            {
              text: 'Limpar Gastos Variáveis',
              style: 'destructive',
              onPress: () => {
                Alert.alert(
                  'Confirmar Limpeza',
                  'Isso apagará todos os gastos que NÃO são fixos/recorrentes. Deseja continuar?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { 
                      text: 'Sim, Limpar', 
                      style: 'destructive',
                      onPress: resetMonthlyExpenses
                    }
                  ]
                );
              }
            }
          ]
        );
        await AsyncStorage.setItem('@eco_gastos_payday_alert', currentMonthKey);
      }
    }
  };

  const resetMonthlyExpenses = async () => {
    const expensesToKeep = expenses.filter(e => e.isRecurring);
    
    // We do NOT refund the balance. The money spent is gone.
    // We keep the current balance as the "Carry Over" for the next month.
    
    let newBalance = balance;
    const newIncomes = [];

    // Auto-add Salary if defined
    if (userProfile.salaryAmount && userProfile.salaryAmount > 0) {
      const salaryIncome = {
        id: Date.now().toString(),
        amount: userProfile.salaryAmount,
        description: 'Salário',
        date: new Date().toISOString(),
      };
      newIncomes.push(salaryIncome);
      newBalance += userProfile.salaryAmount;
      Alert.alert('💰 Salário Adicionado!', `Seu salário de R$ ${userProfile.salaryAmount.toFixed(2)} foi creditado.`);
    }

    setExpenses(expensesToKeep);
    setIncomes(newIncomes); 
    setBalance(newBalance);
    
    try {
      await syncToBackend({ 
        expenses: expensesToKeep,
        incomes: newIncomes,
        balance: newBalance
      });
      Alert.alert('Sucesso', 'Mês reiniciado! Seu saldo atual foi mantido como ponto de partida.');
    } catch (e) {
      console.error('Failed to reset expenses', e);
      Alert.alert('Erro', 'Falha ao limpar dados.');
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await financeAPI.getFinanceData();
      if (response.success) {
        const data = response.data;
        setBalance(data.balance);
        setExpenses(data.expenses);
        setIncomes(data.incomes);
        
        // Check for monthly reset of recurring bills
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const updatedBills = data.recurringBills.map((bill: RecurringBill) => {
          if (bill.isPaid && bill.lastPaidDate) {
            const lastPaidDate = new Date(bill.lastPaidDate);
            // If paid in a previous month (or year), reset it
            if (lastPaidDate.getMonth() !== currentMonth || lastPaidDate.getFullYear() !== currentYear) {
              return { 
                ...bill, 
                isPaid: false, 
                lastPaymentExpenseId: undefined // Clear the link to the old expense
              };
            }
          }
          return bill;
        });

        setRecurringBills(updatedBills);
        
        // Monthly reset for recurring incomes (similar to bills)
        const updatedIncomes = (data.recurringIncomes || []).map((income: RecurringIncome) => {
          if (income.isReceived && income.lastReceivedDate) {
            const lastReceivedDate = new Date(income.lastReceivedDate);
            // If received in a previous month (or year), reset it
            if (lastReceivedDate.getMonth() !== currentMonth || lastReceivedDate.getFullYear() !== currentYear) {
              return { 
                ...income, 
                isReceived: false, 
                lastIncomeId: undefined 
              };
            }
          }
          return income;
        });

        setRecurringIncomes(updatedIncomes);
        
        // If any bills or incomes were updated, sync back to backend
        const hasUpdates = JSON.stringify(updatedBills) !== JSON.stringify(data.recurringBills) || 
                          JSON.stringify(updatedIncomes) !== JSON.stringify(data.recurringIncomes || []);
        if (hasUpdates) {
          syncToBackend({ recurringBills: updatedBills, recurringIncomes: updatedIncomes });
        }
        
        // Merge default categories with custom ones
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories);
        } else {
          setCategories(DEFAULT_CATEGORIES);
        }
      }
    } catch (e) {
      console.error('Failed to load data from API', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync entire state to backend (helper)
  const syncToBackend = async (newData: Partial<FinanceState>) => {
    try {
      await financeAPI.updateFinanceData(newData);
    } catch (e) {
      console.error('Failed to sync data', e);
    }
  };

  const addExpense = async (expenseData: Omit<Expense, 'id'>) => {
    const newExpense = { ...expenseData, id: Date.now().toString() };
    
    // Optimistic update
    setExpenses(prev => [newExpense, ...prev]);
    setBalance(prev => prev - newExpense.amount);
    
    // API Call
    try {
      await financeAPI.addExpense(newExpense);
      // Also update balance on backend
      await syncToBackend({ balance: balance - newExpense.amount });
    } catch (e) {
      console.error('Failed to add expense', e);
      // Revert on failure (optional, but good practice)
    }
    
    return newExpense.id;
  };

  const updateExpense = async (updatedExpense: Expense) => {
    let balanceDiff = 0;
    
    setExpenses(prev => {
      const oldExpense = prev.find(e => e.id === updatedExpense.id);
      if (oldExpense) {
        balanceDiff = oldExpense.amount - updatedExpense.amount;
        return prev.map(e => e.id === updatedExpense.id ? updatedExpense : e);
      }
      return prev;
    });

    if (balanceDiff !== 0) {
      setBalance(prev => prev + balanceDiff);
    }

    try {
      // We don't have a specific update endpoint for single expense yet, so sync all
      // Or create one. For now, let's sync all expenses list + balance
      // Ideally backend should have update endpoint
      await syncToBackend({ 
        expenses: expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e),
        balance: balance + balanceDiff
      });
    } catch (e) {
      console.error('Failed to update expense', e);
    }
  };

  const deleteExpense = async (id: string) => {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;

    // Optimistic update
    setExpenses(prev => prev.filter(e => e.id !== id));
    setBalance(prev => prev + expense.amount);

    try {
      await financeAPI.deleteExpense(id);
      await syncToBackend({ balance: balance + expense.amount });
    } catch (e) {
      console.error('Failed to delete expense', e);
    }
  };

  const addIncome = async (incomeData: Omit<Income, 'id'>) => {
    const newIncome = { ...incomeData, id: Date.now().toString() };
    
    setIncomes(prev => [newIncome, ...prev]);
    setBalance(prev => prev + newIncome.amount);

    try {
      await financeAPI.addIncome(newIncome);
      await syncToBackend({ balance: balance + newIncome.amount });
    } catch (e) {
      console.error('Failed to add income', e);
    }
  };

  const deleteIncome = async (id: string) => {
    const income = incomes.find(i => i.id === id);
    if (!income) return;

    setIncomes(prev => prev.filter(i => i.id !== id));
    setBalance(prev => prev - income.amount);

    try {
      await financeAPI.deleteIncome(id);
      await syncToBackend({ balance: balance - income.amount });
    } catch (e) {
      console.error('Failed to delete income', e);
    }
  };

  const editIncome = async (updatedIncome: Income) => {
    // Calculate difference to update balance
    const oldIncome = incomes.find(i => i.id === updatedIncome.id);
    if (!oldIncome) return;

    const difference = updatedIncome.amount - oldIncome.amount;

    setIncomes(prev => prev.map(i => i.id === updatedIncome.id ? updatedIncome : i));
    setBalance(prev => prev + difference);

    try {
      await syncToBackend({ 
        incomes: incomes.map(i => i.id === updatedIncome.id ? updatedIncome : i),
        balance: balance + difference
      });
    } catch (e) {
      console.error('Failed to edit income', e);
      // Revert on failure (optional but good practice)
    }
  };

  const addCategory = async (categoryData: Omit<Category, 'id'>) => {
    const newCategory = { ...categoryData, id: Date.now().toString() };
    setCategories(prev => [...prev, newCategory]);

    try {
      await syncToBackend({ categories: [...categories, newCategory] });
    } catch (e) {
      console.error('Failed to add category', e);
    }
  };

  const updateCategory = async (updatedCategory: Category) => {
    setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));

    try {
      await syncToBackend({ 
        categories: categories.map(c => c.id === updatedCategory.id ? updatedCategory : c) 
      });
    } catch (e) {
      console.error('Failed to update category', e);
    }
  };

  const deleteCategory = async (id: string) => {
    // Prevent deleting default categories if needed, but UI handles that via isCustom check
    setCategories(prev => prev.filter(c => c.id !== id));

    try {
      await syncToBackend({ 
        categories: categories.filter(c => c.id !== id) 
      });
    } catch (e) {
      console.error('Failed to delete category', e);
    }
  };

  const addRecurringBill = async (billData: Omit<RecurringBill, 'id'>) => {
    const newBill = { ...billData, id: Date.now().toString() };
    setRecurringBills(prev => [...prev, newBill]);
    
    if (settings.notificationsEnabled && !newBill.isPaid) {
      scheduleBillNotification(newBill);
    }

    try {
      await syncToBackend({ recurringBills: [...recurringBills, newBill] });
    } catch (e) {
      console.error('Failed to add recurring bill', e);
    }
  };

  const updateRecurringBill = async (updatedBill: RecurringBill) => {
    setRecurringBills(prev => prev.map(b => b.id === updatedBill.id ? updatedBill : b));
    
    if (settings.notificationsEnabled && !updatedBill.isPaid) {
      scheduleBillNotification(updatedBill);
    } else {
      cancelBillNotification(updatedBill.id);
    }

    try {
      await syncToBackend({ 
        recurringBills: recurringBills.map(b => b.id === updatedBill.id ? updatedBill : b) 
      });
    } catch (e) {
      console.error('Failed to update recurring bill', e);
    }
  };

  const deleteRecurringBill = async (id: string) => {
    const bill = recurringBills.find(b => b.id === id);
    if (bill && bill.lastPaymentExpenseId) {
      await deleteExpense(bill.lastPaymentExpenseId);
    }
    
    setRecurringBills(prev => prev.filter(b => b.id !== id));
    cancelBillNotification(id);

    try {
      // We can use syncToBackend for now as we didn't make specific delete endpoint for bills yet
      // Or we can add it to API. Let's use sync for simplicity as per plan
      await syncToBackend({ 
        recurringBills: recurringBills.filter(b => b.id !== id) 
      });
    } catch (e) {
      console.error('Failed to delete recurring bill', e);
    }
  };

  const updateBalance = (amount: number) => {
    setBalance(amount);
    syncToBackend({ balance: amount });
  };

  const markBillAsPaid = async (id: string) => {
    const bill = recurringBills.find(b => b.id === id);
    if (bill && !bill.isPaid) {
      // 1. Create Expense
      const expenseId = await addExpense({
        amount: bill.amount,
        description: `Conta: ${bill.name}`,
        categoryId: bill.categoryId,
        date: new Date().toISOString(),
        isRecurring: true, // Mark as recurring so it persists during reset
      });

      // 2. Update Bill
      const updatedBill = { 
        ...bill, 
        isPaid: true, 
        lastPaidDate: new Date().toISOString(),
        lastPaymentExpenseId: expenseId
      };

      setRecurringBills(prev => prev.map(b => b.id === id ? updatedBill : b));
      
      await syncToBackend({
        recurringBills: recurringBills.map(b => b.id === id ? updatedBill : b)
      });
    }
  };

  const markBillAsUnpaid = async (id: string) => {
    const bill = recurringBills.find(b => b.id === id);
    if (bill && bill.isPaid) {
      // 1. Remove Expense
      if (bill.lastPaymentExpenseId) {
        await deleteExpense(bill.lastPaymentExpenseId);
      }

      // 2. Update Bill
      const { lastPaymentExpenseId, ...rest } = bill;
      const updatedBill = { ...rest, isPaid: false };

      setRecurringBills(prev => prev.map(b => b.id === id ? updatedBill : b));

      await syncToBackend({
        recurringBills: recurringBills.map(b => b.id === id ? updatedBill : b)
      });
    }
  };

  const updateUserProfile = async (profile: UserProfile) => {
    setUserProfile(profile);
    try {
      await authAPI.updateProfile({ 
        name: profile.name, 
        profile: { 
          savingsGoal: profile.savingsGoal,
          salaryDay: profile.salaryDay,
          salaryAmount: profile.salaryAmount
        } 
      });
    } catch (e) {
      console.error('Failed to update profile', e);
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    if ('notificationsEnabled' in newSettings) {
      if (newSettings.notificationsEnabled) {
        registerForPushNotificationsAsync().then(granted => {
          if (granted) {
            scheduleAllBillNotifications(recurringBills);
          }
        });
      } else {
        cancelAllNotifications();
      }
    }

    try {
      await authAPI.updateProfile({ settings: { ...settings, ...newSettings } });
    } catch (e) {
      console.error('Failed to update settings', e);
    }
  };

  const clearData = async () => {
    try {
      await financeAPI.clearData();
      await AsyncStorage.clear();
      
      // Reset local state
      setBalance(0);
      setExpenses([]);
      setIncomes([]);
      setCategories(DEFAULT_CATEGORIES);
      setRecurringBills([]);
      
      Alert.alert('Sucesso', 'Todos os dados foram apagados.');
    } catch (e) {
      console.error('Failed to clear data', e);
      Alert.alert('Erro', 'Falha ao limpar dados no servidor.');
    }
  };

  // ===== RECURRING INCOME FUNCTIONS =====
  const addRecurringIncome = async (income: RecurringIncome) => {
    setRecurringIncomes(prev => [...prev, income]);
    try {
      await financeAPI.addRecurringIncome(income);
    } catch (e) {
      console.error('Failed to add recurring income', e);
    }
  };

  const updateRecurringIncome = async (updatedIncome: RecurringIncome) => {
    setRecurringIncomes(prev => prev.map(i => i.id === updatedIncome.id ? updatedIncome : i));
    try {
      await financeAPI.updateRecurringIncome(updatedIncome);
    } catch (e) {
      console.error('Failed to update recurring income', e);
    }
  };

  const deleteRecurringIncome = async (id: string) => {
    setRecurringIncomes(prev => prev.filter(i => i.id !== id));
    try {
      await financeAPI.deleteRecurringIncome(id);
    } catch (e) {
      console.error('Failed to delete recurring income', e);
    }
  };

  const markIncomeAsReceived = async (id: string) => {
    const recurringIncome = recurringIncomes.find(i => i.id === id);
    if (!recurringIncome) return;

    const incomeEntry: Income = {
      id: Date.now().toString(),
      amount: recurringIncome.amount,
      description: recurringIncome.name,
      date: new Date().toISOString(),
    };

    setIncomes(prev => [incomeEntry, ...prev]);
    setBalance(prev => prev + incomeEntry.amount);
    setRecurringIncomes(prev => prev.map(i => {
      if (i.id === id) {
        return { ...i, isReceived: true, lastReceivedDate: incomeEntry.date, lastIncomeId: incomeEntry.id };
      }
      return i;
    }));

    try {
      await financeAPI.markIncomeAsReceived(id, incomeEntry);
    } catch (e) {
      console.error('Failed to mark income as received', e);
    }
  };

  const markIncomeAsUnaccounted = async (id: string) => {
    const recurringIncome = recurringIncomes.find(i => i.id === id);
    if (!recurringIncome || !recurringIncome.lastIncomeId) return;

    setIncomes(prev => prev.filter(i => i.id !== recurringIncome.lastIncomeId));
    const incomeToRemove = incomes.find(i => i.id === recurringIncome.lastIncomeId);
    if (incomeToRemove) {
      setBalance(prev => prev - incomeToRemove.amount);
    }
    setRecurringIncomes(prev => prev.map(i => {
      if (i.id === id) {
        return { ...i, isReceived: false, lastReceivedDate: undefined, lastIncomeId: undefined };
      }
      return i;
    }));

    try {
      await financeAPI.markIncomeAsPending(id);
    } catch (e) {
      console.error('Failed to mark income as pending', e);
    }
  };

  return (
    <FinanceContext.Provider value={{
      balance,
      expenses,
      incomes,
      categories,
      recurringBills,
      userProfile,
      settings,
      addExpense,
      updateExpense,
      deleteExpense,
      addIncome,
      deleteIncome,
      editIncome,
      addCategory,
      updateCategory,
      deleteCategory,
      addRecurringBill,
      updateRecurringBill,
      deleteRecurringBill,
      updateBalance,
      markBillAsPaid,
      markBillAsUnpaid,
      updateUserProfile,
      updateSettings,
      isLoading,
      theme: settings.isDarkMode ? THEME.dark : THEME.light,
      isValuesVisible,
      toggleValuesVisibility,
      clearData,
      selectedDate,
      changeMonth,
      recurringIncomes,
      addRecurringIncome,
      updateRecurringIncome,
      deleteRecurringIncome,
      markIncomeAsReceived,
      markIncomeAsUnaccounted,
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => useContext(FinanceContext);
