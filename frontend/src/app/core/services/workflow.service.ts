import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

// Simplified ProjectDepartment — no workflow/stage tracking
export interface ProjectDepartment {
  _id: string;
  projectId: string;
  departmentId: {
    _id: string;
    departmentName: string;
    departmentCode: string;
    verticalId?: { _id: string; name: string };
    managerIds?: { _id: string; employeeName: string; email: string }[];
  };
  addedAt: string;
}

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  private readonly http = inject(HttpClient);
  private readonly projectApiUrl = 'http://localhost:3000/api/projects';

  // ── Project-Department Management ────────────────────────────────────────
  getProjectDepartments(projectId: string): Observable<ApiResponse<ProjectDepartment[]>> {
    return this.http.get<ApiResponse<ProjectDepartment[]>>(`${this.projectApiUrl}/${projectId}/departments`);
  }

  addDepartmentToProject(projectId: string, departmentId: string): Observable<ApiResponse<ProjectDepartment>> {
    return this.http.post<ApiResponse<ProjectDepartment>>(`${this.projectApiUrl}/${projectId}/departments`, { departmentId });
  }

  removeDepartmentFromProject(projectId: string, departmentId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.projectApiUrl}/${projectId}/departments/${departmentId}`);
  }
}
