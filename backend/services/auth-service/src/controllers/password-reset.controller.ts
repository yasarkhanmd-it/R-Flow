import { Request, Response } from 'express';
import * as passwordResetService from '../services/password-reset.service';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Office email is required.'
      });
    }

    // Always call the service – it handles missing email silently
    await passwordResetService.forgotPassword(email);

    return res.status(200).json({
      success: true,
      message: 'If the account exists, an OTP has been generated. Please check your console (dev mode).'
    });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to process forgot password request.'
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/verify-otp
// ─────────────────────────────────────────────────────────────────────────────
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    if (!otp?.trim()) {
      return res.status(400).json({ success: false, message: 'OTP is required.' });
    }
    if (!/^\d{6}$/.test(otp.trim())) {
      return res.status(400).json({ success: false, message: 'OTP must be exactly 6 digits.' });
    }

    await passwordResetService.verifyOtp(email, otp.trim());

    return res.status(200).json({
      success: true,
      verified: true,
      message: 'OTP verified successfully.'
    });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      verified: false,
      message: error.message || 'OTP verification failed.'
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password
// ─────────────────────────────────────────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    if (!newPassword) {
      return res.status(400).json({ success: false, message: 'New password is required.' });
    }

    await passwordResetService.resetPassword(email, newPassword);

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. Please log in with your new password.'
    });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Password reset failed.'
    });
  }
};
