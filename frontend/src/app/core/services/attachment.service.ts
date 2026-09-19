import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface Attachment {
  _id: string;
  targetType: 'Module' | 'Task';
  targetId: string;
  fileName: string;
  fileUrl: string;
  uploadedBy: any;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AttachmentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/attachments';

  getAttachments(targetType: 'Module' | 'Task', targetId: string): Observable<ApiResponse<Attachment[]>> {
    return this.http.get<ApiResponse<Attachment[]>>(`${this.apiUrl}/${targetType}/${targetId}`);
  }

  uploadAttachment(payload: { targetType: 'Module' | 'Task', targetId: string, fileName: string, fileUrl: string }): Observable<ApiResponse<Attachment>> {
    return this.http.post<ApiResponse<Attachment>>(this.apiUrl, payload);
  }

  deleteAttachment(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }
}
