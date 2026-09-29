import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { FeedbackService } from '../services/feedbackService';

export const feedbackController = {
  submitFeedback: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { complaintId } = req.params;
      const { rating, comment } = req.body;
      const studentId = req.user!.id;

      if (!rating || typeof rating !== 'number') {
        return res.status(400).json({ success: false, message: 'Valid rating is required' });
      }

      const feedback = await FeedbackService.submitFeedback(complaintId, studentId, rating, comment);
      res.status(201).json({ success: true, data: feedback });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getFeedback: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { complaintId } = req.params;
      const feedback = await FeedbackService.getFeedbackByComplaint(complaintId);
      
      if (!feedback) {
        return res.status(404).json({ success: false, message: 'Feedback not found' });
      }

      res.json({ success: true, data: feedback });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getTechnicianPerformance: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { technicianId } = req.params;
      const performance = await FeedbackService.getTechnicianPerformance(technicianId);
      res.json({ success: true, data: performance });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
