import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface ActivityLog {
  _id: string;
  targetType: 'Module' | 'Task' | 'Project';
  targetId: string;
  action: string;
  details: string;
  performedBy: any;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/activities';

  getActivities(targetType: 'Module' | 'Task' | 'Project', targetId: string): Observable<ApiResponse<ActivityLog[]>> {
    return this.http.get<ApiResponse<ActivityLog[]>>(`${this.apiUrl}/${targetType}/${targetId}`);
  }
}
