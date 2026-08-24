import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authGuard';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';
import { settingsService, PaymentConfig, AutomationConfig } from './service';
import ActivityLog from '../activity_log/model';
import { ttlCache } from '../../utils/cache';

export class SettingsController {
  async getPayments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const config = await settingsService.getPaymentConfig();
      sendSuccess(res, config);
    } catch (error) {
      next(error);
    }
  }

  async updatePayments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await settingsService.updatePaymentConfig(req.body as Partial<PaymentConfig>);
      ttlCache.invalidate('payments-config');
      await ActivityLog.create({
        userId: req.user!._id,
        action: 'update_payment_settings',
        targetType: 'Settings',
        targetId: 'payments',
      });
      const config = await settingsService.getPaymentConfig();
      sendSuccess(res, config, 'Payment settings updated');
    } catch (error) {
      next(error);
    }
  }

  async getAutomation(_req: Request, res: Response, next: NextFunction) {
    try {
      const config = await settingsService.getAutomationConfig();
      sendSuccess(res, config);
    } catch (error) {
      next(error);
    }
  }

  async updateAutomation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await settingsService.updateAutomationConfig(req.body as Partial<AutomationConfig>);
      ttlCache.invalidate('automation-config');
      await ActivityLog.create({
        userId: req.user!._id,
        action: 'update_automation_settings',
        targetType: 'Settings',
        targetId: 'automation',
      });
      const config = await settingsService.getAutomationConfig();
      sendSuccess(res, config, 'Automation settings updated');
    } catch (error) {
      next(error);
    }
  }

  async getPublicPayments(_req: Request, res: Response, next: NextFunction) {
    try {
      const config = await settingsService.getPaymentConfig();
      // Public view for clients: payment instructions without admin-only notes.
      sendSuccess(res, config);
    } catch (error) {
      next(error);
    }
  }
}

export const settingsController = new SettingsController();
