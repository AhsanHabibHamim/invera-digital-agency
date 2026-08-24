import Project from '../modules/projects/model';
import Invoice from '../modules/invoices/model';
import Task from '../modules/tasks/task.model';
import Notification from '../modules/notifications/model';
import User from '../modules/users/model';
import { settingsService } from '../modules/settings/service';
import { sendInvoiceCreatedEmail } from './email.service';
import { env } from '../config/env';

function generateInvoiceNumber(): string {
  return `INV-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

/**
 * Populate a freshly created project from the configured template that best
 * matches the project/service title. Creates milestone structure with spaced
 * due dates plus default tasks, then auto-assigns available team members.
 */
export async function applyProjectAutomation(projectId: string): Promise<void> {
  const project = await Project.findById(projectId);
  if (!project) return;

  const automation = await settingsService.getAutomationConfig();
  if (!automation.applyProjectTemplate || automation.templates.length === 0) return;

  // Match template by service key contained in the title or explicit service key.
  const haystack = `${project.title}`.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const template =
    automation.templates.find((t) => haystack.includes(t.serviceKey)) ??
    automation.templates[0];

  if (!template || template.milestones.length === 0) return;

  let cursorDays = 0;
  for (const m of template.milestones) {
    cursorDays += m.offsetDays;
    (project.milestones as any).push({
      title: m.title,
      dueDate: new Date(Date.now() + cursorDays * 24 * 60 * 60 * 1000),
      done: false,
    });
  }
  await project.save();

  // Default tasks under the first milestone's parent context (standalone tasks
  // referencing the project).
  const firstTasks = template.milestones[0]?.tasks ?? [];
  for (const taskTitle of firstTasks) {
    await Task.create({
      projectId: project._id,
      title: taskTitle,
      status: 'todo',
      type: 'feature',
      priority: 'medium',
      createdBy: project.clientId,
    });
  }

  // Auto-assign team by availability (fewest active assigned tasks first).
  if (project.assignedTeam.length === 0 && !automation.salesAssigneeIds.length) {
    await autoAssignTeam(project);
  } else if (project.assignedTeam.length === 0) {
    await autoAssignTeam(project);
  }

  await notifyAssignment(project);
}

async function autoAssignTeam(project: any): Promise<void> {
  const candidates = await User.find({
    role: { $in: ['team', 'admin'] },
    isActive: true,
  })
    .select('_id name')
    .limit(10);
  if (candidates.length === 0) return;

  const load = await Promise.all(
    candidates.map(async (u) => ({
      id: u._id.toString(),
      count: await Task.countDocuments({ assignedTo: u._id, status: { $ne: 'done' } }),
    })),
  );
  load.sort((a, b) => a.count - b.count);
  project.assignedTeam = [load[0].id as any];
  await project.save();
}

async function notifyAssignment(project: any): Promise<void> {
  const populated = await Project.findById(project._id).populate('assignedTeam', 'name email');
  const team = (populated?.assignedTeam ?? []) as any[];
  for (const member of team) {
    await Notification.create({
      userId: member._id,
      type: 'team_assigned',
      message: `You have been auto-assigned to project "${project.title}"`,
      link: `/dashboard/projects`,
    });
  }
}

/**
 * Called after a milestone is toggled done/undone.
 * - Milestone-based billing: auto-generate an invoice when enabled in settings.
 * - Completion detection: all milestones done -> project completed + review email.
 */
export async function onMilestoneCompletionChanged(
  projectId: string,
  milestoneTitle: string,
  nowDone: boolean,
  actorUserId?: string,
): Promise<{ invoiceCreated?: boolean; projectCompleted?: boolean }> {
  const project = await Project.findById(projectId);
  if (!project) return {};

  const result: { invoiceCreated?: boolean; projectCompleted?: boolean } = {};
  const automation = await settingsService.getAutomationConfig();

  // Milestone billing
  if (nowDone && automation.milestoneBilling) {
    const alreadyInvoiced = await Invoice.findOne({
      projectId: project._id,
      'notes': { $regex: `Milestone: ${milestoneTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` },
    });
    if (!alreadyInvoiced) {
      const template = automation.templates.find((t) =>
        t.milestones.some((m) => m.title === milestoneTitle),
      );
      const amount = template?.milestones.find((m) => m.title === milestoneTitle)?.amount ?? 0;
      const invoice = await Invoice.create({
        clientId: project.clientId,
        projectId: project._id,
        invoiceNumber: generateInvoiceNumber(),
        lineItems: [{ description: `Milestone — ${milestoneTitle}`, qty: 1, price: amount }],
        total: amount,
        status: 'sent',
        notes: `Milestone: ${milestoneTitle} (auto-generated)`,
      });

      await Notification.create({
        userId: project.clientId,
        type: 'invoice_created',
        message: `Invoice #${invoice.invoiceNumber} generated for milestone "${milestoneTitle}"`,
        link: `/client/invoices/${invoice._id}`,
      });

      const client = await User.findById(project.clientId).select('name email');
      if (client?.email) {
        await sendInvoiceCreatedEmail(
          client.email,
          client.name,
          invoice.invoiceNumber,
          invoice.total,
          `${env.frontendUrl}/client/invoices/${invoice._id}`,
        );
      }
      result.invoiceCreated = true;
    }
  }

  // Full completion detection
  const allMilestones = project.milestones.length > 0;
  const everythingDone = project.milestones.length > 0 && project.milestones.every((m) => m.done);
  if (allMilestones && everythingDone && project.status !== 'completed') {
    project.status = 'completed';
    await project.save();
    result.projectCompleted = true;

    await Notification.create({
      userId: project.clientId,
      type: 'project_status',
      message: `Project "${project.title}" has been completed! We would love your feedback.`,
      link: `/client/projects/${project._id}`,
    });

    const client = await User.findById(project.clientId).select('name email');
    if (client?.email) {
      const { sendReviewRequestEmail } = await import('./email.service');
      await sendReviewRequestEmail(
        client.email,
        client.name,
        project.title,
        `${env.frontendUrl}/client/reviews/new?project=${project._id}`,
      );
    }
  }

  return result;
}
