import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface Issue {
  _id: string;
  projectId: string;
  issueId: string;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  ownerId?: { _id: string; employeeName: string; email?: string } | any;
  reportedById: { _id: string; employeeName: string; email?: string } | any;
  dueDate?: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  resolution?: string;
  resolvedDate?: string;
  createdBy?: { _id: string; employeeName: string } | any;
  createdAt: string;
  updatedAt: string;
}

export interface IssuePayload {
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  ownerId?: string;
  reportedById?: string;
  dueDate?: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  resolution?: string;
  resolvedDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class IssueService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api/projects';

  getIssues(projectId: string): Observable<ApiResponse<Issue[]>> {
    return this.http.get<ApiResponse<Issue[]>>(`${this.baseUrl}/${projectId}/issues`);
  }

  createIssue(projectId: string, payload: IssuePayload): Observable<ApiResponse<Issue>> {
    return this.http.post<ApiResponse<Issue>>(`${this.baseUrl}/${projectId}/issues`, payload);
  }

  updateIssue(projectId: string, issueId: string, payload: Partial<IssuePayload>): Observable<ApiResponse<Issue>> {
    return this.http.put<ApiResponse<Issue>>(`${this.baseUrl}/${projectId}/issues/${issueId}`, payload);
  }

  deleteIssue(projectId: string, issueId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/${projectId}/issues/${issueId}`);
  }
}
