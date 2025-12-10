import { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { subMonths, format, startOfMonth, endOfMonth, isSameMonth, isSameYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface MonthlyData {
  month: number;
  year: number;
  label: string;
  total: number;
  percentChange: number | null; // null for first month (no comparison)
}

export const useMonthlyComparison = (monthsToShow: number = 6) => {
  const { expenses, selectedDate } = useFinance();

  const monthlyData = useMemo(() => {
    const data: MonthlyData[] = [];
    
    // Generate last N months based on selectedDate
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const targetDate = subMonths(selectedDate, i);
      const monthStart = startOfMonth(targetDate);
      const monthEnd = endOfMonth(targetDate);
      
      // Sum expenses for this month
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= monthStart && expenseDate <= monthEnd;
      });
      
      const total = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      data.push({
        month: targetDate.getMonth(),
        year: targetDate.getFullYear(),
        label: format(targetDate, 'MMM', { locale: ptBR }).replace('.', ''),
        total,
        percentChange: null, // Will be calculated after
      });
    }
    
    // Calculate percent changes
    for (let i = 1; i < data.length; i++) {
      const previous = data[i - 1].total;
      const current = data[i].total;
      
      if (previous > 0) {
        data[i].percentChange = ((current - previous) / previous) * 100;
      } else if (current > 0) {
        data[i].percentChange = 100; // Infinite increase from 0
      } else {
        data[i].percentChange = 0; // Both are 0
      }
    }
    
    return data;
  }, [expenses, selectedDate, monthsToShow]);

  const currentMonthTotal = monthlyData[monthlyData.length - 1]?.total || 0;
  const previousMonthTotal = monthlyData[monthlyData.length - 2]?.total || 0;
  const currentMonthChange = monthlyData[monthlyData.length - 1]?.percentChange;
  
  const maxTotal = Math.max(...monthlyData.map(m => m.total), 1); // Avoid division by 0
  const averageTotal = monthlyData.reduce((sum, m) => sum + m.total, 0) / monthlyData.length;

  return {
    monthlyData,
    currentMonthTotal,
    previousMonthTotal,
    currentMonthChange,
    maxTotal,
    averageTotal,
  };
};
