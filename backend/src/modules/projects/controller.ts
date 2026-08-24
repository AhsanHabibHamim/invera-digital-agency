import { Response, NextFunction } from 'express';
import Project from './model';
import User from '../users/model';
import ActivityLog from '../activity_log/model';
import Notification from '../notifications/model';
import { AuthRequest } from '../../middleware/authGuard';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';
import { Types } from 'mongoose';
import { env } from '../../config/env';
import {
  sendProjectCreatedEmail,
  sendProjectStatusEmail,
  sendProjectProgressEmail,
  sendMilestoneUpdateEmail,
} from '../../services/email.service';

const STATUS_LABELS: Record<string, string> = {
  requested: 'Requested',
  quoted: 'Quote sent',
  in_progress: 'In progress',
  in_review: 'In review',
  completed: 'Completed',
  closed: 'Closed',
};

// Module-level helpers. Route handlers reference controller methods unbound
// (e.g. `projectController.create`), so `this` is undefined at runtime —
// helpers must not rely on the instance.
function projectUrlFor(projectId: string): string {
  return `${env.frontendUrl}/client/projects/${projectId}`;
}

function getClientUser(clientId: unknown) {
  return User.findById(clientId).select('name email');
}

export class ProjectController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, clientId, page = '1', limit = '20' } = req.query;
      const filter: any = {};

      if (req.user!.role === 'client') {
        filter.clientId = req.user!._id;
      } else if (req.user!.role === 'team') {
        filter.assignedTeam = req.user!._id;
      }

      if (status) filter.status = status;
      if (clientId && req.user!.role === 'admin') filter.clientId = clientId;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const [projects, total] = await Promise.all([
        Project.find(filter)
          .populate('clientId', 'name email company')
          .populate('assignedTeam', 'name email')
          .populate('serviceId', 'title slug')
          .skip(skip)
          .limit(limitNum)
          .sort({ createdAt: -1 }),
        Project.countDocuments(filter),
      ]);

      sendSuccess(res, { projects, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const project = await Project.findById(req.params.id)
        .populate('clientId', 'name email company phone')
        .populate('assignedTeam', 'name email')
        .populate('serviceId', 'title slug pricingTiers');
      if (!project) throw new AppError('Project not found', 404);

      if (req.user!.role === 'client' && project.clientId._id.toString() !== req.user!._id) {
        throw new AppError('Access denied', 403);
      }
      if (req.user!.role === 'team' && !project.assignedTeam.some((t: any) => t._id.toString() === req.user!._id)) {
        throw new AppError('Access denied', 403);
      }

      sendSuccess(res, project);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = { ...req.body };
      const isClientSubmission = req.user!.role === 'client';
      if (isClientSubmission) {
        data.clientId = req.user!._id;
        data.status = 'requested';
      }
      delete data.assignedTeam;
      if (!isClientSubmission) {
        // Only staff may seed milestones/team on creation.
        if (!data.milestones) delete data.milestones;
      } else {
        delete data.milestones;
      }
      const project = await Project.create(data);

      await ActivityLog.create({
        userId: req.user!._id,
        action: 'create_project',
        targetType: 'Project',
        targetId: project._id.toString(),
      });

      // Client submissions: alert every admin so the request gets picked up.
      if (isClientSubmission) {
        const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } }).select('_id');
        if (admins.length) {
          await Notification.insertMany(
            admins.map((a) => ({
              userId: a._id,
              type: 'project_created',
              message: `${req.user!.name} requested a new project: "${project.title}"`,
              link: `/dashboard/projects/${project._id}`,
            })),
          );
        }
      }

      if (data.clientId) {
        await Notification.create({
          userId: data.clientId,
          type: 'project_created',
          message: isClientSubmission
            ? `Your project request "${project.title}" has been submitted — we'll review it shortly`
            : `Your project "${project.title}" has been created`,
          link: `/client/projects/${project._id}`,
        });

        const client = await getClientUser(data.clientId);
        if (client?.email) {
          await sendProjectCreatedEmail(
            client.email,
            client.name,
            project.title,
            projectUrlFor(project._id.toString()),
          );
        }
      }

      sendSuccess(res, project, 'Project created', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) throw new AppError('Project not found', 404);

      // Role-based ownership/permissions
      if (req.user!.role === 'client') {
        return sendSuccess(res, null, 'Access denied', 403);
      }

      if (req.user!.role === 'team') {
        const isAssigned = project.assignedTeam.some((t: any) => t._id.toString() === req.user!._id);
        if (!isAssigned) throw new AppError('Access denied', 403);
      }

      // Team rules: allow status and progressPercent only
      const requestedKeys = Object.keys(req.body || {});

      if (req.user!.role === 'team') {
        const allowed = ['status', 'progressPercent'];
        const forbidden = requestedKeys.filter((k) => !allowed.includes(k));
        if (forbidden.length > 0) throw new AppError(`Access denied for fields: ${forbidden.join(', ')}`, 403);
      }


      // Apply updates
      const updated = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!updated) throw new AppError('Project not found', 404);

      await ActivityLog.create({
        userId: req.user!._id,
        action: 'update_project',
        targetType: 'Project',
        targetId: updated._id.toString(),
      });

      if (req.body.status) {
        await Notification.create({
          userId: updated.clientId,
          type: 'project_status',
          message: `Project "${updated.title}" status changed to ${req.body.status}`,
          link: `/client/projects/${updated._id}`,
        });

        const client = await getClientUser(updated.clientId);
        if (client?.email) {
          await sendProjectStatusEmail(
            client.email,
            client.name,
            updated.title,
            STATUS_LABELS[req.body.status] || req.body.status,
            projectUrlFor(updated._id.toString()),
          );
        }
      } else if (req.body.progressPercent !== undefined) {
        await Notification.create({
          userId: updated.clientId,
          type: 'project_progress',
          message: `Project "${updated.title}" progress updated to ${req.body.progressPercent}%`,
          link: `/client/projects/${updated._id}`,
        });

        const client = await getClientUser(updated.clientId);
        if (client?.email) {
          await sendProjectProgressEmail(
            client.email,
            client.name,
            updated.title,
            updated.progressPercent,
            projectUrlFor(updated._id.toString()),
          );
        }
      }

      sendSuccess(res, updated, 'Project updated');
    } catch (error) {
      next(error);
    }
  }

  async addMilestone(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) throw new AppError('Project not found', 404);

      if (req.user!.role === 'client') throw new AppError('Access denied', 403);

      if (req.user!.role === 'team') {
        const isAssigned = project.assignedTeam.some((t: any) => t._id.toString() === req.user!._id);
        if (!isAssigned) throw new AppError('Access denied', 403);
      }

      project.milestones.push(req.body);
      await project.save();

      sendSuccess(res, project, 'Milestone added');
    } catch (error) {
      next(error);
    }
  }

  async updateMilestone(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) throw new AppError('Project not found', 404);

      if (req.user!.role === 'client') throw new AppError('Access denied', 403);

      if (req.user!.role === 'team') {
        const isAssigned = project.assignedTeam.some((t: any) => t._id.toString() === req.user!._id);
        if (!isAssigned) throw new AppError('Access denied', 403);
      }

      const milestone = (project.milestones as any).id(req.params.milestoneId);
      if (!milestone) throw new AppError('Milestone not found', 404);

      // Team can update milestone completion/revision flags; admin can update anything.
      if (req.user!.role === 'team') {
        const allowed = new Set(['done', 'revisionRequested', 'revisionNotes', 'title', 'dueDate']);
        const forbidden = Object.keys(req.body || {}).filter((k) => !allowed.has(k));
        if (forbidden.length > 0) throw new AppError(`Access denied for fields: ${forbidden.join(', ')}`, 403);
      }

      Object.assign(milestone, req.body);
      const wasDoneBefore = milestone.done;
      await project.save();

      const done = project.milestones.filter((m) => m.done).length;
      const total = project.milestones.length;
      project.progressPercent = total > 0 ? Math.round((done / total) * 100) : 0;
      await project.save();

      // Automation: milestone billing invoice + full-completion detection.
      try {
        const { onMilestoneCompletionChanged } = await import('../../services/automation.service');
        if (!wasDoneBefore && milestone.done) {
          await onMilestoneCompletionChanged(
            project._id.toString(),
            milestone.title,
            true,
            req.user!._id.toString(),
          );
        }
      } catch (err) {
        console.warn('[automation] Milestone automation failed:', err);
      }

      await Notification.create({
        userId: project.clientId,
        type: 'milestone_update',
        message: `Milestone "${milestone.title}" on "${project.title}" marked ${milestone.done ? 'complete' : 'as updated'}`,
        link: `/client/projects/${project._id}`,
      });

      const client = await getClientUser(project.clientId);
      if (client?.email) {
        await sendMilestoneUpdateEmail(
          client.email,
          client.name,
          project.title,
          milestone.title,
          milestone.done,
          projectUrlFor(project._id.toString()),
        );
      }

      sendSuccess(res, project, 'Milestone updated');
    } catch (error) {
      next(error);
    }
  }

  async acceptContract(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) throw new AppError('Project not found', 404);
      if (project.clientId.toString() !== req.user!._id) throw new AppError('Access denied', 403);

      project.contractAccepted = true;
      project.contractAcceptedAt = new Date();
      await project.save();

      sendSuccess(res, project, 'Contract accepted');
    } catch (error) {
      next(error);
    }
  }

  async requestRevision(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { milestoneId, revisionNotes } = req.body;
      const project = await Project.findById(req.params.id);
      if (!project) throw new AppError('Project not found', 404);

      const milestone = (project.milestones as any).id(milestoneId);
      if (!milestone) throw new AppError('Milestone not found', 404);

      if (req.user!.role !== 'client') throw new AppError('Access denied', 403);
      if (project.clientId.toString() !== req.user!._id) throw new AppError('Access denied', 403);

      milestone.revisionRequested = true;
      milestone.revisionNotes = revisionNotes;
      milestone.done = false;
      await project.save();

      project.status = 'in_review';
      await project.save();

      sendSuccess(res, project, 'Revision requested');
    } catch (error) {
      next(error);
    }
  }

  async archive(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const project = await Project.findByIdAndUpdate(
        req.params.id,
        { status: 'closed' },
        { new: true }
      );
      if (!project) throw new AppError('Project not found', 404);

      await ActivityLog.create({
        userId: req.user!._id,
        action: 'archive_project',
        targetType: 'Project',
        targetId: project._id.toString(),
      });

      await Notification.create({
        userId: project.clientId,
        type: 'project_status',
        message: `Project "${project.title}" has been closed`,
        link: `/client/projects/${project._id}`,
      });

      const client = await getClientUser(project.clientId);
      if (client?.email) {
        await sendProjectStatusEmail(
          client.email,
          client.name,
          project.title,
          'Closed',
          projectUrlFor(project._id.toString()),
        );
      }

      sendSuccess(res, project, 'Project archived');
    } catch (error) {
      next(error);
    }
  }

  async assignTeam(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { teamMemberIds } = req.body;
      if (!teamMemberIds || !Array.isArray(teamMemberIds) || teamMemberIds.length === 0) {
        throw new AppError('teamMemberIds array is required', 400);
      }

      const project = await Project.findById(req.params.id);
      if (!project) throw new AppError('Project not found', 404);

      project.assignedTeam = teamMemberIds;
      if (project.status === 'requested') {
        project.status = 'in_progress';
      }
      await project.save();

      await ActivityLog.create({
        userId: req.user!._id,
        action: 'assign_team',
        targetType: 'Project',
        targetId: project._id.toString(),
        details: `Assigned ${teamMemberIds.length} team member(s) to project`,
      });

      for (const memberId of teamMemberIds) {
        await Notification.create({
          userId: memberId,
          type: 'team_assigned',
          message: `You have been assigned to project "${project.title}"`,
          link: `/team/projects/${project._id}`,
        });
      }

      sendSuccess(res, project, 'Team member(s) assigned');
    } catch (error) {
      next(error);
    }
  }
}

export const projectController = new ProjectController();
