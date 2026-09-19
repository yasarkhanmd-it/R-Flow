import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface Risk {
  _id: string;
  projectId: string;
  title: string;
  description?: string;
  probability: 'Low' | 'Medium' | 'High';
  impact: 'Low' | 'Medium' | 'High' | 'Critical';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Identified' | 'Open' | 'Mitigated' | 'Closed' | 'Realized';
  mitigationPlan?: string;
  ownerId?: { _id: string; employeeName: string; email?: string } | any;
  createdBy?: { _id: string; employeeName: string } | any;
  createdAt: string;
  updatedAt: string;
}

export interface RiskPayload {
  title: string;
  description?: string;
  probability: 'Low' | 'Medium' | 'High';
  impact: 'Low' | 'Medium' | 'High' | 'Critical';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Identified' | 'Open' | 'Mitigated' | 'Closed' | 'Realized';
  mitigationPlan?: string;
  ownerId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RiskService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api/projects';

  getRisks(projectId: string): Observable<ApiResponse<Risk[]>> {
    return this.http.get<ApiResponse<Risk[]>>(`${this.baseUrl}/${projectId}/risks`);
  }

  createRisk(projectId: string, payload: RiskPayload): Observable<ApiResponse<Risk>> {
    return this.http.post<ApiResponse<Risk>>(`${this.baseUrl}/${projectId}/risks`, payload);
  }

  updateRisk(projectId: string, riskId: string, payload: Partial<RiskPayload>): Observable<ApiResponse<Risk>> {
    return this.http.put<ApiResponse<Risk>>(`${this.baseUrl}/${projectId}/risks/${riskId}`, payload);
  }

  deleteRisk(projectId: string, riskId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/${projectId}/risks/${riskId}`);
  }
}
