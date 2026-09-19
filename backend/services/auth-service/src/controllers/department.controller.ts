import { Request, Response } from 'express';

export const getDepartments = (req: Request, res: Response) => {
  res.json({ success: true, message: 'List of departments', data: ['IT', 'Engineering', 'Operations', 'Product'] });
};
