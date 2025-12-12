const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const auth = require('../middleware/auth');
const FinanceData = require('../models/FinanceData');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

// System prompt for the AI assistant with action capabilities
const SYSTEM_PROMPT = `Você é o EcoBot, um assistente financeiro inteligente do app EcoGastos.

Seu objetivo é ajudar o usuário a entender e melhorar sua situação financeira.

Regras:
- Sempre responda em português do Brasil
- Seja amigável, objetivo e motivador
- Use emojis para tornar a conversa mais agradável
- Quando falar sobre valores, use o formato "R$ X.XXX,XX"
- Dê dicas práticas e personalizadas baseadas nos dados do usuário
- Se não souber algo, seja honesto e diga que não tem essa informação
- Nunca invente dados que não foram fornecidos no contexto
- Mantenha as respostas concisas (máximo 3 parágrafos)

IMPORTANTE - AÇÕES DISPONÍVEIS:
Você pode executar ações financeiras quando o usuário pedir. Use as funções disponíveis para:
- Adicionar gastos/despesas
- Marcar contas como pagas
- Adicionar receitas/entradas
- Marcar receitas como recebidas

Quando o usuário pedir para fazer uma ação, USE A FUNÇÃO APROPRIADA.
Se o usuário mencionar uma categoria que não existe exatamente, use a mais próxima disponível ou "Outros".

Você tem acesso aos dados financeiros do usuário que serão fornecidos no contexto.`;

// Define the tools/functions available to the AI
const tools = [
  {
    name: 'addExpense',
    description: 'Adiciona um novo gasto/despesa para o usuário. Use quando o usuário pedir para registrar um gasto.',
    parameters: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Valor do gasto em reais (apenas o número, ex: 50.00)',
        },
        description: {
          type: 'string',
          description: 'Descrição do gasto (ex: "Almoço", "Uber", "Mercado")',
        },
        categoryName: {
          type: 'string',
          description: 'Nome da categoria do gasto (ex: "Alimentação", "Transporte", "Lazer")',
        },
      },
      required: ['amount', 'categoryName'],
    },
  },
  {
    name: 'markBillAsPaid',
    description: 'Marca uma conta fixa/recorrente como paga. Use quando o usuário disser que pagou uma conta.',
    parameters: {
      type: 'object',
      properties: {
        billName: {
          type: 'string',
          description: 'Nome da conta a ser marcada como paga (ex: "Internet", "Luz", "Aluguel")',
        },
      },
      required: ['billName'],
    },
  },
  {
    name: 'addIncome',
    description: 'Adiciona uma nova receita/entrada de dinheiro. Use quando o usuário receber dinheiro.',
    parameters: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Valor da receita em reais',
        },
        description: {
          type: 'string',
          description: 'Descrição da receita (ex: "Salário", "Freelance", "Venda")',
        },
      },
      required: ['amount'],
    },
  },
  {
    name: 'markIncomeAsReceived',
    description: 'Marca uma receita fixa/recorrente como recebida. Use quando o usuário receber uma receita esperada.',
    parameters: {
      type: 'object',
      properties: {
        incomeName: {
          type: 'string',
          description: 'Nome da receita a ser marcada como recebida (ex: "Salário", "Aluguel")',
        },
      },
      required: ['incomeName'],
    },
  },
];

// Action handlers
async function handleAddExpense(params, financeData, userId) {
  const { amount, description, categoryName } = params;
  
  // Find or create category
  let category = financeData.categories.find(
    c => c.name.toLowerCase() === categoryName.toLowerCase()
  );
  
  if (!category) {
    // Try to find similar category
    category = financeData.categories.find(
      c => c.name.toLowerCase().includes(categoryName.toLowerCase()) ||
           categoryName.toLowerCase().includes(c.name.toLowerCase())
    );
  }
  
  if (!category) {
    // Use "Outros" or first available category
    category = financeData.categories.find(c => c.name === 'Outros') || 
               financeData.categories[0];
  }

  const newExpense = {
    id: uuidv4(),
    amount: parseFloat(amount),
    description: description || '',
    categoryId: category?.id || 'outros',
    date: new Date().toISOString(),
  };

  financeData.expenses.push(newExpense);
  financeData.balance -= parseFloat(amount);
  await financeData.save();

  return {
    success: true,
    message: `✅ Gasto de R$ ${parseFloat(amount).toFixed(2).replace('.', ',')} adicionado em "${category?.name || 'Outros'}"${description ? ` (${description})` : ''}!`,
    action: 'addExpense',
    data: newExpense,
  };
}

