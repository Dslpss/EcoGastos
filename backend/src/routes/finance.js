const express = require('express');
const router = express.Router();
const FinanceData = require('../models/FinanceData');
const auth = require('../middleware/auth');

// @route   GET /api/finance
// @desc    Get user's finance data
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let financeData = await FinanceData.findOne({ userId: req.userId });

    // Create if doesn't exist
    if (!financeData) {
      financeData = new FinanceData({
        userId: req.userId,
        balance: 0,
        expenses: [],
        incomes: [],
        categories: [],
        recurringBills: [],
      });
      await financeData.save();
    }

    res.json({
      success: true,
      data: {
        balance: financeData.balance,
        expenses: financeData.expenses,
        incomes: financeData.incomes,
        categories: financeData.categories,
        recurringBills: financeData.recurringBills,
        recurringIncomes: financeData.recurringIncomes || [],
      },
    });
  } catch (error) {
    console.error('Get finance data error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar dados financeiros' 
    });
  }
});

// @route   PUT /api/finance
// @desc    Update entire finance data
// @access  Private
router.put('/', auth, async (req, res) => {
  try {
    const { balance, expenses, incomes, categories, recurringBills, recurringIncomes } = req.body;

    let financeData = await FinanceData.findOne({ userId: req.userId });

    if (!financeData) {
      financeData = new FinanceData({ userId: req.userId });
    }

    if (balance !== undefined) financeData.balance = balance;
    if (expenses) financeData.expenses = expenses;
    if (incomes) financeData.incomes = incomes;
    if (categories) financeData.categories = categories;
    if (recurringBills) financeData.recurringBills = recurringBills;
    if (recurringIncomes) financeData.recurringIncomes = recurringIncomes;

    await financeData.save();

    res.json({
      success: true,
      message: 'Dados atualizados com sucesso',
      data: {
        balance: financeData.balance,
        expenses: financeData.expenses,
        incomes: financeData.incomes,
        categories: financeData.categories,
        recurringBills: financeData.recurringBills,
        recurringIncomes: financeData.recurringIncomes,
      },
    });
  } catch (error) {
    console.error('Update finance data error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar dados' 
    });
  }
});

// @route   POST /api/finance/expense
// @desc    Add expense
// @access  Private
router.post('/expense', auth, async (req, res) => {
  try {
    const expense = req.body;

    const financeData = await FinanceData.findOne({ userId: req.userId });
    financeData.expenses.push(expense);
    await financeData.save();

    res.json({
      success: true,
      message: 'Gasto adicionado',
      data: { expense },
    });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao adicionar gasto' 
    });
  }
});

// @route   DELETE /api/finance/expense/:id
// @desc    Delete expense
// @access  Private
router.delete('/expense/:id', auth, async (req, res) => {
  try {
    const financeData = await FinanceData.findOne({ userId: req.userId });
    financeData.expenses = financeData.expenses.filter(e => e.id !== req.params.id);
    await financeData.save();

    res.json({
      success: true,
      message: 'Gasto removido',
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao remover gasto' 
    });
  }
});

// @route   POST /api/finance/income
// @desc    Add income
// @access  Private
router.post('/income', auth, async (req, res) => {
  try {
    const income = req.body;

    const financeData = await FinanceData.findOne({ userId: req.userId });
    financeData.incomes.push(income);
    await financeData.save();

    res.json({
      success: true,
      message: 'Receita adicionada',
      data: { income },
    });
  } catch (error) {
    console.error('Add income error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao adicionar receita' 
    });
  }
});

// @route   DELETE /api/finance/income/:id
// @desc    Delete income
// @access  Private
router.delete('/income/:id', auth, async (req, res) => {
  try {
    const financeData = await FinanceData.findOne({ userId: req.userId });
    financeData.incomes = financeData.incomes.filter(i => i.id !== req.params.id);
    await financeData.save();

    res.json({
      success: true,
      message: 'Receita removida',
    });
  } catch (error) {
    console.error('Delete income error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao remover receita' 
    });
  }
});

// @route   DELETE /api/finance/clear
// @desc    Clear all finance data
// @access  Private
router.delete('/clear', auth, async (req, res) => {
  try {
    const financeData = await FinanceData.findOne({ userId: req.userId });
    
    if (financeData) {
      financeData.balance = 0;
      financeData.expenses = [];
      financeData.incomes = [];
      financeData.categories = []; // Or reset to default if preferred
      financeData.recurringBills = [];
      await financeData.save();
    }

    res.json({
      success: true,
      message: 'Dados limpos com sucesso',
    });
  } catch (error) {
    console.error('Clear data error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao limpar dados' 
    });
  }
});

