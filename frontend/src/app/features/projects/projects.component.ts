import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Filter, Folder, Plus, Search, X, ClipboardList, Trash2 } from 'lucide-angular';
import { ProjectService, Project } from '../../core/services/project.service';
import { AuthService } from '../../core/services/auth.service';
import { TaskService, Task } from '../../core/services/task.service';
import { timer, Subscription } from 'rxjs';

import { VerticalService, Vertical } from '../../core/services/vertical.service';
import { DepartmentService, Department } from '../../core/services/department.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ReactiveFormsModule],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent implements OnInit, OnDestroy {
  readonly Filter = Filter;
  readonly Folder = Folder;
  readonly Plus = Plus;
  readonly Search = Search;
  readonly X = X;
  readonly ClipboardList = ClipboardList;
  readonly Trash2 = Trash2;

  readonly tabs = ['All', 'Active', 'Completed', 'On Hold', 'Cancelled', 'Assigned', 'Pending Acceptance', 'Accepted', 'Rejected'];
  activeTab = 0;

  projects: Project[] = [];
  verticals: Vertical[] = [];
  departments: Department[] = [];
  isManager = false;
  isLead = false;
  currentUserId: string = '';
  managers: any[] = [];

  showAddModal = false;
  isEditing = false;
  editingProjectId: string | null = null;
  addForm: FormGroup;
  isSubmitting = false;

  // ── Delete Modal ──────────────────────────────────────────────────────────
  showDeleteModal = false;
  itemToDelete: Project | null = null;
  deleteTitle = '';
  deleteMessage = '';

  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private verticalService = inject(VerticalService);
  private departmentService = inject(DepartmentService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  constructor() {
    this.addForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      projectCode: [''],
      verticalId: [''],
      departmentId: [''],
      budget: [0, [Validators.min(0)]],
      teamSize: [0, [Validators.min(0)]],
      hoursAllocated: [0, [Validators.min(0)]],
      hoursUsed: [0, [Validators.min(0)]],
      actualCost: [0, [Validators.min(0)]],
      committedCost: [0, [Validators.min(0)]],
      retentionHoldback: [0, [Validators.min(0)]],
      revenue: [0, [Validators.min(0)]],
      otherCashInflow: [0, [Validators.min(0)]],
      otherCashOutflow: [0, [Validators.min(0)]],
      managerId: ['', Validators.required],
      expectedEndDate: [''],
      startDate: ['']
    });
  }

  private pollingSubscription?: Subscription;

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.isManager = user.role === 'Manager' || user.role === 'Administrator' || !!user.superAdmin;
      this.isLead = user.role === 'Lead';
      const userRaw = JSON.parse(localStorage.getItem('rflow_auth_user') || '{}');
      this.currentUserId = user.id || userRaw._id;
    }
    this.loadProjects();
    this.loadManagers();
    this.loadVerticalsAndDepartments();
    this.startPolling();
  }

  loadVerticalsAndDepartments() {
    this.verticalService.getVerticals().subscribe({
      next: (res) => { if (res.success) this.verticals = res.data; }
    });
    this.departmentService.getDepartments().subscribe({
      next: (res) => { if (res.success) this.departments = res.data; }
    });
  }

  ngOnDestroy(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  startPolling() {
    this.pollingSubscription = timer(10000, 10000).subscribe(() => {
      if (!this.showAddModal) {
        this.loadProjects();
      }
    });
  }

  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: KeyboardEvent) {
    if (this.showAddModal) {
      this.closeAddModal();
    }
  }

  loadManagers() {
    this.authService.getUsers().subscribe({
      next: (res) => {
        if (res.success) {
          // Include Managers and Administrators
          this.managers = res.data.filter(u => u.role === 'Manager' || u.role === 'Administrator' || u.superAdmin);
          if (!this.addForm.get('managerId')?.value && this.managers.length > 0) {
            const match = this.managers.find(m => (m.id || m._id) === this.currentUserId);
            const defaultId = match ? (match.id || match._id) : (this.managers[0].id || this.managers[0]._id);
            this.addForm.patchValue({ managerId: defaultId });
          }
        }
      }
    });
  }

  loadProjects() {
    this.projectService.getProjects().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.projects = res.data;
        }
      },
      error: (err: any) => console.error('Failed to load projects', err)
    });
  }

  openAddModal() {
    this.isEditing = false;
    this.editingProjectId = null;
    this.showAddModal = true;
    let defaultMgrId = this.currentUserId || '';
    if (this.managers.length > 0) {
      const match = this.managers.find(m => (m.id || m._id) === this.currentUserId);
      if (match) {
        defaultMgrId = match.id || match._id;
      } else {
        defaultMgrId = this.managers[0].id || this.managers[0]._id;
      }
    }
    this.addForm.reset({
      name: '',
      description: '',
      projectCode: '',
      verticalId: '',
      departmentId: '',
      budget: 0,
      teamSize: 0,
      hoursAllocated: 0,
      hoursUsed: 0,
      actualCost: 0,
      committedCost: 0,
      retentionHoldback: 0,
      revenue: 0,
      otherCashInflow: 0,
      otherCashOutflow: 0,
      managerId: defaultMgrId,
      expectedEndDate: '',
      startDate: ''
    });
  }

  openEditModal(project: Project, event: Event) {
    event.stopPropagation();
    this.isEditing = true;
    this.editingProjectId = project._id;
    this.showAddModal = true;
    const mgrId = typeof project.managerId === 'object' ? (project.managerId as any)?._id : project.managerId;
    const vertId = typeof project.verticalId === 'object' ? (project.verticalId as any)?._id : (project.verticalId || '');
    const firstDept = Array.isArray(project.departmentIds) && project.departmentIds.length > 0 
      ? (typeof project.departmentIds[0] === 'object' ? (project.departmentIds[0] as any)._id : project.departmentIds[0])
      : '';
    this.addForm.patchValue({
      name: project.name,
      description: project.description,
      projectCode: project.projectCode || '',
      verticalId: vertId,
      departmentId: firstDept,
      budget: project.budget || 0,
      teamSize: project.teamSize || 0,
      hoursAllocated: project.hoursAllocated || 0,
      hoursUsed: project.hoursUsed || 0,
      actualCost: project.actualCost || 0,
      committedCost: project.committedCost || 0,
      retentionHoldback: project.retentionHoldback || 0,
      revenue: project.revenue || 0,
      otherCashInflow: project.otherCashInflow || 0,
      otherCashOutflow: project.otherCashOutflow || 0,
      managerId: mgrId || '',
      expectedEndDate: project.expectedEndDate ? new Date(project.expectedEndDate).toISOString().substring(0, 10) : '',
      startDate: project.startDate ? new Date(project.startDate).toISOString().substring(0, 10) : ''
    });
  }

  closeAddModal() {
    this.showAddModal = false;
    this.isEditing = false;
    this.editingProjectId = null;
  }

  onSubmitAdd() {
    if (this.addForm.invalid) return;
    this.isSubmitting = true;

    const payload = this.addForm.value;

    if (this.isEditing && this.editingProjectId) {
      this.projectService.updateProject(this.editingProjectId, payload).subscribe({
        next: (res: any) => {
          this.isSubmitting = false;
          if (res.success) {
            this.closeAddModal();
            this.loadProjects();
          }
        },
        error: (err: any) => {
          this.isSubmitting = false;
          console.error(err);
          alert(err.error?.message || 'Failed to update project');
        }
      });
    } else {
      this.projectService.createProject(payload).subscribe({
        next: (res: any) => {
          this.isSubmitting = false;
          if (res.success) {
            this.closeAddModal();
            this.loadProjects();
          }
        },
        error: (err: any) => {
          this.isSubmitting = false;
          console.error(err);
          alert(err.error?.message || 'Failed to create project');
        }
      });
    }
  }

  openProjectTasks(project: Project) {
    // If Team Lead, only allow opening if the project has been Accepted or Active
    if (this.isLead) {
      if (project.status !== 'Accepted' && project.status !== 'Active') {
        alert('You must accept this project first from the dashboard approval screen.');
        return;
      }
    }

    // If standard user/employee, only allow if they are a member
    if (!this.isManager && !this.isLead && !this.isMember(project)) {
      alert('You must request to join and be accepted before accessing this project.');
      return;
    }

    this.router.navigate(['/projects', project._id, 'board']);
  }

  requestJoin(projectId: string) {
    this.projectService.requestJoin(projectId).subscribe({
      next: (res: any) => {
        if (res.success) {
          alert('Join request sent successfully!');
        }
      },
      error: (err: any) => {
        alert(err.error?.message || 'Failed to send request');
      }
    });
  }

  isMember(project: Project): boolean {
    if (this.isManager) return true;
    return project.members.some((m: any) => m._id === this.currentUserId) || project.leadId?._id === this.currentUserId;
  }

  confirmDelete(project: Project, event: Event) {
    event.stopPropagation();
    this.itemToDelete = project;
    this.deleteTitle = 'Delete Project';
    this.deleteMessage = `Are you sure you want to delete project "${project.name}"?\nThis will permanently delete the project and all of its tasks.`;
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.itemToDelete = null;
  }

  executeDelete() {
    if (!this.itemToDelete) return;
    this.projectService.deleteProject(this.itemToDelete._id).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadProjects();
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to delete project');
      }
    });
    this.showDeleteModal = false;
    this.itemToDelete = null;
  }

  getManagerName(p: any): string {
    if (!p || !p.managerId) return 'Unassigned';
    if (typeof p.managerId === 'string') {
      const found = this.managers.find(m => (m.id || m._id) === p.managerId);
      return found ? found.employeeName : 'Manager';
    }
    return p.managerId.employeeName || p.managerId.name || 'Unassigned';
  }

  getLeadName(p: any): string {
    if (!p || !p.leadId) return '';
    if (typeof p.leadId === 'string') return 'Team Lead';
    return p.leadId.employeeName || p.leadId.name || '';
  }

  getMemberCount(p: any): number {
    if (!p || !p.members || !Array.isArray(p.members)) return 0;
    return p.members.length;
  }

  getVerticalName(p: any): string {
    if (!p || !p.verticalId) return '—';
    if (typeof p.verticalId === 'object') return p.verticalId.name || '—';
    const found = this.verticals.find(v => v._id === p.verticalId);
    return found ? found.name : '—';
  }

  getBudgetDisplay(p: any): string {
    if (!p || p.budget === undefined || p.budget === null) return '₹0';
    return `₹${Number(p.budget).toLocaleString('en-IN')}`;
  }
}
