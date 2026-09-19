import jwt from 'jsonwebtoken';

const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || 'rflow_super_secret_jwt_key_2026';
};

export const generateToken = (payload: { id: string; role: string; status: string; [key: string]: any }): string => {
  return jwt.sign(
    payload,
    getJwtSecret(),
    { expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as any }
  );
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, getJwtSecret());
};
