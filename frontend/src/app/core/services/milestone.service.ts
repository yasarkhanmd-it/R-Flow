import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface Milestone {
  _id: string;
  projectId: string;
  name: string;
  description?: string;
  plannedStart: string;
  plannedEnd: string;
  actualEnd?: string;
  ownerId?: { _id: string; employeeName: string; email?: string } | any;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Delayed';
  progress: number;
  createdBy?: { _id: string; employeeName: string } | any;
  createdAt: string;
  updatedAt: string;
}

export interface MilestonePayload {
  name: string;
  description?: string;
  plannedStart: string;
  plannedEnd: string;
  actualEnd?: string;
  ownerId?: string;
  status?: string;
  progress?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MilestoneService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api/projects';

  getMilestones(projectId: string): Observable<ApiResponse<Milestone[]>> {
    return this.http.get<ApiResponse<Milestone[]>>(`${this.baseUrl}/${projectId}/milestones`);
  }

  getMilestoneById(projectId: string, milestoneId: string): Observable<ApiResponse<Milestone>> {
    return this.http.get<ApiResponse<Milestone>>(`${this.baseUrl}/${projectId}/milestones/${milestoneId}`);
  }

  createMilestone(projectId: string, payload: MilestonePayload): Observable<ApiResponse<Milestone>> {
    return this.http.post<ApiResponse<Milestone>>(`${this.baseUrl}/${projectId}/milestones`, payload);
  }

  updateMilestone(projectId: string, milestoneId: string, payload: Partial<MilestonePayload>): Observable<ApiResponse<Milestone>> {
    return this.http.put<ApiResponse<Milestone>>(`${this.baseUrl}/${projectId}/milestones/${milestoneId}`, payload);
  }

  deleteMilestone(projectId: string, milestoneId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/${projectId}/milestones/${milestoneId}`);
  }
}
