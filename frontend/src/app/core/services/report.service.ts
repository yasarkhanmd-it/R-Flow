import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ExecutiveSummary {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalMilestones: number;
  completedMilestones: number;
  openRisks: number;
  openIssues: number;
  financials: {
    totalBudget: number;
    actualCost: number;
    realizedRevenue: number;
    variance: number;
  };
  resourceStats: {
    totalAllocations: number;
    totalEstHours: number;
    totalActHours: number;
    overallUtilization: number;
  };
}

export interface ProjectPerformanceItem {
  id: string;
  name: string;
  code: string;
  managerName: string;
  leadName: string;
  verticalName: string;
  status: string;
  health: string;
  progressPct: number;
  totalTasks: number;
  completedTasks: number;
  milestonesTotal: number;
  milestonesDone: number;
  openRisks: number;
  openIssues: number;
  estHours: number;
  actHours: number;
  hoursVariance: number;
}

export interface ResourceUtilizationItem {
  id: string;
  userName: string;
  employeeId: string;
  email: string;
  projectName: string;
  projectRole: string;
  departmentName: string;
  allocationPct: number;
  status: string;
  assignedTasksCount: number;
  estHours: number;
  actHours: number;
  utilizationPct: number;
}

export interface FinancialBomItem {
  projectId: string;
  projectName: string;
  projectCode: string;
  budget: number;
  actualCost: number;
  realizedRevenue: number;
  budgetVariance: number;
  bomsCount: number;
  bomItemsCount: number;
  bomEstimatedCost: number;
}

export interface RisksIssuesReport {
  riskSummary: {
    totalRisks: number;
    openRisks: number;
    severityCount: { Critical: number; High: number; Medium: number; Low: number };
  };
  issueSummary: {
    totalIssues: number;
    openIssues: number;
  };
  risksList: { title: string; projectName: string; severity: string; status: string }[];
  issuesList: { issueId: string; title: string; projectName: string; severity: string; status: string }[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/reports';

  private buildParams(filters?: any): HttpParams {
    let params = new HttpParams();
    if (filters) {
      if (filters.verticalId) params = params.set('verticalId', filters.verticalId);
      if (filters.departmentId) params = params.set('departmentId', filters.departmentId);
      if (filters.projectId) params = params.set('projectId', filters.projectId);
    }
    return params;
  }

  getExecutiveSummary(filters?: any): Observable<ApiResponse<ExecutiveSummary>> {
    return this.http.get<ApiResponse<ExecutiveSummary>>(`${this.apiUrl}/executive-summary`, { params: this.buildParams(filters) });
  }

  getProjectPerformance(filters?: any): Observable<ApiResponse<ProjectPerformanceItem[]>> {
    return this.http.get<ApiResponse<ProjectPerformanceItem[]>>(`${this.apiUrl}/project-performance`, { params: this.buildParams(filters) });
  }

  getResourceUtilization(filters?: any): Observable<ApiResponse<ResourceUtilizationItem[]>> {
    return this.http.get<ApiResponse<ResourceUtilizationItem[]>>(`${this.apiUrl}/resource-utilization`, { params: this.buildParams(filters) });
  }

  getFinancialBomReport(filters?: any): Observable<ApiResponse<FinancialBomItem[]>> {
    return this.http.get<ApiResponse<FinancialBomItem[]>>(`${this.apiUrl}/financial-bom`, { params: this.buildParams(filters) });
  }

  getRisksIssuesReport(filters?: any): Observable<ApiResponse<RisksIssuesReport>> {
    return this.http.get<ApiResponse<RisksIssuesReport>>(`${this.apiUrl}/risks-issues`, { params: this.buildParams(filters) });
  }
}
