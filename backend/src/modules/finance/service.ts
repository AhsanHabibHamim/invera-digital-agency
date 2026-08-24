import Expense from './expense.model';
import Income from './income.model';
import { AppError } from '../../middleware/errorHandler';

export class FinanceService {
  // Expense methods
  async getAllExpenses(filters: any = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [expenses, total] = await Promise.all([
      Expense.find(filters)
        .populate('paidBy', 'name email')
        .populate('projectId', 'title')
        .sort({ expenseDate: -1 })
        .skip(skip)
        .limit(limit),
      Expense.countDocuments(filters),
    ]);
    return { expenses, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getExpenseById(id: string) {
    const expense = await Expense.findById(id)
      .populate('paidBy', 'name email')
      .populate('projectId', 'title');
    if (!expense) throw new AppError('Expense not found', 404);
    return expense;
  }

  async createExpense(data: any) {
    return Expense.create(data);
  }

  async updateExpense(id: string, data: any) {
    const expense = await Expense.findByIdAndUpdate(id, data, { new: true });
    if (!expense) throw new AppError('Expense not found', 404);
    return expense;
  }

  async deleteExpense(id: string) {
    const expense = await Expense.findByIdAndDelete(id);
    if (!expense) throw new AppError('Expense not found', 404);
  }

  // Income methods
  async getAllIncomes(filters: any = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [incomes, total] = await Promise.all([
      Income.find(filters)
        .populate('clientId', 'name email company')
        .populate('invoiceId', 'invoiceNumber total')
        .populate('projectId', 'title')
        .sort({ incomeDate: -1 })
        .skip(skip)
        .limit(limit),
      Income.countDocuments(filters),
    ]);
    return { incomes, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getIncomeById(id: string) {
    const income = await Income.findById(id)
      .populate('clientId', 'name email company')
      .populate('invoiceId', 'invoiceNumber total')
      .populate('projectId', 'title');
    if (!income) throw new AppError('Income not found', 404);
    return income;
  }

  async createIncome(data: any) {
    return Income.create(data);
  }

  async updateIncome(id: string, data: any) {
    const income = await Income.findByIdAndUpdate(id, data, { new: true });
    if (!income) throw new AppError('Income not found', 404);
    return income;
  }

  async deleteIncome(id: string) {
    const income = await Income.findByIdAndDelete(id);
    if (!income) throw new AppError('Income not found', 404);
  }

  // Reports
  async getFinancialSummary() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [totalExpenses, totalIncome, monthlyExpenses, monthlyIncome, yearlyExpenses, yearlyIncome] = await Promise.all([
      Expense.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Income.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.aggregate([{ $match: { expenseDate: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Income.aggregate([{ $match: { incomeDate: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.aggregate([{ $match: { expenseDate: { $gte: startOfYear } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Income.aggregate([{ $match: { incomeDate: { $gte: startOfYear } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);

    return {
      totalExpenses: totalExpenses[0]?.total || 0,
      totalIncome: totalIncome[0]?.total || 0,
      netProfit: (totalIncome[0]?.total || 0) - (totalExpenses[0]?.total || 0),
      monthlyExpenses: monthlyExpenses[0]?.total || 0,
      monthlyIncome: monthlyIncome[0]?.total || 0,
      monthlyNet: (monthlyIncome[0]?.total || 0) - (monthlyExpenses[0]?.total || 0),
      yearlyExpenses: yearlyExpenses[0]?.total || 0,
      yearlyIncome: yearlyIncome[0]?.total || 0,
      yearlyNet: (yearlyIncome[0]?.total || 0) - (yearlyExpenses[0]?.total || 0),
    };
  }

  async getMonthlyReport(year: number) {
    const monthlyExpenses = await Expense.aggregate([
      { $match: { expenseDate: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) } } },
      { $group: { _id: { $month: '$expenseDate' }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const monthlyIncomes = await Income.aggregate([
      { $match: { incomeDate: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) } } },
      { $group: { _id: { $month: '$incomeDate' }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const months = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const exp = monthlyExpenses.find((e: any) => e._id === month);
      const inc = monthlyIncomes.find((e: any) => e._id === month);
      return {
        month,
        expenses: exp?.total || 0,
        expenseCount: exp?.count || 0,
        income: inc?.total || 0,
        incomeCount: inc?.count || 0,
        net: (inc?.total || 0) - (exp?.total || 0),
      };
    });

    return months;
  }

  async getExpenseCategories() {
    return Expense.distinct('category');
  }

  async getIncomeCategories() {
    return Income.distinct('source');
  }
}

export const financeService = new FinanceService();
