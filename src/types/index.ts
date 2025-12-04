export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string; // Icon name from Ionicons
  isCustom: boolean;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  date: string; // ISO string
  isRecurring?: boolean; // To distinguish from variable expenses
}

export interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  categoryId: string;
  isPaid: boolean;
  lastPaidDate?: string; // To track monthly payments
  lastPaymentExpenseId?: string; // To track the expense created for this payment
  originalAmount?: number; // Original amount before partial payments
  partialPayments?: { amount: number; date: string; expenseId: string }[]; // Track partial payments
}

export interface Income {
  id: string;
  amount: number;
  description: string;
  date: string;
}

export interface RecurringIncome {
  id: string;
  name: string;
  amount: number;
  paymentDay: number; // 1-31
  isReceived: boolean;
  description?: string;
  lastReceivedDate?: string;
  lastIncomeId?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  savingsGoal?: number;
  salaryDay?: number | null; // 1-31
  salaryAmount?: number | null; // Fixed salary amount for auto-add
}

export interface AppSettings {
  isDarkMode: boolean;
  notificationsEnabled: boolean;
  biometricsEnabled: boolean;
}

export interface FinanceState {
  balance: number;
  expenses: Expense[];
  incomes: Income[];
  categories: Category[];
  recurringBills: RecurringBill[];
  recurringIncomes: RecurringIncome[];
  userProfile: UserProfile;
  settings: AppSettings;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Optional as we might not store it in frontend state
  profile?: {
    savingsGoal: number;
    salaryDay?: number;
    salaryAmount?: number;
  };
  settings?: AppSettings;
}

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  isLoading: boolean;
}
