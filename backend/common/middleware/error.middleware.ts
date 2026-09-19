import { logger } from '../logger/logger';

export const errorHandler = (err: any, req: any, res: any, next: any) => {
  logger.error(`${req.method} ${req.url} - ${err.message}`, err);

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
};
