const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const auth = require('../middleware/auth');
const FinanceData = require('../models/FinanceData');
const User = require('../models/User');

// System prompt for the AI assistant
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

Você tem acesso aos dados financeiros do usuário que serão fornecidos no contexto.`;

// @route   POST /api/ai/chat
// @desc    Chat with AI assistant
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
    const financeData = await FinanceData.findOne({ userId: req.userId });

    if (!financeData) {
      return res.status(404).json({
        success: false,
        message: 'Dados financeiros não encontrados',
      });
    }

    // 2. Build financial context
    const context = buildFinancialContext(user, financeData);

    // 3. Call Gemini API
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${SYSTEM_PROMPT}\n\n${context}\n\n---\nPergunta do usuário: ${message}`,
    });

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

  // Pending bills
  const pendingBills = financeData.recurringBills.filter(b => !b.isPaid);
  const pendingBillsTotal = pendingBills.reduce((sum, b) => sum + (b.amount || 0), 0);

  // Pending incomes
  const pendingIncomes = financeData.recurringIncomes?.filter(i => !i.isReceived) || [];
  const pendingIncomesTotal = pendingIncomes.reduce((sum, i) => sum + (i.amount || 0), 0);

  // Build context string
  const context = `
## Contexto Financeiro do Usuário

**Nome do usuário:** ${user?.name || 'Usuário'}
**Data de hoje:** ${now.toLocaleDateString('pt-BR')}

### Resumo Atual
- **Saldo atual:** R$ ${financeData.balance.toFixed(2).replace('.', ',')}
- **Meta de economia:** R$ ${user?.profile?.savingsGoal?.toFixed(2).replace('.', ',') || '0,00'}

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

### Contas Fixas Pendentes
${pendingBills.length > 0 
  ? pendingBills.map(b => `- ${b.name}: R$ ${b.amount.toFixed(2).replace('.', ',')} (vence dia ${b.dueDay})`).join('\n')
  : '- Todas as contas estão pagas! ✅'}
- **Total pendente:** R$ ${pendingBillsTotal.toFixed(2).replace('.', ',')}

### Receitas Fixas Pendentes
${pendingIncomes.length > 0
  ? pendingIncomes.map(i => `- ${i.name}: R$ ${i.amount.toFixed(2).replace('.', ',')} (dia ${i.paymentDay})`).join('\n')
  : '- Todas as receitas foram recebidas! ✅'}
- **Total a receber:** R$ ${pendingIncomesTotal.toFixed(2).replace('.', ',')}

### Últimos 5 Gastos
${currentMonthExpenses.slice(0, 5).map(e => {
  const category = financeData.categories.find(c => c.id === e.categoryId);
  return `- ${e.description || 'Sem descrição'} (${category?.name || 'Outros'}): R$ ${e.amount.toFixed(2).replace('.', ',')}`;
}).join('\n') || '- Nenhum gasto recente'}
`;

  return context;
}

module.exports = router;
