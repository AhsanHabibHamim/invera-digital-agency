import { Request, Response, NextFunction } from 'express';
import { financeService } from './service';
import { AuthRequest } from '../../middleware/authGuard';
import { sendSuccess } from '../../utils/apiResponse';

export class FinanceController {
  // Expenses
  async getAllExpenses(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, projectId, paidBy, page = '1', limit = '20' } = req.query;
      const filter: any = {};
      if (category) filter.category = category;
      if (projectId) filter.projectId = projectId;
      if (paidBy) filter.paidBy = paidBy;
      const result = await financeService.getAllExpenses(filter, parseInt(page as string), parseInt(limit as string));
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getExpenseById(req: Request, res: Response, next: NextFunction) {
    try {
      const expense = await financeService.getExpenseById(req.params.id);
      sendSuccess(res, expense);
    } catch (error) {
      next(error);
    }
  }

  async createExpense(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = { ...req.body, paidBy: req.body.paidBy || req.user!._id };
      const expense = await financeService.createExpense(data);
      sendSuccess(res, expense, 'Expense created', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateExpense(req: Request, res: Response, next: NextFunction) {
    try {
      const expense = await financeService.updateExpense(req.params.id, req.body);
      sendSuccess(res, expense, 'Expense updated');
    } catch (error) {
      next(error);
    }
  }

  async deleteExpense(req: Request, res: Response, next: NextFunction) {
    try {
      await financeService.deleteExpense(req.params.id);
      sendSuccess(res, null, 'Expense deleted');
    } catch (error) {
      next(error);
    }
  }

  // Income
  async getAllIncomes(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, clientId, projectId, source, page = '1', limit = '20' } = req.query;
      const filter: any = {};
      if (category) filter.category = category;
      if (clientId) filter.clientId = clientId;
      if (projectId) filter.projectId = projectId;
      if (source) filter.source = source;
      const result = await financeService.getAllIncomes(filter, parseInt(page as string), parseInt(limit as string));
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getIncomeById(req: Request, res: Response, next: NextFunction) {
    try {
      const income = await financeService.getIncomeById(req.params.id);
      sendSuccess(res, income);
    } catch (error) {
      next(error);
    }
  }

  async createIncome(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const income = await financeService.createIncome(req.body);
      sendSuccess(res, income, 'Income recorded', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateIncome(req: Request, res: Response, next: NextFunction) {
    try {
      const income = await financeService.updateIncome(req.params.id, req.body);
      sendSuccess(res, income, 'Income updated');
    } catch (error) {
      next(error);
    }
  }

  async deleteIncome(req: Request, res: Response, next: NextFunction) {
    try {
      await financeService.deleteIncome(req.params.id);
      sendSuccess(res, null, 'Income deleted');
    } catch (error) {
      next(error);
    }
  }

  // Reports
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await financeService.getFinancialSummary();
      sendSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  }

  async getMonthlyReport(req: Request, res: Response, next: NextFunction) {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const report = await financeService.getMonthlyReport(year);
      sendSuccess(res, report);
    } catch (error) {
      next(error);
    }
  }

  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const [expenseCategories, incomeSources] = await Promise.all([
        financeService.getExpenseCategories(),
        financeService.getIncomeCategories(),
      ]);
      sendSuccess(res, { expenseCategories, incomeSources });
    } catch (error) {
      next(error);
    }
  }
}

export const financeController = new FinanceController();
