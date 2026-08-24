import { Response, NextFunction } from 'express';
import PaymentSubmission from './model';
import Invoice from '../invoices/model';
import Notification from '../notifications/model';
import User from '../users/model';
import ActivityLog from '../activity_log/model';
import { AuthRequest } from '../../middleware/authGuard';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';
import {
  sendPaymentConfirmedEmail,
  sendPaymentRejectedEmail,
  sendPaymentSubmittedAdminEmail,
} from '../../services/email.service';

export class PaymentController {
  async createSubmission(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const invoice = await Invoice.findById(req.params.invoiceId);
      if (!invoice) throw new AppError('Invoice not found', 404);

      const isOwner =
        req.user!.role === 'client' && invoice.clientId.toString() === req.user!._id;
      const isStaff = ['admin', 'super_admin'].includes(req.user!.role);
      if (!isOwner && !isStaff) throw new AppError('Access denied', 403);

      if (invoice.status === 'paid') throw new AppError('Invoice is already paid', 400);
      if (invoice.status === 'cancelled') throw new AppError('Invoice was cancelled', 400);
      if (!['sent', 'overdue', 'draft'].includes(invoice.status)) {
        throw new AppError('This invoice cannot be paid right now', 400);
      }

      const pending = await PaymentSubmission.findOne({
        invoiceId: invoice._id,
        status: 'pending',
      });
      if (pending) {
        throw new AppError('A payment submission is already under review for this invoice', 409);
      }

      const { method, transactionRef, amount } = req.body as {
        method: string;
        transactionRef: string;
        amount: number;
      };
      const allowedMethods = ['bank_transfer', 'bkash', 'nagad', 'other'];
      if (!allowedMethods.includes(method)) throw new AppError('Invalid payment method', 400);
      if (!transactionRef || !transactionRef.trim()) {
        throw new AppError('Transaction reference is required', 400);
      }
      if (!amount || amount <= 0) throw new AppError('Amount must be greater than zero', 400);

      let screenshotUrl: string | undefined;
      if (req.file) screenshotUrl = `/uploads/${req.file.filename}`;

      const submission = await PaymentSubmission.create({
        invoiceId: invoice._id,
        clientId: invoice.clientId,
        method,
        transactionRef: transactionRef.trim(),
        amount,
        screenshotUrl,
      });

      // Notify all admins for the review queue.
      const admins = await User.find({ role: { $in: ['admin', 'super_admin'] }, isActive: true });
      for (const admin of admins) {
        await Notification.create({
          userId: admin._id,
          type: 'payment_submitted',
          message: `Payment submitted for invoice #${invoice.invoiceNumber} — needs review`,
          link: `/dashboard/payments`,
        });
      }
      await sendPaymentSubmittedAdminEmail(
        invoice.invoiceNumber,
        method,
        amount,
        `${req.user!.name} <${req.user!.email}>`,
        `${(req.user as any).email}`,
      );

      await ActivityLog.create({
        userId: req.user!._id,
        action: 'submit_payment',
        targetType: 'Invoice',
        targetId: invoice._id.toString(),
        details: `Manual payment submitted (${method}) ref ${submission.transactionRef}`,
      });

      sendSuccess(res, submission, 'Payment submitted. We will verify it shortly.', 201);
    } catch (error) {
      next(error);
    }
  }

  async listMine(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const subs = await PaymentSubmission.find({ clientId: req.user!._id })
        .populate('invoiceId', 'invoiceNumber total status currency')
        .sort({ createdAt: -1 })
        .limit(100);
      sendSuccess(res, subs);
    } catch (error) {
      next(error);
    }
  }

  async listByInvoice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const invoice = await Invoice.findById(req.params.invoiceId);
      if (!invoice) throw new AppError('Invoice not found', 404);
      const isOwner =
        req.user!.role === 'client' && invoice.clientId.toString() === req.user!._id;
      const isStaff = ['admin', 'super_admin'].includes(req.user!.role);
      if (!isOwner && !isStaff) throw new AppError('Access denied', 403);

      const subs = await PaymentSubmission.find({ invoiceId: invoice._id })
        .sort({ createdAt: -1 });
      sendSuccess(res, subs);
    } catch (error) {
      next(error);
    }
  }

  async listAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
      const filter: any = {};
      if (status && status !== 'all') filter.status = status;

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const [subs, total] = await Promise.all([
        PaymentSubmission.find(filter)
          .populate('invoiceId', 'invoiceNumber total currency status')
          .populate('clientId', 'name email company')
          .sort({ createdAt: status === 'pending' ? 1 : -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum),
        PaymentSubmission.countDocuments(filter),
      ]);
      sendSuccess(res, {
        submissions: subs,
        total,
        page: pageNum,
        totalPages: Math.max(1, Math.ceil(total / limitNum)),
      });
    } catch (error) {
      next(error);
    }
  }

  async confirm(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sub = await PaymentSubmission.findById(req.params.id).populate<{
        invoiceId: any }>('invoiceId');
      if (!sub) throw new AppError('Payment submission not found', 404);
      if (sub.status !== 'pending') throw new AppError('This submission was already reviewed', 400);

      sub.status = 'confirmed';
      sub.reviewedBy = req.user!._id as any;
      sub.reviewedByName = req.user!.name;
      sub.reviewNote = req.body?.reviewNote || '';
      sub.reviewedAt = new Date();
      await sub.save();

      const invoice = sub.invoiceId as any;
      invoice.status = 'paid';
      invoice.paidAt = new Date();
      invoice.paymentMethod = sub.method as any;
      invoice.transactionRef = sub.transactionRef;
      invoice.confirmedByName = req.user!.name;
      invoice.confirmedAt = sub.reviewedAt;
      await invoice.save();

      await Notification.create({
        userId: sub.clientId,
        type: 'payment_confirmed',
        message: `Payment confirmed for invoice #${invoice.invoiceNumber}. Thank you!`,
        link: `/client/invoices/${invoice._id}`,
      });

      const client = await User.findById(sub.clientId).select('name email');
      if (client?.email) {
        await sendPaymentConfirmedEmail(
          client.email,
          client.name,
          invoice.invoiceNumber,
          sub.amount,
          sub.method,
          `${sub.reviewedByName}`,
        );
      }

      await ActivityLog.create({
        userId: req.user!._id,
        action: 'confirm_payment',
        targetType: 'Invoice',
        targetId: invoice._id.toString(),
        details: `Confirmed manual payment ${sub.transactionRef} (${sub.method})`,
      });

      sendSuccess(res, sub, 'Payment confirmed and invoice marked as paid');
    } catch (error) {
      next(error);
    }
  }

  async reject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const reason = (req.body?.reason || '').trim();
      if (!reason) throw new AppError('A rejection reason is required', 400);

      const sub = await PaymentSubmission.findById(req.params.id).populate<{ invoiceId: any }>('invoiceId');
      if (!sub) throw new AppError('Payment submission not found', 404);
      if (sub.status !== 'pending') throw new AppError('This submission was already reviewed', 400);

      sub.status = 'rejected';
      sub.rejectionReason = reason;
      sub.reviewedByName = req.user!.name;
      sub.reviewedBy = req.user!._id as any;
      sub.reviewedAt = new Date();
      await sub.save();

      const invoice = sub.invoiceId as any;

      await Notification.create({
        userId: sub.clientId,
        type: 'payment_rejected',
        message: `Payment for invoice #${invoice.invoiceNumber} was rejected: ${reason}`,
        link: `/client/invoices/${invoice._id}`,
      });

      const client = await User.findById(sub.clientId).select('name email');
      if (client?.email) {
        await sendPaymentRejectedEmail(
          client.email,
          client.name,
          invoice.invoiceNumber,
          sub.transactionRef,
          reason,
        );
      }

      await ActivityLog.create({
        userId: req.user!._id,
        action: 'reject_payment',
        targetType: 'Invoice',
        targetId: invoice._id.toString(),
        details: `Rejected manual payment ${sub.transactionRef}: ${reason}`,
      });

      sendSuccess(res, sub, 'Payment rejected and client notified');
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
