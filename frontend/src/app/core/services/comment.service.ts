import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface Comment {
  _id: string;
  targetType: 'Module' | 'Task';
  targetId: string;
  content: string;
  authorId: any;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/comments';

  getComments(targetType: 'Module' | 'Task', targetId: string): Observable<ApiResponse<Comment[]>> {
    return this.http.get<ApiResponse<Comment[]>>(`${this.apiUrl}/${targetType}/${targetId}`);
  }

  addComment(payload: { targetType: 'Module' | 'Task', targetId: string, content: string }): Observable<ApiResponse<Comment>> {
    return this.http.post<ApiResponse<Comment>>(this.apiUrl, payload);
  }
}
