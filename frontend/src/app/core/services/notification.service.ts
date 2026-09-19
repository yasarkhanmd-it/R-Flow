import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface Notification {
  _id: string;
  type: string;
  fromUser?: { _id: string; employeeName: string };
  toUser: string;
  project?: { _id: string; name: string };
  task?: any;
  message?: string;
  status: string;
  read: boolean;
  createdAt: string;
}

export interface ActivityLog {
  _id: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  description?: string;
  performedBy: { _id: string; employeeName: string };
  details?: any;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/notifications';

  getNotifications(): Observable<ApiResponse<Notification[]>> {
    return this.http.get<ApiResponse<Notification[]>>(this.apiUrl);
  }

  getUnreadCount(): Observable<ApiResponse<{ count: number }>> {
    return this.http.get<ApiResponse<{ count: number }>>(`${this.apiUrl}/unread-count`);
  }

  getAuditLogs(limit: number = 50): Observable<ApiResponse<ActivityLog[]>> {
    return this.http.get<ApiResponse<ActivityLog[]>>(`${this.apiUrl}/audit-logs?limit=${limit}`);
  }

  markAsRead(id: string): Observable<ApiResponse<Notification>> {
    return this.http.put<ApiResponse<Notification>>(`${this.apiUrl}/${id}/read`, {});
  }

  markAllAsRead(): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/read-all`, {});
  }

  approveRequest(notificationId: string): Observable<ApiResponse<Notification>> {
    return this.http.post<ApiResponse<Notification>>(`${this.apiUrl}/${notificationId}/approve`, {});
  }

  rejectRequest(notificationId: string): Observable<ApiResponse<Notification>> {
    return this.http.post<ApiResponse<Notification>>(`${this.apiUrl}/${notificationId}/reject`, {});
  }
}
