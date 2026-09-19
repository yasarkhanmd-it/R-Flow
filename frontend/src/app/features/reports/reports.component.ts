import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  ReportService, 
  ExecutiveSummary, 
  ProjectPerformanceItem, 
  ResourceUtilizationItem, 
  FinancialBomItem, 
  RisksIssuesReport 
} from '../../core/services/report.service';
import { VerticalService, Vertical } from '../../core/services/vertical.service';
import { DepartmentService, Department } from '../../core/services/department.service';
import { ProjectService, Project } from '../../core/services/project.service';
import { AuthService } from '../../core/services/auth.service';
import { 
  LucideAngularModule, 
  BarChart2, 
  Folder, 
  CheckSquare, 
  AlertTriangle, 
  Users, 
  Download, 
  Filter, 
  RefreshCw,
  DollarSign,
  PieChart,
  Activity,
  Layers,
  Building
} from 'lucide-angular';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
  // Lucide Icons
  readonly BarChart2 = BarChart2;
  readonly Folder = Folder;
  readonly CheckSquare = CheckSquare;
  readonly AlertTriangle = AlertTriangle;
  readonly Users = Users;
  readonly Download = Download;
  readonly Filter = Filter;
  readonly RefreshCw = RefreshCw;
  readonly DollarSign = DollarSign;
  readonly PieChart = PieChart;
  readonly Activity = Activity;
  readonly Layers = Layers;
  readonly Building = Building;
  readonly Math = Math;

  private reportService = inject(ReportService);
  private verticalService = inject(VerticalService);
  private departmentService = inject(DepartmentService);
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);

  currentUser = this.authService.getCurrentUser();

  // Filter States
  selectedVerticalId = '';
  selectedDepartmentId = '';
  selectedProjectId = '';

  verticals: Vertical[] = [];
  departments: Department[] = [];
  projects: Project[] = [];

  activeTab: 'Summary' | 'Performance' | 'Resources' | 'Financials' | 'Risks' = 'Summary';
  isLoading = true;

  // Report Data States
  executiveSummary: ExecutiveSummary | null = null;
  projectPerformance: ProjectPerformanceItem[] = [];
  resourceUtilization: ResourceUtilizationItem[] = [];
  financialBom: FinancialBomItem[] = [];
  risksIssues: RisksIssuesReport | null = null;

  ngOnInit() {
    this.loadFilterOptions();
    this.loadReportData();
  }

  loadFilterOptions() {
    this.verticalService.getVerticals().subscribe({
      next: (res) => { if (res.success) this.verticals = res.data; }
    });
    this.departmentService.getDepartments().subscribe({
      next: (res) => { if (res.success) this.departments = res.data; }
    });
    this.projectService.getProjects().subscribe({
      next: (res) => { if (res.success) this.projects = res.data; }
    });
  }

  getFilterPayload() {
    return {
      verticalId: this.selectedVerticalId,
      departmentId: this.selectedDepartmentId,
      projectId: this.selectedProjectId
    };
  }

  loadReportData() {
    this.isLoading = true;
    const filters = this.getFilterPayload();

    if (this.activeTab === 'Summary') {
      this.reportService.getExecutiveSummary(filters).subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.success) this.executiveSummary = res.data;
        },
        error: () => this.isLoading = false
      });
    } else if (this.activeTab === 'Performance') {
      this.reportService.getProjectPerformance(filters).subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.success) this.projectPerformance = res.data;
        },
        error: () => this.isLoading = false
      });
    } else if (this.activeTab === 'Resources') {
      this.reportService.getResourceUtilization(filters).subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.success) this.resourceUtilization = res.data;
        },
        error: () => this.isLoading = false
      });
    } else if (this.activeTab === 'Financials') {
      this.reportService.getFinancialBomReport(filters).subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.success) this.financialBom = res.data;
        },
        error: () => this.isLoading = false
      });
    } else if (this.activeTab === 'Risks') {
      this.reportService.getRisksIssuesReport(filters).subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.success) this.risksIssues = res.data;
        },
        error: () => this.isLoading = false
      });
    }
  }

  switchTab(tab: 'Summary' | 'Performance' | 'Resources' | 'Financials' | 'Risks') {
    this.activeTab = tab;
    this.loadReportData();
  }

  applyFilters() {
    this.loadReportData();
  }

  resetFilters() {
    this.selectedVerticalId = '';
    this.selectedDepartmentId = '';
    this.selectedProjectId = '';
    this.loadReportData();
  }

  exportCSV() {
    if (this.activeTab === 'Performance' && this.projectPerformance.length > 0) {
      let csv = 'Project Name,Code,Manager,Lead,Status,Health,Progress %,Milestones Done,Open Risks,Open Issues,Est Hours,Act Hours\n';
      this.projectPerformance.forEach(p => {
        csv += `"${p.name}","${p.code}","${p.managerName}","${p.leadName}","${p.status}","${p.health}",${p.progressPct}%,${p.milestonesDone}/${p.milestonesTotal},${p.openRisks},${p.openIssues},${p.estHours},${p.actHours}\n`;
      });
      this.downloadCSVFile(csv, 'project-performance-report.csv');
    } else if (this.activeTab === 'Resources' && this.resourceUtilization.length > 0) {
      let csv = 'User Name,Employee ID,Project,Role,Department,Allocation %,Tasks Count,Est Hours,Act Hours,Utilization %\n';
      this.resourceUtilization.forEach(r => {
        csv += `"${r.userName}","${r.employeeId}","${r.projectName}","${r.projectRole}","${r.departmentName}",${r.allocationPct}%,${r.assignedTasksCount},${r.estHours},${r.actHours},${r.utilizationPct}%\n`;
      });
      this.downloadCSVFile(csv, 'resource-utilization-report.csv');
    } else if (this.activeTab === 'Financials' && this.financialBom.length > 0) {
      let csv = 'Project Name,Code,Budget,Actual Cost,Realized Revenue,Variance,BOM Count,BOM Est Cost\n';
      this.financialBom.forEach(f => {
        csv += `"${f.projectName}","${f.projectCode}",${f.budget},${f.actualCost},${f.realizedRevenue},${f.budgetVariance},${f.bomsCount},${f.bomEstimatedCost}\n`;
      });
      this.downloadCSVFile(csv, 'financial-bom-report.csv');
    } else {
      alert('Please switch to Performance, Resources, or Financials tab with data to export.');
    }
  }

  private downloadCSVFile(csvContent: string, filename: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getHealthBadgeClass(health: string): string {
    switch (health) {
      case 'On Track': return 'badge-success';
      case 'At Risk': return 'badge-warning';
      case 'Delayed': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }
}
