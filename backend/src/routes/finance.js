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
    const { balance, expenses, incomes, categories, recurringBills } = req.body;

    let financeData = await FinanceData.findOne({ userId: req.userId });

    if (!financeData) {
      financeData = new FinanceData({ userId: req.userId });
    }

    if (balance !== undefined) financeData.balance = balance;
    if (expenses) financeData.expenses = expenses;
    if (incomes) financeData.incomes = incomes;
    if (categories) financeData.categories = categories;
    if (recurringBills) financeData.recurringBills = recurringBills;

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

module.exports = router;
