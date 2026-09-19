import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface GanttItem {
  id: string;
  title: string;
  type: 'project' | 'milestone' | 'module' | 'task';
  startDate: string;
  endDate: string;
  progress: number;
  status: string;
  priority?: string;
  assignee?: { _id: string; employeeName: string };
  owner?: { _id: string; employeeName: string };
  moduleId?: string;
  parentId?: string;
  taskCount?: number;
  completedTaskCount?: number;
}

export interface GanttData {
  project: GanttItem;
  milestones: GanttItem[];
  modules: GanttItem[];
  tasks: GanttItem[];
  bounds: {
    startDate: string;
    endDate: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class GanttService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api/projects';

  getGanttData(projectId: string): Observable<ApiResponse<GanttData>> {
    return this.http.get<ApiResponse<GanttData>>(`${this.baseUrl}/${projectId}/gantt`);
  }
}