async function handleMarkBillAsPaid(params, financeData, userId) {
  const { billName } = params;
  
  // Find the bill
  const bill = financeData.recurringBills.find(
    b => b.name.toLowerCase().includes(billName.toLowerCase()) ||
         billName.toLowerCase().includes(b.name.toLowerCase())
  );

  if (!bill) {
    return {
      success: false,
      message: `❌ Não encontrei nenhuma conta com o nome "${billName}". Verifique o nome e tente novamente.`,
      action: 'markBillAsPaid',
    };
  }

  if (bill.isPaid) {
    return {
      success: true,
      message: `ℹ️ A conta "${bill.name}" já estava marcada como paga!`,
      action: 'markBillAsPaid',
    };
  }

  // Mark as paid
  bill.isPaid = true;
  bill.lastPaidDate = new Date().toISOString();
  
  // Deduct from balance
  financeData.balance -= bill.amount;
  
  // Add expense entry
  const expenseEntry = {
    id: uuidv4(),
    amount: bill.amount,
    description: `${bill.name} (Conta Fixa)`,
    categoryId: bill.categoryId,
    date: new Date().toISOString(),
  };
  financeData.expenses.push(expenseEntry);
  
  await financeData.save();

  return {
    success: true,
    message: `✅ Conta "${bill.name}" de R$ ${bill.amount.toFixed(2).replace('.', ',')} marcada como paga!`,
    action: 'markBillAsPaid',
    data: bill,
  };
}

async function handleAddIncome(params, financeData, userId) {
  const { amount, description } = params;

  const newIncome = {
    id: uuidv4(),
    amount: parseFloat(amount),
    description: description || 'Receita',
    date: new Date().toISOString(),
  };

  financeData.incomes.push(newIncome);
  financeData.balance += parseFloat(amount);
  await financeData.save();

  return {
    success: true,
    message: `✅ Receita de R$ ${parseFloat(amount).toFixed(2).replace('.', ',')}${description ? ` (${description})` : ''} adicionada! Seu saldo foi atualizado.`,
    action: 'addIncome',
    data: newIncome,
  };
}

async function handleMarkIncomeAsReceived(params, financeData, userId) {
  const { incomeName } = params;
  
  // Find the recurring income
  const income = financeData.recurringIncomes?.find(
    i => i.name.toLowerCase().includes(incomeName.toLowerCase()) ||
         incomeName.toLowerCase().includes(i.name.toLowerCase())
  );

  if (!income) {
    return {
      success: false,
      message: `❌ Não encontrei nenhuma receita recorrente com o nome "${incomeName}". Verifique o nome e tente novamente.`,
      action: 'markIncomeAsReceived',
    };
  }

  if (income.isReceived) {
    return {
      success: true,
      message: `ℹ️ A receita "${income.name}" já estava marcada como recebida!`,
      action: 'markIncomeAsReceived',
    };
  }

  // Mark as received
  income.isReceived = true;
  income.lastReceivedDate = new Date().toISOString();
  
  // Add to balance
  financeData.balance += income.amount;
  
  // Add income entry
  const incomeEntry = {
    id: uuidv4(),
    amount: income.amount,
    description: `${income.name} (Receita Recorrente)`,
    date: new Date().toISOString(),
  };
  financeData.incomes.push(incomeEntry);
  income.lastIncomeId = incomeEntry.id;
  
  await financeData.save();

  return {
    success: true,
    message: `✅ Receita "${income.name}" de R$ ${income.amount.toFixed(2).replace('.', ',')} marcada como recebida!`,
    action: 'markIncomeAsReceived',
    data: income,
  };
}

// Map action names to handlers
const actionHandlers = {
  addExpense: handleAddExpense,
  markBillAsPaid: handleMarkBillAsPaid,
  addIncome: handleAddIncome,
  markIncomeAsReceived: handleMarkIncomeAsReceived,
};

