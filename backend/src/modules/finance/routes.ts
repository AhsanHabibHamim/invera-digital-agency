import { Router } from 'express';
import { financeController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';
import { validate } from '../../middleware/validate';
import {
  createExpenseSchema,
  updateExpenseSchema,
  createIncomeSchema,
  updateIncomeSchema,
} from './validation';

const router = Router();

router.use(authGuard);

// Reports
router.get('/summary', roleGuard('admin', 'super_admin'), financeController.getSummary);
router.get('/monthly', roleGuard('admin', 'super_admin'), financeController.getMonthlyReport);
router.get('/categories', roleGuard('admin', 'super_admin'), financeController.getCategories);

// Expense routes
router.get('/expenses', roleGuard('admin', 'super_admin'), financeController.getAllExpenses);
router.get('/expenses/:id', roleGuard('admin', 'super_admin'), financeController.getExpenseById);
router.post('/expenses', roleGuard('admin', 'super_admin'), validate(createExpenseSchema), financeController.createExpense);
router.patch('/expenses/:id', roleGuard('admin', 'super_admin'), validate(updateExpenseSchema), financeController.updateExpense);
router.delete('/expenses/:id', roleGuard('admin', 'super_admin'), financeController.deleteExpense);

// Income routes
router.get('/incomes', roleGuard('admin', 'super_admin'), financeController.getAllIncomes);
router.get('/incomes/:id', roleGuard('admin', 'super_admin'), financeController.getIncomeById);
router.post('/incomes', roleGuard('admin', 'super_admin'), validate(createIncomeSchema), financeController.createIncome);
router.patch('/incomes/:id', roleGuard('admin', 'super_admin'), validate(updateIncomeSchema), financeController.updateIncome);
router.delete('/incomes/:id', roleGuard('admin', 'super_admin'), financeController.deleteIncome);

export default router;
