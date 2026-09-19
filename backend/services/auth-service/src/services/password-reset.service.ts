import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { userRepo } from '../repo/userrepo';

const OTP_EXPIRY_MINUTES = 5;
const MAX_OTP_ATTEMPTS = 5;
const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 12);

const normalizeEmail = (email = '') => email.trim().toLowerCase();

/** Generate a cryptographically secure 6-digit OTP */
const generateOtp = (): string => {
  const num = crypto.randomInt(0, 1_000_000);
  return num.toString().padStart(6, '0');
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────────────────────────────────────
export const forgotPassword = async (email: string): Promise<void> => {
  const normalized = normalizeEmail(email);

  // Always respond the same way – never reveal whether email exists
  const user = await userRepo.findByEmailWithOtp(normalized);

  if (!user) {
    // Silently return – response is the same generic message
    return;
  }

  const plainOtp = generateOtp();

  // ── DEV MODE: Print plain OTP BEFORE hashing – easy to swap with SMTP later ──
  console.log('\n====================================');
  console.log('     Forgot Password Request');
  console.log('====================================');
  console.log('User:');
  console.log(normalized);
  console.log('');
  console.log('Generated OTP:');
  console.log(plainOtp);
  console.log('');
  console.log('Expires:');
  console.log(`${OTP_EXPIRY_MINUTES} Minutes`);
  console.log('====================================\n');

  // Hash AFTER logging – plain OTP is never stored in MongoDB
  const hashedOtp = await bcrypt.hash(plainOtp, BCRYPT_SALT_ROUNDS);
  const expiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await userRepo.updateByEmail(normalized, {
    resetOtp: hashedOtp,
    resetOtpExpiry: expiry,
    otpVerified: false,
    otpAttempts: 0
  } as any);
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/verify-otp
// ─────────────────────────────────────────────────────────────────────────────
export const verifyOtp = async (email: string, otp: string): Promise<void> => {
  const normalized = normalizeEmail(email);

  const user = await userRepo.findByEmailWithOtp(normalized);

  if (!user || !user.resetOtp || !user.resetOtpExpiry) {
    const err: any = new Error('No OTP request found. Please request a new OTP.');
    err.statusCode = 400;
    throw err;
  }

  // Check attempt limit
  const attempts = user.otpAttempts ?? 0;
  if (attempts >= MAX_OTP_ATTEMPTS) {
    const err: any = new Error('OTP has been invalidated after too many failed attempts. Please request a new OTP.');
    err.statusCode = 400;
    throw err;
  }

  // Check expiry
  if (new Date() > user.resetOtpExpiry) {
    // Clear OTP on expiry
    await userRepo.updateByEmail(normalized, {
      resetOtp: undefined,
      resetOtpExpiry: undefined,
      otpVerified: false,
      otpAttempts: 0
    } as any);
    const err: any = new Error('OTP has expired. Please request a new OTP.');
    err.statusCode = 400;
    throw err;
  }

  // Verify OTP hash
  const isMatch = await bcrypt.compare(otp, user.resetOtp);

  if (!isMatch) {
    const newAttempts = attempts + 1;
    const updateData: any = { otpAttempts: newAttempts };

    if (newAttempts >= MAX_OTP_ATTEMPTS) {
      // Invalidate OTP
      updateData.resetOtp = undefined;
      updateData.resetOtpExpiry = undefined;
      updateData.otpVerified = false;
    }

    await userRepo.updateByEmail(normalized, updateData);

    const remaining = MAX_OTP_ATTEMPTS - newAttempts;
    const err: any = new Error(
      newAttempts >= MAX_OTP_ATTEMPTS
        ? 'OTP has been invalidated after too many failed attempts. Please request a new OTP.'
        : `Invalid OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
    );
    err.statusCode = 400;
    throw err;
  }

  // OTP valid – mark as verified, reset attempt counter
  await userRepo.updateByEmail(normalized, {
    otpVerified: true,
    otpAttempts: 0
  } as any);
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password
// ─────────────────────────────────────────────────────────────────────────────
export const resetPassword = async (email: string, newPassword: string): Promise<void> => {
  const normalized = normalizeEmail(email);

  // ── PASSWORD VALIDATION (Relaxed mode: min 6 chars) ──────────────────────
  // To re-enable strict mode, change PASSWORD_MIN_LENGTH and uncomment the regex block.
  const PASSWORD_MIN_LENGTH = 6;

  if (!newPassword || newPassword.length < PASSWORD_MIN_LENGTH) {
    const err: any = new Error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
    err.statusCode = 400;
    throw err;
  }

  // Strict mode regex – uncomment when ready:
  // const passwordRules = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
  // if (!passwordRules.test(newPassword)) {
  //   const err: any = new Error('Password must contain uppercase, lowercase, number, and special character.');
  //   err.statusCode = 400;
  //   throw err;
  // }

  const user = await userRepo.findByEmailWithOtp(normalized);

  if (!user) {
    const err: any = new Error('Invalid request.');
    err.statusCode = 400;
    throw err;
  }

  if (!user.otpVerified) {
    const err: any = new Error('OTP has not been verified. Please complete OTP verification first.');
    err.statusCode = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

  // Update password and clear all OTP fields atomically
  await userRepo.updateByEmail(normalized, {
    password: hashedPassword,
    resetOtp: undefined,
    resetOtpExpiry: undefined,
    otpVerified: false,
    otpAttempts: 0
  } as any);

  console.log(`\n[Auth Service] Password successfully reset for: ${normalized}\n`);
};
