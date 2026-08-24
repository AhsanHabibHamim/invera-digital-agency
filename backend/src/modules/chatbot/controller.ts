import { Request, Response, NextFunction } from 'express';
import { chat, captureLeadIfIntent } from './service';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';

export class ChatbotController {
  async message(req: Request, res: Response, next: NextFunction) {
    try {
      const { messages, page } = req.body as {
        messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
        page?: string;
      };

      if (!Array.isArray(messages) || messages.length === 0) {
        throw new AppError('messages array is required', 400);
      }
      if (messages.length > 24) throw new AppError('Conversation too long', 400);

      const sanitized = messages
        .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));

      const { reply } = await chat(sanitized);

      // Fire-and-forget lead capture
      void captureLeadIfIntent(sanitized, { page }).catch((err) =>
        console.warn('[chatbot] Lead capture failed:', err),
      );

      sendSuccess(res, { reply });
    } catch (error) {
      next(error);
    }
  }
}

export const chatbotController = new ChatbotController();
