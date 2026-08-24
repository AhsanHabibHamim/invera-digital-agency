import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import Message from '../modules/messages/model';
import Project from '../modules/projects/model';
import User from '../modules/users/model';
import Notification from '../modules/notifications/model';
import { verifyAccessToken } from '../utils/cookies';

let io: Server | null = null;

// userId -> Set<socketId>
const online = new Map<string, Set<string>>();

function canAccessProject(user: any, project: any): boolean {
  if (user.role === 'admin' || user.role === 'super_admin') return true;
  if (user.role === 'client') return project.clientId?.toString() === user.userId;
  if (user.role === 'team') {
    return (project.assignedTeam || []).some((t: any) => t.toString() === user.userId);
  }
  return false;
}

async function recipientIdsFor(project: any): Promise<string[]> {
  const ids = new Set<string>();
  if (project.clientId) ids.add(project.clientId.toString());
  for (const t of project.assignedTeam || []) ids.add(t.toString());
  // Admins always included so nothing falls through the cracks
  const admins = await User.find({ role: { $in: ['admin', 'super_admin'] }, isActive: true }).select('_id');
  for (const a of admins) ids.add(a._id.toString());
  return Array.from(ids);
}

export function initSocketServer(httpServer: HttpServer): Server {
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'https://inveradigitalagency.com', 'https://www.inveradigitalagency.com'];

  io = new Server(httpServer, {
    cors: { origin: allowedOrigins, credentials: true },
    maxHttpBufferSize: 5 * 1024 * 1024,
  });

  io.use(async (socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string) ||
        ((socket.handshake.headers.cookie || '')
          .split(';')
          .map((c) => c.trim())
          .find((c) => c.startsWith('accessToken='))
          ?.split('=')[1] || '');
      if (!token) return next(new Error('Unauthorized'));
      const payload = verifyAccessToken(token);
      if (!payload?.userId) return next(new Error('Unauthorized'));
      const user = await User.findById(payload.userId).select('name email role avatarUrl isActive');
      if (!user || !user.isActive) return next(new Error('Unauthorized'));
      (socket.data as any).user = {
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      };
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as {
      userId: string;
      name: string;
      email: string;
      role: string;
      avatarUrl?: string;
    };

    socket.on('presence:online', async () => {
      const sockets = online.get(user.userId) ?? new Set<string>();
      sockets.add(socket.id);
      online.set(user.userId, sockets);
      socket.broadcast.emit('presence:update', { userId: user.userId, online: true });
    });

    socket.on('project:join', async (projectId: string, ack?: (res: any) => void) => {
      try {
        const project = await Project.findById(projectId);
        if (!project || !canAccessProject(user, project)) {
          ack?.({ ok: false, error: 'Access denied' });
          return;
        }
        await socket.join(`project:${projectId}`);
        const sockets = online.get(user.userId) ?? new Set<string>();
        sockets.add(socket.id);
        online.set(user.userId, sockets);
        io?.to(`project:${projectId}`).emit('presence:update', { userId: user.userId, online: true });
        ack?.({ ok: true });
      } catch {
        ack?.({ ok: false, error: 'Join failed' });
      }
    });

    socket.on('project:leave', (projectId: string) => {
      void socket.leave(`project:${projectId}`);
    });

    socket.on(
      'message:send',
      async (
        data: { projectId: string; content: string; attachments?: string[]; replyTo?: string },
        ack?: (res: any) => void,
      ) => {
        try {
          const { projectId, content } = data;
          if (!content?.trim()) return ack?.({ ok: false, error: 'Empty message' });

          const project = await Project.findById(projectId);
          if (!project || !canAccessProject(user, project)) {
            return ack?.({ ok: false, error: 'Access denied' });
          }

          const message = await Message.create({
            projectId,
            senderId: user.userId,
            content: content.trim().slice(0, 4000),
            attachments: (data.attachments || []).slice(0, 10),
            ...(data.replyTo ? { replyTo: data.replyTo } : {}),
          });
          const populated = await message.populate('senderId', 'name email role avatarUrl');
          const plain = populated.toObject();

          io?.to(`project:${projectId}`).emit('message:new', plain);

          // Notifications + email fallback for offline recipients
          const recipients = (await recipientIdsFor(project)).filter((id) => id !== user.userId);
          for (const rid of recipients) {
            await Notification.create({
              userId: rid,
              type: 'new_message',
              message: `${user.name}: ${content.trim().slice(0, 80)}`,
              link:
                user.role === 'client'
                  ? `/dashboard/projects`
                  : `/client/projects/${projectId}`,
            });
          }

          const offlineRecipients = recipients.filter((rid) => !online.has(rid));
          if (offlineRecipients.length > 0 && content.trim().length > 0) {
            try {
              const { sendEmail } = await import('../services/email.service');
              const users = await User.find({ _id: { $in: offlineRecipients }, isActive: true }).select('email name');
              for (const u of users) {
                await sendEmail({
                  to: u.email,
                  subject: `New message in "${project.title}"`,
                  html: `<p>Hi ${u.name.split(' ')[0]},</p><p><strong>${user.name}</strong> sent you a message on <strong>${project.title}</strong>:</p><blockquote>${content.trim()}</blockquote><p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">Open your dashboard</a></p>`,
                });
              }
            } catch (err) {
              console.warn('[socket] Offline email fallback failed:', err);
            }
          }

          ack?.({ ok: true, message: plain });
        } catch (err) {
          console.error('[socket] message:send failed:', err);
          ack?.({ ok: false, error: 'Send failed' });
        }
      },
    );

    socket.on(
      'typing',
      (data: { projectId: string; isTyping: boolean }) => {
        socket.to(`project:${data.projectId}`).emit('typing:update', {
          projectId: data.projectId,
          userId: user.userId,
          name: user.name,
          isTyping: !!data.isTyping,
        });
      },
    );

    socket.on(
      'message:read',
      async (data: { projectId: string }, ack?: (res: any) => void) => {
        try {
          const project = await Project.findById(data.projectId);
          if (!project || !canAccessProject(user, project)) return ack?.({ ok: false });
          await Message.updateMany(
            { projectId: project._id, senderId: { $ne: user.userId }, isRead: false },
            { $set: { isRead: true } },
          );
          io?.to(`project:${data.projectId}`).emit('message:read', {
            projectId: data.projectId,
            userId: user.userId,
            at: new Date().toISOString(),
          });
          ack?.({ ok: true });
        } catch {
          ack?.({ ok: false });
        }
      },
    );

    socket.on('disconnect', () => {
      const sockets = online.get(user.userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          online.delete(user.userId);
          io?.emit('presence:update', { userId: user.userId, online: false });
        }
      }
    });
  });

  console.log('[socket] Real-time server initialized');
  return io;
}

export function getIO(): Server | null {
  return io;
}
