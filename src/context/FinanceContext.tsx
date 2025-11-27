import React, { createContext, useState, useContext, useEffect } from 'react';
import { FinanceState, Expense, Category, RecurringBill, Income, UserProfile, AppSettings } from '../types';
import { DEFAULT_CATEGORIES, THEME } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync, scheduleBillNotification, cancelBillNotification, cancelAllNotifications, scheduleAllBillNotifications } from '../utils/notifications';

interface FinanceContextData {
  balance: number;
  expenses: Expense[];
  incomes: Income[];
  categories: Category[];
  recurringBills: RecurringBill[];
  userProfile: UserProfile;
  settings: AppSettings;
  addExpense: (expense: Omit<Expense, 'id'>) => string;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  addIncome: (income: Omit<Income, 'id'>) => void;
  deleteIncome: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  addRecurringBill: (bill: Omit<RecurringBill, 'id'>) => void;
  updateRecurringBill: (bill: RecurringBill) => void;
  deleteRecurringBill: (id: string) => void;
  updateBalance: (amount: number) => void;
  markBillAsPaid: (id: string) => void;
  markBillAsUnpaid: (id: string) => void;
  updateUserProfile: (profile: UserProfile) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  isLoading: boolean;
  theme: typeof THEME.light;
  isValuesVisible: boolean;
  toggleValuesVisibility: () => void;
}

