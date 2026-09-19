import { Request, Response } from 'express';
import { registerUser, loginUser, buildUserResponse } from '../services/auth.service';

export const register = async (req: Request, res: Response) => {
  try {
    const user = await registerUser(req.body);

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Account approved for testing.',
      data: { user }
    });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Registration failed',
      errors: error.details || undefined
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const result = await loginUser(req.body);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
};

export const profile = async (req: Request | any, res: Response) => {
  return res.status(200).json({
    success: true,
    message: 'Profile fetched successfully',
    data: {
      user: buildUserResponse(req.user)
    }
  });
};
