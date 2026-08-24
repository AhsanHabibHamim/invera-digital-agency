import Task from './task.model';
import Sprint from './sprint.model';
import TimeEntry from './timeEntry.model';
import Notification from '../notifications/model';
import { AppError } from '../../middleware/errorHandler';

export class TaskService {
  // Tasks
  async getTasks(filters: any = {}, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [tasks, total] = await Promise.all([
      Task.find(filters)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email')
        .populate('parentTask', 'title')
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Task.countDocuments(filters),
    ]);
    return { tasks, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getTaskById(id: string) {
    const task = await Task.findById(id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('parentTask', 'title')
      .populate('subtasks.assignedTo', 'name email');
    if (!task) throw new AppError('Task not found', 404);
    return task;
  }

  async getTimeEntryById(id: string) {
    return TimeEntry.findById(id);
  }

  async createTask(data: any) {
    return Task.create(data);
  }

  async updateTask(id: string, data: any) {
    const previous = await Task.findById(id).select('assignedTo projectId title');
    const task = await Task.findByIdAndUpdate(id, data, { new: true });
    if (!task) throw new AppError('Task not found', 404);

    // Notify newly assigned member by email
    if (
      data.assignedTo &&
      data.assignedTo !== String(previous?.assignedTo ?? '')
    ) {
      try {
        const User = (await import('../users/model')).default;
        const Project = (await import('../projects/model')).default;
        const { sendTaskAssignedEmail } = await import('../../services/email.service');
        const assignee = await User.findById(data.assignedTo).select('name email');
        const project = await Project.findById(task.projectId).select('title');
        if (assignee?.email) {
          await sendTaskAssignedEmail(
            assignee.email,
            assignee.name,
            task.title,
            project?.title || 'a project',
            `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/tasks`,
          );
        }
        await Notification.create({
          userId: assignee!._id,
          type: 'task_assigned',
          message: `New task assigned: ${task.title}`,
          link: '/dashboard/tasks',
        });
      } catch (err) {
        console.warn('[email] Task assigned notification failed:', err);
      }
    }

    return task;
  }

  async deleteTask(id: string) {
    await Task.findByIdAndDelete(id);
    await TimeEntry.deleteMany({ taskId: id });
  }

  async addSubtask(taskId: string, data: { title: string; assignedTo?: string }) {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError('Task not found', 404);
    task.subtasks.push({ title: data.title, assignedTo: data.assignedTo as any, createdAt: new Date(), done: false });
    await task.save();
    return task;
  }

  async updateSubtask(taskId: string, subtaskId: string, data: any) {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError('Task not found', 404);
    const subtask = (task.subtasks as any).id(subtaskId);
    if (!subtask) throw new AppError('Subtask not found', 404);
    Object.assign(subtask, data);
    await task.save();
    return task;
  }

  async deleteSubtask(taskId: string, subtaskId: string) {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError('Task not found', 404);
    (task.subtasks as any).pull({ _id: subtaskId });
    await task.save();
    return task;
  }

  // Sprints
  async getSprints(projectId: string) {
    return Sprint.find({ projectId }).sort({ startDate: -1 });
  }

  async createSprint(data: any) {
    return Sprint.create(data);
  }

  async updateSprint(id: string, data: any) {
    const sprint = await Sprint.findByIdAndUpdate(id, data, { new: true });
    if (!sprint) throw new AppError('Sprint not found', 404);
    return sprint;
  }

  async deleteSprint(id: string) {
    await Sprint.findByIdAndDelete(id);
    await Task.updateMany({ sprintId: id }, { sprintId: null });
  }

  // Time entries
  async getTimeEntries(filters: any = {}, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
      TimeEntry.find(filters)
        .populate('userId', 'name email')
        .populate('taskId', 'title')
        .populate('projectId', 'title')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      TimeEntry.countDocuments(filters),
    ]);
    return { entries, total, page, totalPages: Math.ceil(total / limit) };
  }

  async createTimeEntry(data: any) {
    return TimeEntry.create(data);
  }

  async deleteTimeEntry(id: string) {
    await TimeEntry.findByIdAndDelete(id);
  }

  async getTimeStats(projectId?: string, userId?: string) {
    const match: any = {};
    if (projectId) match.projectId = projectId;
    if (userId) match.userId = userId;

    const stats = await TimeEntry.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalHours: { $sum: '$hours' },
          billableHours: { $sum: { $cond: ['$billable', '$hours', 0] } },
          count: { $sum: 1 },
        },
      },
    ]);

    const byUser = await TimeEntry.aggregate([
      { $match: match },
      { $group: { _id: '$userId', totalHours: { $sum: '$hours' }, count: { $sum: 1 } } },
      { $sort: { totalHours: -1 } },
      { $limit: 10 },
    ]);

    return {
      totalHours: stats[0]?.totalHours || 0,
      billableHours: stats[0]?.billableHours || 0,
      totalEntries: stats[0]?.count || 0,
    };
  }
}

export const taskService = new TaskService();