// @route   POST /api/ai/chat
// @desc    Chat with AI assistant (with action capabilities)
// @access  Private
router.post('/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Mensagem é obrigatória',
      });
    }

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Chave da API Gemini não configurada',
      });
    }

    // 1. Get user data
    const user = await User.findById(req.userId);
    let financeData = await FinanceData.findOne({ userId: req.userId });

    if (!financeData) {
      return res.status(404).json({
        success: false,
        message: 'Dados financeiros não encontrados',
      });
    }

    // 2. Build financial context
    const context = buildFinancialContext(user, financeData);

    // 3. Call Gemini API with function calling
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${SYSTEM_PROMPT}\n\n${context}\n\n---\nPergunta/Comando do usuário: ${message}`,
      config: {
        tools: [{ functionDeclarations: tools }],
      },
    });

    // Check if AI wants to call a function
    const functionCall = response.functionCalls?.[0];
    
    if (functionCall) {
      console.log('AI requested function call:', functionCall.name, functionCall.args);
      
      const handler = actionHandlers[functionCall.name];
      if (handler) {
        // Re-fetch financeData to ensure we have latest
        financeData = await FinanceData.findOne({ userId: req.userId });
        
        const actionResult = await handler(functionCall.args, financeData, req.userId);
        
        // Generate a friendly response after the action
        let finalResponse = actionResult.message;
        
        // If action was successful, add a tip
        if (actionResult.success && actionResult.action === 'addExpense') {
          const updatedData = await FinanceData.findOne({ userId: req.userId });
          finalResponse += `\n\n💰 Seu saldo atual: R$ ${updatedData.balance.toFixed(2).replace('.', ',')}`;
        }
        
        return res.json({
          success: true,
          data: {
            response: finalResponse,
            action: actionResult.action,
            actionSuccess: actionResult.success,
          },
        });
      }
    }

    // No function call - regular response
    const aiResponse = response.text || 'Desculpe, não consegui processar sua mensagem.';

    res.json({
      success: true,
      data: {
        response: aiResponse,
      },
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar mensagem. Tente novamente.',
    });
  }
});

/**
 * Build a comprehensive financial context for the AI
 */
function buildFinancialContext(user, financeData) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter expenses and incomes for current month
  const currentMonthExpenses = financeData.expenses.filter(e => {
    const date = new Date(e.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const currentMonthIncomes = financeData.incomes.filter(i => {
    const date = new Date(i.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  // Calculate totals
  const totalExpenses = currentMonthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalIncomes = currentMonthIncomes.reduce((sum, i) => sum + (i.amount || 0), 0);

  // Group expenses by category
  const expensesByCategory = {};
  currentMonthExpenses.forEach(expense => {
    const category = financeData.categories.find(c => c.id === expense.categoryId);
    const categoryName = category?.name || 'Outros';
    if (!expensesByCategory[categoryName]) {
      expensesByCategory[categoryName] = 0;
    }
    expensesByCategory[categoryName] += expense.amount || 0;
  });

  // Find the category with highest spending
  let highestCategory = { name: 'N/A', amount: 0 };
  Object.entries(expensesByCategory).forEach(([name, amount]) => {
    if (amount > highestCategory.amount) {
      highestCategory = { name, amount };
    }
  });

  // Pending bills (with names for action matching)
  const pendingBills = financeData.recurringBills.filter(b => !b.isPaid);
  const pendingBillsTotal = pendingBills.reduce((sum, b) => sum + (b.amount || 0), 0);
  const allBills = financeData.recurringBills || [];

  // Pending incomes (with names for action matching)
  const pendingIncomes = financeData.recurringIncomes?.filter(i => !i.isReceived) || [];
  const pendingIncomesTotal = pendingIncomes.reduce((sum, i) => sum + (i.amount || 0), 0);
  const allRecurringIncomes = financeData.recurringIncomes || [];

  // Available categories for expense matching
  const categoryNames = financeData.categories.map(c => c.name).join(', ');

  // ===== TREND ANALYSIS =====
  
  // Previous month data
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  
  const prevMonthExpenses = financeData.expenses.filter(e => {
    const date = new Date(e.date);
    return date.getMonth() === prevMonth && date.getFullYear() === prevYear;
  });
  const prevMonthTotal = prevMonthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  
  // Monthly comparison
  const monthlyChange = prevMonthTotal > 0 
    ? ((totalExpenses - prevMonthTotal) / prevMonthTotal * 100).toFixed(1)
    : null;
  const monthlyChangeText = monthlyChange !== null
    ? (parseFloat(monthlyChange) > 0 
        ? `📈 Aumento de ${monthlyChange}% em relação ao mês anterior`
        : parseFloat(monthlyChange) < 0 
          ? `📉 Redução de ${Math.abs(parseFloat(monthlyChange))}% em relação ao mês anterior`
          : '➡️ Mesmo nível do mês anterior')
    : 'Sem dados do mês anterior para comparação';
  
  // Daily average and projection
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const remainingDays = daysInMonth - dayOfMonth;
  
  const dailyAverage = dayOfMonth > 0 ? totalExpenses / dayOfMonth : 0;
  const projectedTotal = dailyAverage * daysInMonth;
  const projectedRemaining = dailyAverage * remainingDays;
  
  // Week over week (last 7 days vs previous 7 days)
  const today = now.getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  const last7DaysExpenses = financeData.expenses.filter(e => {
    const date = new Date(e.date).getTime();
    return date >= today - (7 * oneDay) && date <= today;
  }).reduce((sum, e) => sum + (e.amount || 0), 0);
  
  const prev7DaysExpenses = financeData.expenses.filter(e => {
    const date = new Date(e.date).getTime();
    return date >= today - (14 * oneDay) && date < today - (7 * oneDay);
  }).reduce((sum, e) => sum + (e.amount || 0), 0);
  
  const weeklyChange = prev7DaysExpenses > 0
    ? ((last7DaysExpenses - prev7DaysExpenses) / prev7DaysExpenses * 100).toFixed(1)
    : null;

  // ===== INTELLIGENT ALERTS =====
  const alerts = [];
  
  // Alert: Spending more than previous month
  if (monthlyChange !== null && parseFloat(monthlyChange) > 20) {
    alerts.push(`⚠️ ATENÇÃO: Você está gastando ${monthlyChange}% mais que no mês passado!`);
  } else if (monthlyChange !== null && parseFloat(monthlyChange) > 50) {
    alerts.push(`🚨 ALERTA CRÍTICO: Seus gastos estão ${monthlyChange}% acima do mês anterior!`);
  }
  
  // Alert: Week over week increase
  if (weeklyChange !== null && parseFloat(weeklyChange) > 30) {
    alerts.push(`📈 Esta semana você gastou ${weeklyChange}% mais que a semana passada.`);
  }
  
  // Alert: High spending categories (over 40% of total)
  Object.entries(expensesByCategory).forEach(([name, amount]) => {
    const percentage = totalExpenses > 0 ? (amount / totalExpenses * 100) : 0;
    if (percentage > 40) {
      alerts.push(`🎯 A categoria "${name}" representa ${percentage.toFixed(0)}% dos seus gastos este mês.`);
    }
  });
  
  // Alert: Balance getting low
  if (financeData.balance < 500 && financeData.balance >= 0) {
    alerts.push(`💰 Seu saldo está baixo (R$ ${financeData.balance.toFixed(2).replace('.', ',')}). Cuidado com os gastos!`);
  } else if (financeData.balance < 0) {
    alerts.push(`🚨 ATENÇÃO: Seu saldo está NEGATIVO em R$ ${Math.abs(financeData.balance).toFixed(2).replace('.', ',')}!`);
  }
  
  // Alert: Pending bills approaching
  const todayDay = now.getDate();
  const upcomingBills = pendingBills.filter(b => {
    const dueDay = b.dueDay;
    const daysUntilDue = dueDay >= todayDay ? dueDay - todayDay : (daysInMonth - todayDay) + dueDay;
    return daysUntilDue <= 5 && daysUntilDue > 0;
  });
  if (upcomingBills.length > 0) {
    const billsText = upcomingBills.map(b => `${b.name} (dia ${b.dueDay})`).join(', ');
    alerts.push(`📅 Contas próximas de vencer: ${billsText}`);
  }
  
  // Alert: Bills due today
  const billsDueToday = pendingBills.filter(b => b.dueDay === todayDay);
  if (billsDueToday.length > 0) {
    const billsText = billsDueToday.map(b => b.name).join(', ');
    alerts.push(`🔔 HOJE vencem: ${billsText}`);
  }
  
  // Alert: Projection exceeds income
  const totalRecurringIncome = (financeData.recurringIncomes || []).reduce((sum, i) => sum + (i.amount || 0), 0);
  if (totalRecurringIncome > 0 && projectedTotal > totalRecurringIncome) {
    const excess = projectedTotal - totalRecurringIncome;
    alerts.push(`⚠️ Se continuar assim, você gastará R$ ${excess.toFixed(2).replace('.', ',')} mais que sua renda mensal!`);
  }
  
  // Alert: Savings goal at risk
  const savingsGoal = user?.profile?.savingsGoal || 0;
  if (savingsGoal > 0 && totalRecurringIncome > 0) {
    const expectedSavings = totalRecurringIncome - projectedTotal;
    if (expectedSavings < savingsGoal) {
      alerts.push(`🎯 Você está abaixo da sua meta de economia de R$ ${savingsGoal.toFixed(2).replace('.', ',')}. Projeção atual: R$ ${Math.max(0, expectedSavings).toFixed(2).replace('.', ',')}`);
    }
  }

  // Build context string
  const context = `
