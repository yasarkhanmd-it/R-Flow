import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface Module {
  _id: string;
  projectId: string | any;
  name: string;
  description: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'In Progress' | 'Completed' | 'Closed';
  createdBy: any;
  progress: number;
  taskCount?: number;
  dueDate?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ModuleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api';

  getModules(projectId: string): Observable<ApiResponse<Module[]>> {
    return this.http.get<ApiResponse<Module[]>>(`${this.apiUrl}/projects/${projectId}/modules`);
  }

  getAllModules(): Observable<ApiResponse<Module[]>> {
    return this.http.get<ApiResponse<Module[]>>(`${this.apiUrl}/modules`);
  }

  getModuleById(moduleId: string): Observable<ApiResponse<Module>> {
    return this.http.get<ApiResponse<Module>>(`${this.apiUrl}/modules/${moduleId}`);
  }

  createModule(payload: any): Observable<ApiResponse<Module>> {
    return this.http.post<ApiResponse<Module>>(`${this.apiUrl}/modules`, payload);
  }

  updateModule(moduleId: string, payload: any): Observable<ApiResponse<Module>> {
    return this.http.put<ApiResponse<Module>>(`${this.apiUrl}/modules/${moduleId}`, payload);
  }

  deleteModule(moduleId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/modules/${moduleId}`);
  }

  approveModule(moduleId: string): Observable<ApiResponse<Module>> {
    return this.http.post<ApiResponse<Module>>(`${this.apiUrl}/modules/${moduleId}/approve`, {});
  }

  rejectModule(moduleId: string, reason: string): Observable<ApiResponse<Module>> {
    return this.http.post<ApiResponse<Module>>(`${this.apiUrl}/modules/${moduleId}/reject`, { reason });
  }
}
