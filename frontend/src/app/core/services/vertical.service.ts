import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface Vertical {
  _id: string;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
  departmentCount?: number;
  projectCount?: number;
  totalBudget?: number;
}

export interface VerticalDepartment {
  _id: string;
  departmentName: string;
  departmentCode: string;
  description: string;
  verticalId: { _id: string; name: string } | string;
  managerIds: { _id: string; employeeName: string; employeeId: string; email: string }[];
  status: 'Active' | 'Inactive';
  projectCount?: number;
  userCount?: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class VerticalService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/verticals';

  getVerticals(): Observable<ApiResponse<Vertical[]>> {
    return this.http.get<ApiResponse<Vertical[]>>(this.apiUrl);
  }

  getVerticalById(id: string): Observable<ApiResponse<Vertical>> {
    return this.http.get<ApiResponse<Vertical>>(`${this.apiUrl}/${id}`);
  }

  getVerticalDepartments(id: string): Observable<ApiResponse<VerticalDepartment[]>> {
    return this.http.get<ApiResponse<VerticalDepartment[]>>(`${this.apiUrl}/${id}/departments`);
  }

  createVertical(payload: Partial<Vertical>): Observable<ApiResponse<Vertical>> {
    return this.http.post<ApiResponse<Vertical>>(this.apiUrl, payload);
  }

  updateVertical(id: string, payload: Partial<Vertical>): Observable<ApiResponse<Vertical>> {
    return this.http.put<ApiResponse<Vertical>>(`${this.apiUrl}/${id}`, payload);
  }

  deleteVertical(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }
}
