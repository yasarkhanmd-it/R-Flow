export const sendSuccess = (res: any, data: any = null, message?: string, statusCode: number = 200) => {
  return res.status(statusCode).json({
    success: true,
    ...(message ? { message } : {}),
    ...(data !== null ? { data } : {})
  });
};

export const sendError = (res: any, message: string = 'An error occurred', statusCode: number = 500) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};
