import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, of } from 'rxjs';

export interface RegisterRequest {
  employeeName: string;
  employeeId: string;
  email: string;
  department: string;
  role: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  employeeName: string;
  employeeId: string;
  email: string;
  department: string;
  departmentId?: string | null;
  verticalId?: string | null;
  phone: string;
  role: string;
  superAdmin?: boolean;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  verified: boolean;
  message: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = 'http://localhost:3000/api/auth';
  private readonly tokenKey = 'rflow_auth_token';
  private readonly userKey = 'rflow_auth_user';
  private readonly currentUserSubject = new BehaviorSubject<AuthUser | null>(this.getStoredUser());

  readonly currentUser$ = this.currentUserSubject.asObservable();

  register(payload: RegisterRequest): Observable<ApiResponse<{ user: AuthUser }>> {
    return this.http.post<ApiResponse<{ user: AuthUser }>>(`${this.apiUrl}/register`, payload);
  }

  login(payload: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    // FAKE LOGIN BYPASS FOR GITHUB PAGES DEMO
    if (payload.email === 'admin@motherson.com' && payload.password === 'Password123') {
      const mockUser: AuthUser = {
        id: 'mock-admin-id',
        employeeName: 'Admin User',
        employeeId: 'ADM-001',
        email: 'admin@motherson.com',
        department: 'Engineering Demo Dept',
        phone: '555-0101',
        role: 'admin',
        superAdmin: true,
        status: 'active'
      };
      const mockResponse: ApiResponse<LoginResponse> = {
        success: true,
        message: 'Mock login successful',
        data: {
          token: 'mock-jwt-token-12345',
          user: mockUser
        }
      };
      return of(mockResponse).pipe(
        tap((response) => {
          this.setSession(response.data.token, response.data.user);
        })
      );
    }

    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/login`, payload).pipe(
      tap((response) => {
        this.setSession(response.data.token, response.data.user);
      })
    );
  }

  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${this.apiUrl}/forgot-password`, { email });
  }

  verifyOtp(email: string, otp: string): Observable<VerifyOtpResponse> {
    return this.http.post<VerifyOtpResponse>(`${this.apiUrl}/verify-otp`, { email, otp });
  }

  resetPassword(email: string, newPassword: string): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(`${this.apiUrl}/reset-password`, { email, newPassword });
  }

  profile(): Observable<ApiResponse<{ user: AuthUser }>> {
    return this.http.get<ApiResponse<{ user: AuthUser }>>(`${this.apiUrl}/profile`).pipe(
      tap((response) => this.setUser(response.data.user))
    );
  }

  getUsers(role?: string): Observable<ApiResponse<AuthUser[]>> {
    let url = 'http://localhost:3000/api/users';
    if (role) {
      url += `?role=${role}`;
    }
    return this.http.get<ApiResponse<AuthUser[]>>(url);
  }

  getUsersAll(): Observable<ApiResponse<AuthUser[]>> {
    return this.http.get<ApiResponse<AuthUser[]>>('http://localhost:3000/api/users/all');
  }

  assignUserDepartment(userId: string, departmentId: string | null, departmentName?: string, verticalId?: string | null): Observable<ApiResponse<AuthUser>> {
    return this.http.put<ApiResponse<AuthUser>>(
      `http://localhost:3000/api/users/${userId}/department`,
      { departmentId, departmentName, verticalId }
    );
  }

  updateUserRole(userId: string, role: string): Observable<ApiResponse<AuthUser>> {
    return this.http.put<ApiResponse<AuthUser>>(
      `http://localhost:3000/api/users/${userId}/role`,
      { role }
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private setSession(token: string, user: AuthUser): void {
    localStorage.setItem(this.tokenKey, token);
    this.setUser(user);
  }

  private setUser(user: AuthUser): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private getStoredUser(): AuthUser | null {
    const userJson = localStorage.getItem(this.userKey);

    if (!userJson) {
      return null;
    }

    try {
      return JSON.parse(userJson) as AuthUser;
    } catch {
      localStorage.removeItem(this.userKey);
      return null;
    }
  }
}
