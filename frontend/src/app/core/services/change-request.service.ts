import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface ChangeRequest {
  _id: string;
  projectId: string;
  crId: string;
  title: string;
  description?: string;
  requestedById: { _id: string; employeeName: string; email?: string } | any;
  ownerId?: { _id: string; employeeName: string; email?: string } | any;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  reason?: string;
  scopeImpact?: string;
  costImpact?: string;
  scheduleImpact?: string;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  status: 'Open' | 'In Review' | 'Approved' | 'Rejected' | 'Implementing' | 'Completed' | 'Closed';
  createdBy?: { _id: string; employeeName: string } | any;
  createdAt: string;
  updatedAt: string;
}

export interface ChangeRequestPayload {
  title: string;
  description?: string;
  requestedById?: string;
  ownerId?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  reason?: string;
  scopeImpact?: string;
  costImpact?: string;
  scheduleImpact?: string;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  status: 'Open' | 'In Review' | 'Approved' | 'Rejected' | 'Implementing' | 'Completed' | 'Closed';
}

@Injectable({
  providedIn: 'root'
})
export class ChangeRequestService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api/projects';

  getChangeRequests(projectId: string): Observable<ApiResponse<ChangeRequest[]>> {
    return this.http.get<ApiResponse<ChangeRequest[]>>(`${this.baseUrl}/${projectId}/change-requests`);
  }

  createChangeRequest(projectId: string, payload: ChangeRequestPayload): Observable<ApiResponse<ChangeRequest>> {
    return this.http.post<ApiResponse<ChangeRequest>>(`${this.baseUrl}/${projectId}/change-requests`, payload);
  }

  updateChangeRequest(projectId: string, crId: string, payload: Partial<ChangeRequestPayload>): Observable<ApiResponse<ChangeRequest>> {
    return this.http.put<ApiResponse<ChangeRequest>>(`${this.baseUrl}/${projectId}/change-requests/${crId}`, payload);
  }

  deleteChangeRequest(projectId: string, crId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/${projectId}/change-requests/${crId}`);
  }
}
