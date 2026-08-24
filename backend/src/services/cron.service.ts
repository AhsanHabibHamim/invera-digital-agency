import cron from 'node-cron';
import Invoice from '../modules/invoices/model';
import { logger } from '../utils/logger';

export function startCronJobs() {
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running overdue invoice check...');
    try {
      const result = await Invoice.updateMany(
        {
          status: 'sent',
          dueDate: { $lt: new Date() },
        },
        { status: 'overdue' }
      );
      if (result.modifiedCount > 0) {
        logger.info(`Marked ${result.modifiedCount} invoices as overdue`);
      }
    } catch (error) {
      logger.error('Failed to check overdue invoices:', error);
    }
  });

  logger.info('Cron jobs started');
}
