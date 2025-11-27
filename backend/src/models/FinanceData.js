const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  id: String,
  amount: Number,
  description: String,
  categoryId: String,
  date: String,
});

const incomeSchema = new mongoose.Schema({
  id: String,
  amount: Number,
  description: String,
  date: String,
});

const categorySchema = new mongoose.Schema({
  id: String,
  name: String,
  color: String,
  icon: String,
  isCustom: Boolean,
});

const recurringBillSchema = new mongoose.Schema({
  id: String,
  name: String,
  amount: Number,
  dueDay: Number,
  categoryId: String,
  isPaid: Boolean,
  lastPaidDate: String,
  lastPaymentExpenseId: String,
});

const financeDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  expenses: [expenseSchema],
  incomes: [incomeSchema],
  categories: [categorySchema],
  recurringBills: [recurringBillSchema],
}, {
  timestamps: true,
});

module.exports = mongoose.model('FinanceData', financeDataSchema);