// ===== RECURRING INCOME ROUTES =====

// @route   POST /api/finance/recurring-incomes
// @desc    Add recurring income
// @access  Private
router.post('/recurring-incomes', auth, async (req, res) => {
  try {
    const recurringIncome = req.body;

    const financeData = await FinanceData.findOne({ userId: req.userId });
    if (!financeData.recurringIncomes) {
      financeData.recurringIncomes = [];
    }
    financeData.recurringIncomes.push(recurringIncome);
    await financeData.save();

    res.json({
      success: true,
      message: 'Renda recorrente adicionada',
      data: { recurringIncome },
    });
  } catch (error) {
    console.error('Add recurring income error:', error);
    res.status(500).json({ success: false, message: 'Erro ao adicionar renda recorrente' });
  }
});

// @route   PUT /api/finance/recurring-incomes/:id
// @desc    Update recurring income
// @access  Private
router.put('/recurring-incomes/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedIncome = req.body;

    const financeData = await FinanceData.findOne({ userId: req.userId });
    const index = financeData.recurringIncomes.findIndex(i => i.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Renda não encontrada' });
    }

    financeData.recurringIncomes[index] = updatedIncome;
    await financeData.save();

    res.json({
      success: true,
      message: 'Renda atualizada',
      data: { recurringIncome: updatedIncome },
    });
  } catch (error) {
    console.error('Update recurring income error:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar renda' });
  }
});

// @route   DELETE /api/finance/recurring-incomes/:id
// @desc    Delete recurring income
// @access  Private
router.delete('/recurring-incomes/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const financeData = await FinanceData.findOne({ userId: req.userId });
    financeData.recurringIncomes = financeData.recurringIncomes.filter(i => i.id !== id);
    await financeData.save();

    res.json({
      success: true,
      message: 'Renda excluída',
    });
  } catch (error) {
    console.error('Delete recurring income error:', error);
    res.status(500).json({ success: false, message: 'Erro ao excluir renda' });
  }
});

// @route   PUT /api/finance/recurring-incomes/:id/receive
// @desc    Mark recurring income as received (creates income entry)
// @access  Private
router.put('/recurring-incomes/:id/receive', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { incomeEntry } = req.body;

    const financeData = await FinanceData.findOne({ userId: req.userId });
    const recurringIncome = financeData.recurringIncomes.find(i => i.id === id);

    if (!recurringIncome) {
      return res.status(404).json({ success: false, message: 'Renda não encontrada' });
    }

    recurringIncome.isReceived = true;
    recurringIncome.lastReceivedDate = new Date().toISOString();
    recurringIncome.lastIncomeId = incomeEntry.id;

    financeData.incomes.push(incomeEntry);
    await financeData.save();

    res.json({
      success: true,
      message: 'Renda marcada como recebida',
      data: { recurringIncome, income: incomeEntry },
    });
  } catch (error) {
    console.error('Mark income as received error:', error);
    res.status(500).json({ success: false, message: 'Erro ao marcar renda' });
  }
});

// @route   PUT /api/finance/recurring-incomes/:id/unreceive
// @desc    Mark recurring income as pending (removes income entry)
// @access  Private
router.put('/recurring-incomes/:id/unreceive', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const financeData = await FinanceData.findOne({ userId: req.userId });
    const recurringIncome = financeData.recurringIncomes.find(i => i.id === id);

    if (!recurringIncome) {
      return res.status(404).json({ success: false, message: 'Renda não encontrada' });
    }

    if (recurringIncome.lastIncomeId) {
      financeData.incomes = financeData.incomes.filter(i => i.id !== recurringIncome.lastIncomeId);
    }

    recurringIncome.isReceived = false;
    recurringIncome.lastReceivedDate = null;
    recurringIncome.lastIncomeId = null;

    await financeData.save();

    res.json({
      success: true,
      message: 'Renda marcada como pendente',
      data: { recurringIncome },
    });
  } catch (error) {
    console.error('Mark income as pending error:', error);
    res.status(500).json({ success: false, message: 'Erro ao marcar renda' });
  }
});

module.exports = router;
