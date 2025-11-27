import React, { createContext, useState, useContext, useEffect } from 'react';
import { FinanceState, Expense, Category, RecurringBill, Income, UserProfile, AppSettings } from '../types';
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
}

const FinanceContext = createContext<FinanceContextData>({} as FinanceContextData);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuth();
  const [balance, setBalance] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: 'Usuário', email: 'usuario@exemplo.com', savingsGoal: 0 });
  const [settings, setSettings] = useState<AppSettings>({ isDarkMode: true, notificationsEnabled: true, biometricsEnabled: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isValuesVisible, setIsValuesVisible] = useState(false);

  const toggleValuesVisibility = () => {
    setIsValuesVisible(prev => !prev);
  };

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    } else {
      // Reset state on logout
      setBalance(0);
      setExpenses([]);
      setIncomes([]);
      setCategories(DEFAULT_CATEGORIES);
      setRecurringBills([]);
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Update user profile when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setUserProfile({
        name: currentUser.name,
        email: currentUser.email,
        savingsGoal: currentUser.profile?.savingsGoal || 0,
      });
      if (currentUser.settings) {
        setSettings(prev => ({ ...prev, ...currentUser.settings }));
      }
    }
  }, [currentUser]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await financeAPI.getFinanceData();
      if (response.success) {
        const data = response.data;
        setBalance(data.balance);
        setExpenses(data.expenses);
        setIncomes(data.incomes);
        setRecurringBills(data.recurringBills);
        
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
        profile: { savingsGoal: profile.savingsGoal } 
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
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => useContext(FinanceContext);
