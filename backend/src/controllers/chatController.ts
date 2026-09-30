import { Response, NextFunction } from 'express';
import { ChatService } from '../services/chatService';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export class ChatController {
  public static async handleChat(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { messages } = req.body;
      const responseText = await ChatService.processChat(req.user!, messages);
      
      return sendSuccess(res, { role: 'assistant', content: responseText }, 'Chat response generated');
    } catch (error) {
      next(error);
    }
  }
}