## Contexto Financeiro do Usuário

**Nome do usuário:** ${user?.name || 'Usuário'}
**Data de hoje:** ${now.toLocaleDateString('pt-BR')}

### Resumo Atual
- **Saldo atual:** R$ ${financeData.balance.toFixed(2).replace('.', ',')}
- **Meta de economia:** R$ ${user?.profile?.savingsGoal?.toFixed(2).replace('.', ',') || '0,00'}

${alerts.length > 0 ? `### 🚨 ALERTAS IMPORTANTES
${alerts.join('\n')}
` : ''}
### Categorias Disponíveis
${categoryNames || 'Alimentação, Transporte, Lazer, Saúde, Outros'}

### Este Mês (${now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })})
- **Total de despesas:** R$ ${totalExpenses.toFixed(2).replace('.', ',')} (${currentMonthExpenses.length} gastos)
- **Total de receitas:** R$ ${totalIncomes.toFixed(2).replace('.', ',')} (${currentMonthIncomes.length} entradas)
- **Balanço do mês:** R$ ${(totalIncomes - totalExpenses).toFixed(2).replace('.', ',')}

### Gastos por Categoria
${Object.entries(expensesByCategory).map(([name, amount]) => 
  `- ${name}: R$ ${amount.toFixed(2).replace('.', ',')}`
).join('\n') || '- Nenhum gasto registrado'}

