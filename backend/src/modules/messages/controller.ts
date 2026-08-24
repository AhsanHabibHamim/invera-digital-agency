import { Response, NextFunction } from 'express';
import Message from './model';
import Project from '../projects/model';
import Notification from '../notifications/model';
import { AuthRequest } from '../../middleware/authGuard';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';
import User from '../users/model';
import { Types } from 'mongoose';

// Module-level helpers. Route handlers reference controller methods unbound
// (e.g. `messageController.getUnreadCounts`), so `this` is undefined at
// runtime — helpers must not rely on the instance.
async function getAccessibleProjectIds(req: AuthRequest): Promise<Types.ObjectId[]> {
  if (req.user!.role === 'client') {
    const projects = await Project.find({ clientId: req.user!._id }).select('_id');
    return projects.map((p) => p._id);
  }
  if (req.user!.role === 'team') {
    const projects = await Project.find({ assignedTeam: req.user!._id }).select('_id');
    return projects.map((p) => p._id);
  }
  // Staff roles (admin/super_admin) see everything; any other role sees nothing.
  if (req.user!.role === 'admin' || req.user!.role === 'super_admin') {
    const projects = await Project.find({}).select('_id');
    return projects.map((p) => p._id);
  }
  return [];
}

function assertProjectAccess(req: AuthRequest, project: { clientId: Types.ObjectId; assignedTeam: Types.ObjectId[] }) {
  const role = req.user!.role;
  // Explicit allow-list: internal staff roles (hr, finance_manager, etc.)
  // do NOT get implicit access to project chats.
  if (role === 'admin' || role === 'super_admin') return;
  if (role === 'client' && project.clientId.toString() === req.user!._id.toString()) return;
  if (
    role === 'team' &&
    project.assignedTeam.some((t: Types.ObjectId | string) => t.toString() === req.user!._id.toString())
  ) {
    return;
  }
  throw new AppError('Access denied', 403);
}

export class MessageController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filter: any = {};
      if (req.user!.role !== 'admin' && req.user!.role !== 'super_admin') {
        const projectIds = await getAccessibleProjectIds(req);
        filter.projectId = { $in: projectIds };
      }

      const messages = await Message.find(filter)
        .populate('senderId', 'name email role avatarUrl')
        .populate({ path: 'projectId', select: 'title clientId', populate: { path: 'clientId', select: 'name email' } })
        .sort({ createdAt: -1 })
        .limit(100);
      sendSuccess(res, messages);
    } catch (error) {
      next(error);
    }
  }

  async getByProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const project = await Project.findById(req.params.projectId);
      if (!project) throw new AppError('Project not found', 404);
      assertProjectAccess(req, project);

      const messages = await Message.find({ projectId: req.params.projectId })
        .populate('senderId', 'name email role avatarUrl')
        .sort({ createdAt: 1 });
      sendSuccess(res, messages);
    } catch (error) {
      next(error);
    }
  }

  async send(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const project = await Project.findById(req.params.projectId);
      if (!project) throw new AppError('Project not found', 404);
      assertProjectAccess(req, project);

      const message = await Message.create({
        projectId: req.params.projectId,
        senderId: req.user!._id,
        content: req.body.content,
        attachments: req.body.attachments || [],
      });

      const populated = await message.populate('senderId', 'name email role avatarUrl');

      // Notify project participants
      const recipients = new Set<string>();
      if (project.clientId.toString() !== req.user!._id) {
        recipients.add(project.clientId.toString());
      }
      for (const teamId of project.assignedTeam) {
        if (teamId.toString() !== req.user!._id) {
          recipients.add(teamId.toString());
        }
      }

      const recipientUsers = await User.find({ _id: { $in: Array.from(recipients) } }).select('role');
      const roleMap = new Map(recipientUsers.map((u) => [u._id.toString(), u.role]));
      for (const userId of recipients) {
        const role = roleMap.get(userId) || 'client';
        const link = `/${role === 'team' ? 'team' : role === 'admin' ? 'admin' : 'client'}/projects/${project._id}`;
        await Notification.create({
          userId,
          type: 'new_message',
          message: `New message in project "${project.title}"`,
          link,
        });
      }

      sendSuccess(res, populated, 'Message sent', 201);
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCounts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const projectIds = await getAccessibleProjectIds(req);

      const counts = await Message.aggregate([
        {
          $match: {
            projectId: { $in: projectIds },
            senderId: { $ne: new Types.ObjectId(req.user!._id) },
            isRead: false,
          },
        },
        { $group: { _id: '$projectId', unread: { $sum: 1 } } },
      ]);

      sendSuccess(
        res,
        counts.map((c) => ({ projectId: c._id.toString(), unread: c.unread })),
      );
    } catch (error) {
      next(error);
    }
  }

  async markProjectRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const project = await Project.findById(req.params.projectId);
      if (!project) throw new AppError('Project not found', 404);
      assertProjectAccess(req, project);

      await Message.updateMany(
        { projectId: project._id, senderId: { $ne: req.user!._id }, isRead: false },
        { $set: { isRead: true } },
      );

      sendSuccess(res, null, 'Marked as read');
    } catch (error) {
      next(error);
    }
  }

  async reply(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parent = await Message.findById(req.params.id);
      if (!parent) throw new AppError('Message not found', 404);

      const project = await Project.findById(parent.projectId);
      if (!project) throw new AppError('Project not found', 404);

      assertProjectAccess(req, project);

      const message = await Message.create({
        projectId: parent.projectId,
        senderId: req.user!._id,
        content: req.body.content,
        replyTo: parent._id,
      });

      const populated = await message.populate('senderId', 'name email role avatarUrl');

      // Notify the original sender
      if (parent.senderId.toString() !== req.user!._id) {
        const senderUser = await User.findById(parent.senderId).select('role');
        const senderRole = senderUser?.role || 'client';
        const link = `/${senderRole === 'team' ? 'team' : senderRole === 'admin' ? 'admin' : 'client'}/projects/${project._id}`;
        await Notification.create({
          userId: parent.senderId,
          type: 'new_message',
          message: `${req.user!.name} replied to your message in "${project.title}"`,
          link,
        });
      }

      sendSuccess(res, populated, 'Reply sent', 201);
    } catch (error) {
      next(error);
    }
  }
}

export const messageController = new MessageController();
