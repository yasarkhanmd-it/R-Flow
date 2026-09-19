import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {

  getDashboardStats() {
    return {
      departments: { count: 12, trend: '+2 this month' },
      managers: { count: 24, trend: 'Stable' },
      teamLeads: { count: 48, trend: '+5 this quarter' },
      employees: { count: 856, trend: '+12% from last year' },
      projects: { count: 142, trend: '+15 this year' },
      activeProjects: { count: 42, trend: '8 near deadline' },
      pendingApprovals: { count: 14, trend: 'Needs action' },
      pendingTasks: { count: 328, trend: '-5% this week' },
      completedTasks: { count: 12450, trend: '+124 this week' }
    };
  }

  getRecentProjects() {
    return [
      { name: 'ERP Migration', department: 'Software', manager: 'Sarah Jenkins', status: 'In Progress', progress: 65, startDate: '2026-05-01', endDate: '2026-08-30' },
      { name: 'Q3 Quality Audit', department: 'Quality', manager: 'Michael Chang', status: 'Pending', progress: 10, startDate: '2026-07-15', endDate: '2026-09-15' },
      { name: 'Plant Automation', department: 'Production', manager: 'David Miller', status: 'In Progress', progress: 82, startDate: '2026-02-10', endDate: '2026-07-30' },
      { name: 'Supplier Portal', department: 'Purchase', manager: 'Emma Stone', status: 'Completed', progress: 100, startDate: '2025-11-01', endDate: '2026-06-15' },
      { name: 'Employee Portal Update', department: 'HR', manager: 'James Wilson', status: 'In Progress', progress: 45, startDate: '2026-06-01', endDate: '2026-08-15' }
    ];
  }

  getPendingUsers() {
    return [
      { name: 'Alice Cooper', id: 'EMP-4092', department: 'Software', role: 'Employee', status: 'Pending' },
      { name: 'Bob Marley', id: 'EMP-4093', department: 'Production', role: 'Team Lead', status: 'Pending' },
      { name: 'Charlie Sheen', id: 'EMP-4094', department: 'Maintenance', role: 'Employee', status: 'Pending' }
    ];
  }

  getDepartmentOverview() {
    return [
      { name: 'Software', employees: 145, projects: 24, manager: 'Sarah Jenkins' },
      { name: 'Production', employees: 420, projects: 12, manager: 'David Miller' },
      { name: 'Quality', employees: 85, projects: 34, manager: 'Michael Chang' },
      { name: 'Purchase', employees: 64, projects: 18, manager: 'Emma Stone' },
      { name: 'HR', employees: 42, projects: 8, manager: 'James Wilson' },
      { name: 'Maintenance', employees: 100, projects: 46, manager: 'Robert King' }
    ];
  }

  getRecentActivities() {
    return [
      { user: 'Sarah Jenkins', action: 'Created new project', target: 'ERP Migration', time: '2 hours ago', type: 'project' },
      { user: 'System', action: 'New Employee Registered', target: 'Alice Cooper', time: '4 hours ago', type: 'user' },
      { user: 'David Miller', action: 'Task Completed', target: 'Phase 1 Assembly', time: '5 hours ago', type: 'task' },
      { user: 'Michael Chang', action: 'Department Updated', target: 'Quality metrics updated', time: '1 day ago', type: 'department' },
      { user: 'Emma Stone', action: 'User Logged In', target: 'System', time: '1 day ago', type: 'login' }
    ];
  }

  getChartData() {
    return {
      projectStatus: {
        labels: ['Pending', 'In Progress', 'Completed'],
        data: [25, 45, 30] // percentages
      },
      departmentDistribution: {
        labels: ['Software', 'Production', 'Quality', 'Purchase', 'HR', 'Maintenance'],
        data: [145, 420, 85, 64, 42, 100]
      }
    };
  }
}
