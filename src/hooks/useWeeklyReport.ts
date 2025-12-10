import { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { startOfWeek, endOfWeek, subWeeks, isWithinInterval, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  total: number;
  percentage: number;
}

export interface WeeklyReportData {
  currentWeekTotal: number;
  previousWeekTotal: number;
  percentChange: number | null;
  dailyAverage: number;
  topCategories: CategoryBreakdown[];
  weekStartDate: string;
  weekEndDate: string;
  totalTransactions: number;
}

export const useWeeklyReport = () => {
  const { expenses, categories, theme } = useFinance();

  const weeklyReport = useMemo((): WeeklyReportData => {
    const today = new Date();
    
    // Current week (Sunday to Saturday by default)
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 0 });
    const currentWeekEnd = endOfWeek(today, { weekStartsOn: 0 });
    
    // Previous week
    const previousWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 0 });
    const previousWeekEnd = endOfWeek(subWeeks(today, 1), { weekStartsOn: 0 });
    
    // Filter expenses for current week
    const currentWeekExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return isWithinInterval(expenseDate, { start: currentWeekStart, end: currentWeekEnd });
    });
    
    // Filter expenses for previous week
    const previousWeekExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return isWithinInterval(expenseDate, { start: previousWeekStart, end: previousWeekEnd });
    });
    
    const currentWeekTotal = currentWeekExpenses.reduce((sum, e) => sum + e.amount, 0);
    const previousWeekTotal = previousWeekExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Calculate percent change
    let percentChange: number | null = null;
    if (previousWeekTotal > 0) {
      percentChange = ((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100;
    } else if (currentWeekTotal > 0) {
      percentChange = 100;
    }
    
    // Calculate daily average (7 days)
    const dailyAverage = currentWeekTotal / 7;
    
    // Calculate category breakdown
    const categoryTotals: { [key: string]: number } = {};
    currentWeekExpenses.forEach(expense => {
      if (!categoryTotals[expense.categoryId]) {
        categoryTotals[expense.categoryId] = 0;
      }
      categoryTotals[expense.categoryId] += expense.amount;
    });
    
    const topCategories: CategoryBreakdown[] = Object.entries(categoryTotals)
      .map(([categoryId, total]) => {
        const category = categories.find(c => c.id === categoryId);
        return {
          categoryId,
          categoryName: category?.name || 'Outros',
          categoryColor: category?.color || theme.gray,
          total,
          percentage: currentWeekTotal > 0 ? (total / currentWeekTotal) * 100 : 0,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
    
    return {
      currentWeekTotal,
      previousWeekTotal,
      percentChange,
      dailyAverage,
      topCategories,
      weekStartDate: format(currentWeekStart, "dd 'de' MMM", { locale: ptBR }),
      weekEndDate: format(currentWeekEnd, "dd 'de' MMM", { locale: ptBR }),
      totalTransactions: currentWeekExpenses.length,
    };
  }, [expenses, categories, theme]);

  return weeklyReport;
};