### Maior Gasto
- Categoria: ${highestCategory.name}
- Valor: R$ ${highestCategory.amount.toFixed(2).replace('.', ',')}

### 📊 Análise de Tendências
- **Mês anterior (${new Date(prevYear, prevMonth).toLocaleDateString('pt-BR', { month: 'long' })}):** R$ ${prevMonthTotal.toFixed(2).replace('.', ',')}
- **Comparação mensal:** ${monthlyChangeText}
- **Média diária de gastos:** R$ ${dailyAverage.toFixed(2).replace('.', ',')} por dia
- **Projeção até fim do mês:** R$ ${projectedTotal.toFixed(2).replace('.', ',')} (se mantiver o ritmo atual)
- **Dias restantes no mês:** ${remainingDays} dias
- **Previsão de gastos restantes:** R$ ${projectedRemaining.toFixed(2).replace('.', ',')}
${weeklyChange !== null 
  ? `- **Semana atual vs anterior:** ${parseFloat(weeklyChange) > 0 ? `+${weeklyChange}%` : `${weeklyChange}%`} (R$ ${last7DaysExpenses.toFixed(2).replace('.', ',')} vs R$ ${prev7DaysExpenses.toFixed(2).replace('.', ',')})`
  : '- **Semana atual:** R$ ' + last7DaysExpenses.toFixed(2).replace('.', ',') + ' (sem dados da semana anterior)'}

### Todas as Contas Fixas
${allBills.length > 0 
  ? allBills.map(b => `- ${b.name}: R$ ${b.amount.toFixed(2).replace('.', ',')} (dia ${b.dueDay}) - ${b.isPaid ? 'PAGA ✅' : 'PENDENTE ⏳'}`).join('\n')
  : '- Nenhuma conta cadastrada'}
- **Total pendente:** R$ ${pendingBillsTotal.toFixed(2).replace('.', ',')}

### Todas as Receitas Recorrentes
${allRecurringIncomes.length > 0
  ? allRecurringIncomes.map(i => `- ${i.name}: R$ ${i.amount.toFixed(2).replace('.', ',')} (dia ${i.paymentDay}) - ${i.isReceived ? 'RECEBIDA ✅' : 'PENDENTE ⏳'}`).join('\n')
  : '- Nenhuma receita recorrente cadastrada'}
- **Total a receber:** R$ ${pendingIncomesTotal.toFixed(2).replace('.', ',')}

### Gastos de Hoje (${now.toLocaleDateString('pt-BR')})
${currentMonthExpenses.filter(e => {
  const expenseDate = new Date(e.date);
  return expenseDate.toDateString() === now.toDateString();
}).map(e => {
  const category = financeData.categories.find(c => c.id === e.categoryId);
  return `- ${e.description || 'Sem descrição'} (${category?.name || 'Outros'}): R$ ${e.amount.toFixed(2).replace('.', ',')}`;
}).join('\n') || '- Nenhum gasto hoje'}

### Últimos 10 Gastos (com datas)
${currentMonthExpenses.slice(0, 10).map(e => {
  const category = financeData.categories.find(c => c.id === e.categoryId);
  const expenseDate = new Date(e.date);
  const dateStr = expenseDate.toLocaleDateString('pt-BR');
  return `- [${dateStr}] ${e.description || 'Sem descrição'} (${category?.name || 'Outros'}): R$ ${e.amount.toFixed(2).replace('.', ',')}`;
}).join('\n') || '- Nenhum gasto recente'}
`;

  return context;
}

module.exports = router;
