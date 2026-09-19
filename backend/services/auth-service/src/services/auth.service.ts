import bcrypt from 'bcryptjs';
import { userRepo } from '../repo/userrepo';
import { generateToken } from '../../../../common/auth/jwt';
import { IUser } from '../models/userModel';

const COMPANY_EMAIL_DOMAIN = (process.env.COMPANY_EMAIL_DOMAIN || 'motherson.com').toLowerCase();
const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 12);

const normalizeEmail = (email = '') => email.trim().toLowerCase();
const normalizeEmployeeId = (employeeId = '') => employeeId.trim().toUpperCase();

const isCompanyEmail = (email: string) => {
  if (!email) return false;
  const norm = normalizeEmail(email);
  return norm.endsWith(`@${COMPANY_EMAIL_DOMAIN}`) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(norm);
};

export const buildUserResponse = (user: IUser) => ({
  id: user._id,
  employeeName: user.employeeName,
  employeeId: user.employeeId,
  email: user.email,
  department: user.department,
  departmentId: user.departmentId || null,
  verticalId: user.verticalId || null,
  phone: user.phone,
  role: (user.role as string) === 'Employee' ? 'User' : user.role,
  superAdmin: user.superAdmin || false,
  status: user.status,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const validateRegistration = (payload: any) => {
  const errors: string[] = [];

  if (!payload.employeeName?.trim()) errors.push('Employee Name is required');
  if (!payload.employeeId?.trim()) errors.push('Employee ID is required');
  if (!payload.email?.trim()) errors.push('Office Email is required');
  if (payload.email && !isCompanyEmail(payload.email)) {
    errors.push(`Please enter a valid email address`);
  }
  if (!payload.department?.trim()) errors.push('Department is required');
  if (!payload.role?.trim() || !['Admin', 'User', 'Lead', 'Manager'].includes(payload.role)) {
    errors.push('A valid Role (Admin, User, Lead, Manager) is required');
  }
  if (!payload.password) errors.push('Password is required');
  if (payload.password !== payload.confirmPassword) {
    errors.push('Password and Confirm Password do not match');
  }
  if (payload.phone && !/^[0-9]{10}$/.test(payload.phone.trim())) {
    errors.push('Phone number must be 10 digits');
  }

  return errors;
};

export const registerUser = async (payload: any) => {
  const validationErrors = validateRegistration(payload);

  if (validationErrors.length) {
    const error: any = new Error('Validation failed');
    error.statusCode = 400;
    error.details = validationErrors;
    throw error;
  }

  const email = normalizeEmail(payload.email);
  const employeeId = normalizeEmployeeId(payload.employeeId);

  const [existingEmail, existingEmployeeId] = await Promise.all([
    userRepo.findByEmail(email),
    userRepo.findByEmployeeId(employeeId)
  ]);

  if (existingEmail) {
    const error: any = new Error('Email already exists');
    error.statusCode = 409;
    throw error;
  }

  if (existingEmployeeId) {
    const error: any = new Error('Employee ID already exists');
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(payload.password, BCRYPT_SALT_ROUNDS);

  const user = await userRepo.createUser({
    employeeName: payload.employeeName.trim(),
    employeeId,
    email,
    department: payload.department.trim(),
    phone: payload.phone?.trim() || '',
    password: hashedPassword,
    role: payload.role.trim(),
    status: 'Approved'
  });

  return buildUserResponse(user);
};

export const loginUser = async ({ email, password }: any) => {
  if (!email?.trim() || !password) {
    const error: any = new Error('Office Email and Password are required');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = normalizeEmail(email);

  if (!isCompanyEmail(normalizedEmail)) {
    const error: any = new Error(`Only company email addresses ending with @${COMPANY_EMAIL_DOMAIN} are allowed`);
    error.statusCode = 400;
    throw error;
  }

  const user = await userRepo.findByEmail(normalizedEmail, true);

  if (!user || !user.password) {
    const error: any = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  if (user.status !== 'Approved') {
    const error: any = new Error(`Account is ${user.status}. Please contact your manager or administrator.`);
    error.statusCode = 403;
    throw error;
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    const error: any = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken({
    _id: user._id?.toString(),
    id: user._id?.toString(),
    employeeId: user.employeeId,
    employeeName: user.employeeName,
    email: user.email,
    role: user.role,
    departmentId: user.departmentId?.toString() || null,
    verticalId: user.verticalId?.toString() || null,
    superAdmin: user.superAdmin || false,
    status: user.status
  });

  return {
    token,
    user: buildUserResponse(user)
  };
};
