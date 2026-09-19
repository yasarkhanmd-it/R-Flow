import { Request, Response } from 'express';
import * as ganttService from '../services/gantt.service';

export const getGanttData = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const data = await ganttService.getGanttData(projectId);
    res.json({ success: true, data });
  } catch (error: any) {
    const status = error.message === 'Project not found' ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
