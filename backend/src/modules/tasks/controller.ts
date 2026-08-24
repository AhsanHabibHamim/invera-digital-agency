import { Request, Response, NextFunction } from 'express';
import Project from '../projects/model';
import { taskService } from './service';
import { AuthRequest } from '../../middleware/authGuard';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';

const STAFF_ROLES = ['admin', 'super_admin'];

/** Project ids the requester is allowed to see tasks for. */
async function accessibleProjectIds(req: AuthRequest): Promise<string[] | null> {
  if (STAFF_ROLES.includes(req.user!.role)) return null; // null = unrestricted
  if (req.user!.role === 'client') {
    const projects = await Project.find({ clientId: req.user!._id }).select('_id');
    return projects.map((p) => p._id.toString());
  }
  if (req.user!.role === 'team') {
    const projects = await Project.find({ assignedTeam: req.user!._id }).select('_id');
    return projects.map((p) => p._id.toString());
  }
  return [];
}

export class TaskController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId, sprintId, status, assignedTo, type, priority, page = '1', limit = '50' } = req.query;
      const filter: any = {};
      if (projectId) filter.projectId = projectId;
      if (sprintId) filter.sprintId = sprintId;
      if (status) filter.status = status;
      if (assignedTo) filter.assignedTo = assignedTo;
      if (type) filter.type = type;
      if (priority) filter.priority = priority;

      const projectIds = await accessibleProjectIds(req);
      if (projectIds !== null) {
        // Clients/team are additionally limited to tasks assigned to them or
        // unassigned within their own projects.
        filter.$or = [
          { projectId: { $in: projectIds }, assignedTo: { $in: [null, undefined] } },
          { projectId: { $in: projectIds }, assignedTo: req.user!._id },
        ];
        if (req.user!.role === 'client') {
          // Clients never see internal-only work items even in their projects.
          filter.isInternal = { $ne: true };
        }
      }

      const result = await taskService.getTasks(filter, parseInt(page as string), parseInt(limit as string));
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const task = await taskService.getTaskById(req.params.id);
      const projectIds = await accessibleProjectIds(req);
      if (projectIds !== null && !projectIds.includes(task.projectId?.toString())) {
        throw new AppError('Access denied', 403);
      }
      sendSuccess(res, task);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = { ...req.body, createdBy: req.user!._id };
      if (!STAFF_ROLES.includes(req.user!.role)) {
        const projectIds = await accessibleProjectIds(req);
        if (projectIds === null || !projectIds.includes(String(data.projectId))) {
          throw new AppError('Access denied', 403);
        }
      }
      const task = await taskService.createTask(data);
      sendSuccess(res, task, 'Task created', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const existing = await taskService.getTaskById(req.params.id);
      const projectIds = await accessibleProjectIds(req);
      if (projectIds !== null && !projectIds.includes(existing.projectId?.toString())) {
        throw new AppError('Access denied', 403);
      }
      const task = await taskService.updateTask(req.params.id, req.body);
      sendSuccess(res, task, 'Task updated');
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await taskService.deleteTask(req.params.id);
      sendSuccess(res, null, 'Task deleted');
    } catch (error) {
      next(error);
    }
  }

  async addSubtask(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const existing = await taskService.getTaskById(req.params.id);
      const projectIds = await accessibleProjectIds(req);
      if (projectIds !== null && !projectIds.includes(existing.projectId?.toString())) {
        throw new AppError('Access denied', 403);
      }
      const task = await taskService.addSubtask(req.params.id, req.body);
      sendSuccess(res, task, 'Subtask added');
    } catch (error) {
      next(error);
    }
  }

  async updateSubtask(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const existing = await taskService.getTaskById(req.params.id);
      const projectIds = await accessibleProjectIds(req);
      if (projectIds !== null && !projectIds.includes(existing.projectId?.toString())) {
        throw new AppError('Access denied', 403);
      }
      const task = await taskService.updateSubtask(req.params.id, req.params.subtaskId, req.body);
      sendSuccess(res, task, 'Subtask updated');
    } catch (error) {
      next(error);
    }
  }

  async removeSubtask(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const existing = await taskService.getTaskById(req.params.id);
      const projectIds = await accessibleProjectIds(req);
      if (projectIds !== null && !projectIds.includes(existing.projectId?.toString())) {
        throw new AppError('Access denied', 403);
      }
      const task = await taskService.deleteSubtask(req.params.id, req.params.subtaskId);
      sendSuccess(res, task, 'Subtask deleted');
    } catch (error) {
      next(error);
    }
  }

  // Sprints
  async getSprints(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const projectIds = await accessibleProjectIds(req);
      if (projectIds !== null && !projectIds.includes(req.params.projectId)) {
        throw new AppError('Access denied', 403);
      }
      const sprints = await taskService.getSprints(req.params.projectId);
      sendSuccess(res, sprints);
    } catch (error) {
      next(error);
    }
  }

  async createSprint(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const projectIds = await accessibleProjectIds(req);
      if (projectIds !== null && !projectIds.includes(String(req.body?.projectId))) {
        throw new AppError('Access denied', 403);
      }
      const sprint = await taskService.createSprint(req.body);
      sendSuccess(res, sprint, 'Sprint created', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateSprint(req: Request, res: Response, next: NextFunction) {
    try {
      const sprint = await taskService.updateSprint(req.params.id, req.body);
      sendSuccess(res, sprint, 'Sprint updated');
    } catch (error) {
      next(error);
    }
  }

  async deleteSprint(req: Request, res: Response, next: NextFunction) {
    try {
      await taskService.deleteSprint(req.params.id);
      sendSuccess(res, null, 'Sprint deleted');
    } catch (error) {
      next(error);
    }
  }

  // Time entries
  async getTimeEntries(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { taskId, userId, projectId, date, page = '1', limit = '50' } = req.query;
      const filter: any = {};
      if (taskId) filter.taskId = taskId;
      if (userId) filter.userId = userId;
      if (projectId) filter.projectId = projectId;
      if (date) {
        const d = new Date(date as string);
        d.setHours(0, 0, 0, 0);
        const nextDay = new Date(d);
        nextDay.setDate(nextDay.getDate() + 1);
        filter.date = { $gte: d, $lt: nextDay };
      }

      const projectIds = await accessibleProjectIds(req);
      if (projectIds !== null) {
        // Non-staff users only ever see their own logged time.
        filter.userId = req.user!._id;
      }

      const result = await taskService.getTimeEntries(filter, parseInt(page as string), parseInt(limit as string));
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createTimeEntry(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = { ...req.body, userId: req.user!._id };
      const entry = await taskService.createTimeEntry(data);
      sendSuccess(res, entry, 'Time entry created', 201);
    } catch (error) {
      next(error);
    }
  }

  async deleteTimeEntry(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const entry = await taskService.getTimeEntryById(req.params.id);
      if (!entry) throw new AppError('Time entry not found', 404);
      const isOwner = entry.userId?.toString() === req.user!._id.toString();
      if (!isOwner && !STAFF_ROLES.includes(req.user!.role)) {
        throw new AppError('Access denied', 403);
      }
      await taskService.deleteTimeEntry(req.params.id);
      sendSuccess(res, null, 'Time entry deleted');
    } catch (error) {
      next(error);
    }
  }

  async getTimeStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId, userId } = req.query;
      let effectiveUserId = userId as string | undefined;
      const projectIds = await accessibleProjectIds(req);
      if (projectIds !== null) {
        effectiveUserId = req.user!._id.toString();
      }
      const stats = await taskService.getTimeStats(projectId as string, effectiveUserId);
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export const taskController = new TaskController();
