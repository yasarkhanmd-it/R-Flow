import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface Task {
  _id: string;
  projectId: string | any;
  moduleId?: string | any;
  departmentId?: { _id: string; departmentName: string; departmentCode: string } | string | any;
  workflowStageId?: { _id: string; name: string; order: number; isInitial: boolean; isFinal: boolean } | string | any;
  taskId: string;
  summary: string;
  description: string;
  type: 'Story' | 'Task' | 'Bug' | 'Epic' | 'Sub-task';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'To Do' | 'In Progress' | 'Blocked' | 'Completed' | 'Pending Review' | 'Done';
  estimatedHours?: number;
  actualHours?: number;
  assigneeId?: any;
  reporterId: any;
  startDate?: string;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedTaskResponse extends ApiResponse<Task[]> {
  count?: number;
  total?: number;
  page?: number;
  totalPages?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/tasks';

  getTasks(filters?: any): Observable<PaginatedTaskResponse> {
    let params = new HttpParams();
    if (filters) {
      if (filters.projectId) params = params.set('projectId', filters.projectId);
      if (filters.moduleId) params = params.set('moduleId', filters.moduleId);
      if (filters.assigneeId) params = params.set('assigneeId', filters.assigneeId);
      if (filters.departmentId) params = params.set('departmentId', filters.departmentId);
      if (filters.workflowStageId) params = params.set('workflowStageId', filters.workflowStageId);
      if (filters.priority) params = params.set('priority', filters.priority);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.search) params = params.set('search', filters.search);
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
    }
    return this.http.get<PaginatedTaskResponse>(this.apiUrl, { params });
  }

  createTask(payload: Partial<Task>): Observable<ApiResponse<Task>> {
    return this.http.post<ApiResponse<Task>>(this.apiUrl, payload);
  }

  updateTask(id: string, payload: Partial<Task>): Observable<ApiResponse<Task>> {
    return this.http.put<ApiResponse<Task>>(`${this.apiUrl}/${id}`, payload);
  }

  deleteTask(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  requestClarification(id: string, message: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/clarification`, { message });
  }
}
