import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { IncidentService } from '../services/incidentService';

export const incidentController = {
  createIncident: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = req.body;
      const adminId = req.user!.id;

      const incident = await IncidentService.createIncident(data, adminId);
      res.status(201).json({ success: true, data: incident });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getActiveIncidents: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const incidents = await IncidentService.getActiveIncidents();
      res.json({ success: true, data: incidents });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getIncident: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const incident = await IncidentService.getIncidentById(req.params.id);
      res.json({ success: true, data: incident });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  },

  linkComplaints: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { complaintIds } = req.body;
      const incident = await IncidentService.linkComplaints(req.params.id, complaintIds, req.user!.id);
      res.json({ success: true, data: incident });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  resolveIncident: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { cascade } = req.body; // boolean
      const incident = await IncidentService.resolveIncident(req.params.id, !!cascade, req.user!.id);
      res.json({ success: true, data: incident });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
};
