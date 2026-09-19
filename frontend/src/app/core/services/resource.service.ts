import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ResourceAllocation {
  _id?: string;
  projectId: string;
  userId: any;
  departmentId?: any;
  projectRole: string;
  allocationPercentage: number;
  startDate: string | Date;
  endDate?: string | Date;
  status: 'Active' | 'Inactive' | 'Completed';
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkLog {
  _id?: string;
  taskId: string;
  projectId: string;
  userId: any;
  hoursLogged: number;
  workDate: string | Date;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ResourceUtilizationSummary {
  summary: {
    totalAllocatedResources: number;
    totalEstimatedHours: number;
    totalActualHours: number;
    remainingHours: number;
    varianceHours: number;
    overallUtilization: number;
  };
  resourceEffort: {
    userId: string;
    userName: string;
    allocatedPct: number;
    estimatedHours: number;
    actualHours: number;
  }[];
  recentWorkLogs: WorkLog[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class ResourceService {
  private http = inject(HttpClient);
  private projectApi = 'http://localhost:3000/api/projects';
  private taskApi = 'http://localhost:3000/api/tasks';

  // Resource Allocations
  getProjectResources(projectId: string): Observable<ApiResponse<ResourceAllocation[]>> {
    return this.http.get<ApiResponse<ResourceAllocation[]>>(`${this.projectApi}/${projectId}/resources`);
  }

  addOrUpdateResourceAllocation(projectId: string, payload: Partial<ResourceAllocation>): Observable<ApiResponse<ResourceAllocation>> {
    return this.http.post<ApiResponse<ResourceAllocation>>(`${this.projectApi}/${projectId}/resources`, payload);
  }

  deleteResourceAllocation(projectId: string, allocationId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.projectApi}/${projectId}/resources/${allocationId}`);
  }

  getProjectResourceUtilization(projectId: string): Observable<ApiResponse<ResourceUtilizationSummary>> {
    return this.http.get<ApiResponse<ResourceUtilizationSummary>>(`${this.projectApi}/${projectId}/resource-utilization`);
  }

  // Work Logs
  getTaskWorkLogs(taskId: string): Observable<ApiResponse<WorkLog[]>> {
    return this.http.get<ApiResponse<WorkLog[]>>(`${this.taskApi}/${taskId}/worklogs`);
  }

  addWorkLog(taskId: string, payload: { hoursLogged: number; workDate?: string; description?: string }): Observable<ApiResponse<WorkLog>> {
    return this.http.post<ApiResponse<WorkLog>>(`${this.taskApi}/${taskId}/worklogs`, payload);
  }

  deleteWorkLog(logId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.taskApi}/worklogs/${logId}`);
  }
}
