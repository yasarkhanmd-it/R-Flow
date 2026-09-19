import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface Department {
  _id: string;
  departmentName: string;
  departmentCode: string;
  description: string;
  verticalId?: { _id: string; name: string } | string;
  managerIds?: { _id: string; employeeName: string; employeeId: string; email: string }[];
  // Legacy field — may still appear on older records
  managerId?: { _id: string; employeeName: string; employeeId: string; email: string };
  status: 'Active' | 'Inactive';
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  // Live stats
  projectCount?: number;
  taskCount?: number;
  resourceCount?: number;
  employeeCount?: number;
  teamLeadCount?: number;
  completedProjects?: number;
}

export interface DepartmentUser {
  _id: string;
  employeeName: string;
  employeeId: string;
  email: string;
  role: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/departments';

  getDepartments(): Observable<ApiResponse<Department[]>> {
    return this.http.get<ApiResponse<Department[]>>(this.apiUrl);
  }

  getDepartmentById(id: string): Observable<ApiResponse<Department>> {
    return this.http.get<ApiResponse<Department>>(`${this.apiUrl}/${id}`);
  }

  createDepartment(payload: Partial<Department> & { verticalId?: string }): Observable<ApiResponse<Department>> {
    return this.http.post<ApiResponse<Department>>(this.apiUrl, payload);
  }

  updateDepartment(id: string, payload: Partial<Department>): Observable<ApiResponse<Department>> {
    return this.http.put<ApiResponse<Department>>(`${this.apiUrl}/${id}`, payload);
  }

  deleteDepartment(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  getDepartmentProjects(id: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/${id}/projects`);
  }

  getDepartmentUsers(id: string): Observable<ApiResponse<DepartmentUser[]>> {
    return this.http.get<ApiResponse<DepartmentUser[]>>(`${this.apiUrl}/${id}/users`);
  }

  assignManagers(id: string, managerIds: string[]): Observable<ApiResponse<Department>> {
    return this.http.put<ApiResponse<Department>>(`${this.apiUrl}/${id}/managers`, { managerIds });
  }
}
