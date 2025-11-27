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
}

export interface Income {
  id: string;
  amount: number;
  description: string;
  date: string;
}

export interface UserProfile {
  name: string;
  email: string;
  savingsGoal?: number;
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
  userProfile: UserProfile;
  settings: AppSettings;
}
