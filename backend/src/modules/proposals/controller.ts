import { Response, NextFunction } from 'express';
import Proposal from './model';
import Quote from '../quotes/model';
import Project from '../projects/model';
import ActivityLog from '../activity_log/model';
import Notification from '../notifications/model';
import { AuthRequest } from '../../middleware/authGuard';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';
import User from '../users/model';
import { escapeRegex } from '../../utils/text';
import {
  sendProposalSentEmail,
  sendProposalAcceptedEmail,
  sendProposalDeclinedEmail,
  sendProjectCreatedEmail,
} from '../../services/email.service';

export class ProposalController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, search, page = '1', limit = '20' } = req.query as Record<string, string>;
      const filter: any = {};

      if (req.user!.role === 'client') {
        filter.clientId = req.user!._id;
      }
      if (status && status !== 'all') filter.status = status;
      if (search && search.trim()) {
        filter.title = new RegExp(escapeRegex(search.trim()), 'i');
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

      const [proposals, total] = await Promise.all([
        Proposal.find(filter)
          .populate('clientId', 'name email company')
          .populate('quoteId')
          .sort({ createdAt: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum),
        Proposal.countDocuments(filter),
      ]);

      sendSuccess(res, {
        proposals,
        total,
        page: pageNum,
        totalPages: Math.max(1, Math.ceil(total / limitNum)),
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const proposal = await Proposal.findById(req.params.id)
        .populate('clientId', 'name email company phone')
        .populate('quoteId');

      if (!proposal) throw new AppError('Proposal not found', 404);

      if (req.user!.role === 'client' && proposal.clientId._id.toString() !== req.user!._id) {
        throw new AppError('Access denied', 403);
      }

      sendSuccess(res, proposal);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const proposal = await Proposal.create({
        ...req.body,
        clientId: req.user!._id,
      });

      await Notification.create({
        userId: req.user!._id,
        type: 'proposal_submitted',
        message: `Your proposal "${proposal.title}" has been submitted`,
        link: `/client/proposals/${proposal._id}`,
      });

      // Notify all admins
      const adminUsers = await User.find({ role: 'admin' });
      for (const admin of adminUsers) {
        await Notification.create({
          userId: admin._id,
          type: 'new_proposal',
          message: `New proposal submitted: "${proposal.title}"`,
          link: `/admin/proposals/${proposal._id}`,
        });
      }

      sendSuccess(res, proposal, 'Proposal submitted', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const proposal = await Proposal.findById(req.params.id);
      if (!proposal) throw new AppError('Proposal not found', 404);

      if (req.user!.role === 'client') {
        if (proposal.clientId.toString() !== req.user!._id) {
          throw new AppError('Access denied', 403);
        }
        if (proposal.status !== 'submitted') {
          throw new AppError('Can only edit proposals in submitted status', 400);
        }
      }

      const updated = await Proposal.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!updated) throw new AppError('Proposal not found', 404);
      sendSuccess(res, updated, 'Proposal updated');
    } catch (error) {
      next(error);
    }
  }

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const proposal = await Proposal.findById(req.params.id);
      if (!proposal) throw new AppError('Proposal not found', 404);

      if (req.user!.role === 'client') {
        if (proposal.clientId.toString() !== req.user!._id) {
          throw new AppError('Access denied', 403);
        }
        if (proposal.status !== 'submitted') {
          throw new AppError('Can only withdraw proposals in submitted status', 400);
        }
      }

      await Proposal.findByIdAndDelete(req.params.id);
      sendSuccess(res, null, 'Proposal withdrawn');
    } catch (error) {
      next(error);
    }
  }

  async review(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, adminNotes, declineReason, quoteId } = req.body;
      const proposal = await Proposal.findById(req.params.id);
      if (!proposal) throw new AppError('Proposal not found', 404);

      proposal.status = status;
      proposal.adminNotes = adminNotes || proposal.adminNotes;

      if (status === 'declined') {
        proposal.declineReason = declineReason;
      }

      if (status === 'quoted' && quoteId) {
        const quote = await Quote.findById(quoteId);
        if (!quote) throw new AppError('Quote not found', 404);
        proposal.quoteId = quote._id;
      }

      await proposal.save();

      await Notification.create({
        userId: proposal.clientId,
        type: 'proposal_reviewed',
        message: `Your proposal "${proposal.title}" status: ${status.replace('_', ' ')}`,
        link: `/client/proposals/${proposal._id}`,
      });

      const client = await User.findById(proposal.clientId).select('name email');
      if (client?.email) {
        if (status === 'declined') {
          await sendProposalDeclinedEmail(client.email, client.name, proposal.title, declineReason || '');
        } else {
          await sendProposalSentEmail(
            client.email,
            client.name,
            proposal.title,
            `${process.env.FRONTEND_URL || 'http://localhost:3000'}/client/proposals/${proposal._id}`,
          );
        }
      }

      await ActivityLog.create({
        userId: req.user!._id,
        action: 'review_proposal',
        targetType: 'Proposal',
        targetId: proposal._id.toString(),
        details: `Proposal "${proposal.title}" set to ${status}`,
      });

      sendSuccess(res, proposal, 'Proposal reviewed');
    } catch (error) {
      next(error);
    }
  }

  async acceptQuote(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const proposal = await Proposal.findById(req.params.id);
      if (!proposal) throw new AppError('Proposal not found', 404);

      if (proposal.clientId.toString() !== req.user!._id) {
        throw new AppError('Access denied', 403);
      }

      if (proposal.status !== 'quoted') {
        throw new AppError('Proposal must be in quoted status', 400);
      }

      if (!proposal.quoteId) {
        throw new AppError('No quote attached to this proposal', 400);
      }

      proposal.status = 'accepted';
      // Click-to-accept e-signature audit trail
      proposal.acceptedAt = new Date();
      proposal.acceptedIp =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
      proposal.acceptedUserAgent = (req.headers['user-agent'] as string) || '';
      await proposal.save();

      // Auto-create the project from the accepted proposal.
      const project = await Project.create({
        clientId: proposal.clientId,
        title: proposal.title,
        status: 'requested',
      });

      // Automation: template milestones/tasks + team assignment.
      try {
        const { applyProjectAutomation } = await import('../../services/automation.service');
        await applyProjectAutomation(project._id.toString());
      } catch (err) {
        console.warn('[automation] Project automation failed:', err);
      }

      await Notification.create({
        userId: proposal.clientId,
        type: 'proposal_accepted',
        message: `Proposal "${proposal.title}" accepted. Your project has been created.`,
        link: `/client/projects/${project._id}`,
      });

      const clientUser = await User.findById(proposal.clientId).select('name email');
      if (clientUser?.email) {
        await sendProposalAcceptedEmail(clientUser.email, clientUser.name, proposal.title);
        const { sendProjectCreatedEmail } = await import('../../services/email.service');
        await sendProjectCreatedEmail(
          clientUser.email,
          clientUser.name,
          project.title,
          `${process.env.FRONTEND_URL || 'http://localhost:3000'}/client/projects/${project._id}`,
        );
      }

      // Notify admins
      const adminUsers = await User.find({ role: { $in: ['admin', 'super_admin'] }, isActive: true });
      for (const admin of adminUsers) {
        await Notification.create({
          userId: admin._id,
          type: 'proposal_accepted',
          message: `Proposal "${proposal.title}" accepted. Project created.`,
          link: `/dashboard/projects`,
        });
      }

      sendSuccess(res, { proposal, project }, 'Proposal accepted, project created');
    } catch (error) {
      next(error);
    }
  }

  async requestChanges(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { clientResponseNotes } = req.body;
      const proposal = await Proposal.findById(req.params.id);
      if (!proposal) throw new AppError('Proposal not found', 404);

      if (proposal.clientId.toString() !== req.user!._id) {
        throw new AppError('Access denied', 403);
      }

      if (clientResponseNotes !== undefined) proposal.clientResponseNotes = clientResponseNotes;
      proposal.status = 'submitted';
      await proposal.save();

      sendSuccess(res, proposal, 'Changes requested');
    } catch (error) {
      next(error);
    }
  }

  async approveAndCreateProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const proposal = await Proposal.findById(req.params.id);
      if (!proposal) throw new AppError('Proposal not found', 404);

      proposal.status = 'accepted';
      proposal.adminNotes = req.body.adminNotes || proposal.adminNotes;
      await proposal.save();

      const project = await Project.create({
        clientId: proposal.clientId,
        title: proposal.title,
        status: 'requested',
      });

      // Automation: template milestones/tasks + team assignment.
      try {
        const { applyProjectAutomation } = await import('../../services/automation.service');
        await applyProjectAutomation(project._id.toString());
      } catch (err) {
        console.warn('[automation] Project automation failed:', err);
      }

      await ActivityLog.create({
        userId: req.user!._id,
        action: 'approve_proposal',
        targetType: 'Proposal',
        targetId: proposal._id.toString(),
        details: `Approved proposal "${proposal.title}" and created project`,
      });

      await Notification.create({
        userId: proposal.clientId,
        type: 'proposal_approved',
        message: `Your proposal "${proposal.title}" has been approved! A project has been created.`,
        link: `/client/projects/${project._id}`,
      });

      const approvedClient = await User.findById(proposal.clientId).select('name email');
      if (approvedClient?.email) {
        const { sendProposalAcceptedEmail } = await import('../../services/email.service');
        await sendProposalAcceptedEmail(approvedClient.email, approvedClient.name, proposal.title);
      }

      sendSuccess(res, { proposal, project }, 'Proposal approved, project created');
    } catch (error) {
      next(error);
    }
  }
}

export const proposalController = new ProposalController();
