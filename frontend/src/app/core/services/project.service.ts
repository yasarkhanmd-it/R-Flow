import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface Project {
  _id: string;
  name: string;
  description: string;
  projectCode?: string;
  managerId: { _id: string; employeeName: string };
  members: { _id: string; employeeName: string }[];
  status: string;
  leadId?: { _id: string; employeeName: string };
  verticalId?: { _id: string; name: string } | string;
  departmentIds?: { _id: string; departmentName: string; departmentCode: string }[];
  startDate?: string;
  assignedDate?: string;
  expectedEndDate?: string;
  rejectionReason?: string;
  budget?: number;
  teamSize?: number;
  hoursAllocated?: number;
  hoursUsed?: number;
  actualCost?: number;
  committedCost?: number;
  retentionHoldback?: number;
  revenue?: number;
  otherCashInflow?: number;
  otherCashOutflow?: number;
  createdAt: string;
}

export interface ProjectOverview {
  project: Project;
  taskStats: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    progressPercentage: number;
  };
  moduleCount: number;
  milestoneCount: number;
  milestoneStats?: {
    total: number;
    completed: number;
    inProgress: number;
    delayed: number;
    notStarted: number;
  };
  openRisksCount: number;
  openIssuesCount: number;
  criticalIssuesCount: number;
  pendingChangeRequestsCount: number;
  approvedChangeRequestsCount: number;
  bomStats?: {
    totalBoms: number;
    totalBomEstimatedCost: number;
  };
  financialStats?: {
    budget: number;
    actualCost: number;
    committedCost: number;
    realizedRevenue: number;
    expectedRevenue: number;
    variance: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/projects';

  getProjects(): Observable<ApiResponse<Project[]>> {
    return this.http.get<ApiResponse<Project[]>>(this.apiUrl);
  }

  getProjectOverview(projectId: string): Observable<ApiResponse<ProjectOverview>> {
    return this.http.get<ApiResponse<ProjectOverview>>(`${this.apiUrl}/${projectId}/overview`);
  }

  createProject(payload: any): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(this.apiUrl, payload);
  }

  requestJoin(projectId: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${projectId}/request`, {});
  }

  deleteProject(projectId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${projectId}`);
  }

  updateProject(projectId: string, payload: any): Observable<ApiResponse<Project>> {
    return this.http.put<ApiResponse<Project>>(`${this.apiUrl}/${projectId}`, payload);
  }

  acceptProject(projectId: string): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(`${this.apiUrl}/${projectId}/accept`, {});
  }

  rejectProject(projectId: string, reason: string): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(`${this.apiUrl}/${projectId}/reject`, { reason });
  }

  addMember(projectId: string, userId: string): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(`${this.apiUrl}/${projectId}/members`, { userId });
  }

  removeMember(projectId: string, memberId: string): Observable<ApiResponse<Project>> {
    return this.http.delete<ApiResponse<Project>>(`${this.apiUrl}/${projectId}/members/${memberId}`);
  }
}
