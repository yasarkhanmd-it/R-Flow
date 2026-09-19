import { verifyToken } from '../auth/jwt';

export const protect = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is required'
      });
    }

    const decoded: any = verifyToken(token);
    
    req.user = decoded;
    req.headers['x-user-id'] = decoded.id || decoded._id;
    req.headers['x-user-role'] = decoded.role;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token'
    });
  }
};