const FinanceContext = createContext<FinanceContextData>({} as FinanceContextData);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [balance, setBalance] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: 'Usuário', email: 'usuario@exemplo.com', savingsGoal: 0 });
  const [settings, setSettings] = useState<AppSettings>({ isDarkMode: true, notificationsEnabled: true, biometricsEnabled: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isValuesVisible, setIsValuesVisible] = useState(false); // Hidden by default

  const toggleValuesVisibility = () => {
    setIsValuesVisible(prev => !prev);
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    if (!isLoading) {
      saveData();
    }
  }, [balance, expenses, incomes, categories, recurringBills, userProfile, settings]);

  const loadData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('@eco_gastos_data');
      if (storedData) {
        const parsedData: FinanceState = JSON.parse(storedData);
        setBalance(parsedData.balance);
        setExpenses(parsedData.expenses);
        setIncomes(parsedData.incomes || []);
        
        // Update default categories with new icons/colors if they exist in storage
        const loadedCategories = parsedData.categories.map(cat => {
          const defaultCat = DEFAULT_CATEGORIES.find(dc => dc.id === cat.id);
          if (defaultCat) {
            return { ...cat, ...defaultCat };
          }
          return cat;
        });
        setCategories(loadedCategories);
        
        // Check for recurring bills reset
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const updatedBills = parsedData.recurringBills.map(bill => {
          if (bill.lastPaidDate) {
            const lastPaid = new Date(bill.lastPaidDate);
            if (lastPaid.getMonth() !== currentMonth || lastPaid.getFullYear() !== currentYear) {
              return { ...bill, isPaid: false };
            }
          }
          return bill;
        });
        setRecurringBills(updatedBills);
        if (parsedData.userProfile) {
          setUserProfile({
            ...parsedData.userProfile,
            savingsGoal: parsedData.userProfile.savingsGoal || 0
          });
        }
        if (parsedData.settings) setSettings(parsedData.settings);
      }
    } catch (e) {
      console.error('Failed to load data', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Request notification permissions and schedule notifications on mount
  useEffect(() => {
    if (!isLoading && settings.notificationsEnabled) {
      registerForPushNotificationsAsync().then(granted => {
        if (granted) {
          scheduleAllBillNotifications(recurringBills);
        }
      });
    }
  }, [isLoading]);

  const saveData = async () => {
    try {
      const data: FinanceState = { balance, expenses, incomes, categories, recurringBills, userProfile, settings };
      await AsyncStorage.setItem('@eco_gastos_data', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save data', e);
    }
  };

  const addExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newExpense = { ...expenseData, id: Date.now().toString() };
    setExpenses(prev => [newExpense, ...prev]);
    setBalance(prev => prev - newExpense.amount);
    return newExpense.id;
  };

  const updateExpense = (updatedExpense: Expense) => {
    setExpenses(prev => {
      const oldExpense = prev.find(e => e.id === updatedExpense.id);
      if (oldExpense) {
        // Calculate balance difference: (Old Amount - New Amount)
        // If new amount is higher, balance decreases (diff is negative)
        // If new amount is lower, balance increases (diff is positive)
        const diff = oldExpense.amount - updatedExpense.amount;
        setBalance(current => current + diff);
        
        return prev.map(e => e.id === updatedExpense.id ? updatedExpense : e);
      }
      return prev;
    });
  };

  const deleteExpense = (id: string) => {
    const expense = expenses.find(e => e.id === id);
    if (expense) {
      setExpenses(prev => prev.filter(e => e.id !== id));
      setBalance(prev => prev + expense.amount);
    }
  };

  const addIncome = (incomeData: Omit<Income, 'id'>) => {
    const newIncome = { ...incomeData, id: Date.now().toString() };
    setIncomes(prev => [newIncome, ...prev]);
    setBalance(prev => prev + newIncome.amount);
  };

  const deleteIncome = (id: string) => {
    const income = incomes.find(i => i.id === id);
    if (income) {
      setIncomes(prev => prev.filter(i => i.id !== id));
      setBalance(prev => prev - income.amount);
    }
  };

  const addCategory = (categoryData: Omit<Category, 'id'>) => {
    const newCategory = { ...categoryData, id: Date.now().toString() };
    setCategories(prev => [...prev, newCategory]);
  };

  const addRecurringBill = (billData: Omit<RecurringBill, 'id'>) => {
    const newBill = { ...billData, id: Date.now().toString() };
    setRecurringBills(prev => [...prev, newBill]);
    
    // Schedule notification if enabled
    if (settings.notificationsEnabled && !newBill.isPaid) {
      scheduleBillNotification(newBill);
    }
  };

  const updateRecurringBill = (updatedBill: RecurringBill) => {
    setRecurringBills(prev => prev.map(b => b.id === updatedBill.id ? updatedBill : b));
    
    // Reschedule notification if enabled
    if (settings.notificationsEnabled && !updatedBill.isPaid) {
      scheduleBillNotification(updatedBill);
    } else {
      cancelBillNotification(updatedBill.id);
    }
  };

  const deleteRecurringBill = (id: string) => {
    const bill = recurringBills.find(b => b.id === id);
    if (bill && bill.lastPaymentExpenseId) {
      deleteExpense(bill.lastPaymentExpenseId);
    }
    setRecurringBills(prev => prev.filter(b => b.id !== id));
    
    // Cancel notification
    cancelBillNotification(id);
  };

  const updateBalance = (amount: number) => {
    setBalance(amount);
  };

  const markBillAsPaid = (id: string) => {
    const bill = recurringBills.find(b => b.id === id);
    if (bill && !bill.isPaid) {
      // 1. Create Expense
      const expenseId = addExpense({
        amount: bill.amount,
        description: `Conta: ${bill.name}`,
        categoryId: bill.categoryId,
        date: new Date().toISOString(),
      });

      // 2. Update Bill
      setRecurringBills(prev => prev.map(b => {
        if (b.id === id) {
          return { 
            ...b, 
            isPaid: true, 
            lastPaidDate: new Date().toISOString(),
            lastPaymentExpenseId: expenseId
          };
        }
        return b;
      }));
    }
  };

  const markBillAsUnpaid = (id: string) => {
    const bill = recurringBills.find(b => b.id === id);
    if (bill && bill.isPaid) {
      // 1. Remove Expense if it exists
      if (bill.lastPaymentExpenseId) {
        deleteExpense(bill.lastPaymentExpenseId);
      }

      // 2. Update Bill
      setRecurringBills(prev => prev.map(b => {
        if (b.id === id) {
          const { lastPaymentExpenseId, ...rest } = b;
          return { ...rest, isPaid: false };
        }
        return b;
      }));
    }
  };

  const updateUserProfile = (profile: UserProfile) => {
    setUserProfile(profile);
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const oldSettings = settings;
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    // Handle notification toggle
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
      addCategory,
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
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => useContext(FinanceContext);
