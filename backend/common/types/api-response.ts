export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  count: number;
}

export interface AuthUserPayload {
  id: string;
  _id?: string;
  employeeId?: string;
  employeeName?: string;
  email?: string;
  role: 'Manager' | 'Lead' | 'Employee' | 'User';
  status: 'Pending' | 'Approved' | 'Rejected';
}
