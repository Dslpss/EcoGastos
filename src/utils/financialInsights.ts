import { COLORS } from '../constants';

export type FinancialHealthStatus = 'excellent' | 'good' | 'warning' | 'danger';

export interface FinancialHealth {
  status: FinancialHealthStatus;
  message: string;
  color: string;
  icon: string;
}

export const getFinancialHealth = (
  income: number,
  expenses: number,
  savingsGoal: number
): FinancialHealth => {
  // Only show "add income" message if there are expenses but no income
  if (income === 0 && expenses > 0) {
    return {
      status: 'warning',
      message: 'Adicione sua renda para ver insights.',
      color: COLORS.warning,
      icon: 'alert-circle',
    };
  }

  // If both income and expenses are 0, show neutral message
  if (income === 0 && expenses === 0) {
    return {
      status: 'good',
      message: 'Sem movimentações neste mês.',
      color: '#95a5a6',
      icon: 'information-circle',
    };
  }

  const savings = income - expenses;
  const savingsRate = (savings / income) * 100;
  
  // Calculate available budget after setting aside the savings goal
  const availableBudget = Math.max(0, income - savingsGoal);
  const expenseRate = availableBudget > 0 ? (expenses / availableBudget) * 100 : 100;

  // Danger: Spending more than income (Debt)
  if (expenses > income) {
    return {
      status: 'danger',
      message: 'Crítico! Você está gastando mais do que ganha.',
      color: COLORS.danger,
      icon: 'warning',
    };
  }

  // Danger: Spending more than available budget (Eating into savings goal)
  if (savingsGoal > 0 && expenses > availableBudget) {
    return {
      status: 'danger',
      message: 'Atenção! Você já está usando o dinheiro da sua meta de economia.',
      color: COLORS.danger,
      icon: 'alert-circle',
    };
  }

  // Warning: Spending more than 80% of available budget
  if (expenseRate > 80) {
    return {
      status: 'warning',
      message: savingsGoal > 0 
        ? 'Cuidado! Você está perto de atingir o limite do seu orçamento (considerando sua meta).'
        : 'Atenção! Seus gastos estão consumindo quase toda sua renda.',
      color: COLORS.warning,
      icon: 'alert',
    };
  }

  // Excellent: Meeting savings goal OR saving > 20% (if no goal)
  if ((savingsGoal > 0 && savings >= savingsGoal) || (savingsGoal === 0 && savingsRate >= 20)) {
    return {
      status: 'excellent',
      message: 'Parabéns! Sua saúde financeira está excelente.',
      color: COLORS.success,
      icon: 'trending-up',
    };
  }

  // Good: Spending less than income
  return {
    status: 'good',
    message: 'Muito bem! Você está no azul, continue assim.',
    color: '#2ecc71',
    icon: 'thumbs-up',
  };
};
