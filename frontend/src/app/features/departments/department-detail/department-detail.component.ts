import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  LucideAngularModule, Building2, ArrowLeft, Users, FolderKanban, UserCheck,
  Settings, BarChart2, Edit2, ChevronRight, CheckCircle2, Clock, XCircle,
  User, Briefcase, Mail, Hash, AlertCircle, CheckCircle, Activity, Layers
} from 'lucide-angular';
import { DepartmentService, Department, DepartmentUser } from '../../../core/services/department.service';
import { AuthService } from '../../../core/services/auth.service';

type TabId = 'overview' | 'projects' | 'employees' | 'leads' | 'settings';

@Component({
  selector: 'app-department-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './department-detail.component.html',
  styleUrl: './department-detail.component.scss'
})
export class DepartmentDetailComponent implements OnInit {
  // Icons
  readonly Building2 = Building2;
  readonly ArrowLeft = ArrowLeft;
  readonly Users = Users;
  readonly FolderKanban = FolderKanban;
  readonly UserCheck = UserCheck;
  readonly Settings = Settings;
  readonly BarChart2 = BarChart2;
  readonly Edit2 = Edit2;
  readonly ChevronRight = ChevronRight;
  readonly CheckCircle2 = CheckCircle2;
  readonly Clock = Clock;
  readonly XCircle = XCircle;
  readonly User = User;
  readonly Briefcase = Briefcase;
  readonly Mail = Mail;
  readonly Hash = Hash;
  readonly AlertCircle = AlertCircle;
  readonly CheckCircle = CheckCircle;
  readonly Activity = Activity;
  readonly Layers = Layers;

  // State
  department: Department | null = null;
  projects: any[] = [];
  employees: DepartmentUser[] = [];
  leads: DepartmentUser[] = [];

  isLoading = true;
  activeTab: TabId = 'overview';
  departmentId = '';

  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Settings form
  settingsForm: FormGroup;
  isUpdating = false;

  // User context
  isManager = false;
  isSuperAdmin = false;
  isAdmin = false;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly deptService = inject(DepartmentService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly tabs: { id: TabId; label: string; icon: any }[] = [
    { id: 'overview',   label: 'Overview',   icon: BarChart2 },
    { id: 'projects',   label: 'Projects',   icon: FolderKanban },
    { id: 'employees',  label: 'Employees',  icon: Users },
    { id: 'leads',      label: 'Team Leads', icon: UserCheck },
    { id: 'settings',   label: 'Settings',   icon: Settings }
  ];

  readonly projectStatusColors: Record<string, string> = {
    'Active':             '#10b981',
    'Completed':          '#6366f1',
    'On Hold':            '#f59e0b',
    'Cancelled':          '#ef4444',
    'Assigned':           '#0ea5e9',
    'Accepted':           '#34d399',
    'Rejected':           '#f87171',
    'Pending Acceptance': '#a78bfa'
  };

  constructor() {
    this.settingsForm = this.fb.group({
      departmentName: ['', [Validators.required, Validators.minLength(2)]],
      departmentCode: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(10)]],
      description: [''],
      status: ['Active']
    });
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.isManager = user.role === 'Manager';
      this.isSuperAdmin = (user as any).superAdmin === true;
      this.isAdmin = user.role === 'Administrator';
    }
    this.departmentId = this.route.snapshot.paramMap.get('id') || '';
    this.loadAll();
  }

  loadAll(): void {
    this.isLoading = true;
    this.deptService.getDepartmentById(this.departmentId).subscribe({
      next: (res) => {
        if (res.success) {
          this.department = res.data;
          this.settingsForm.patchValue({
            departmentName: res.data.departmentName,
            departmentCode: res.data.departmentCode,
            description: res.data.description,
            status: res.data.status
          });
        }
        this.isLoading = false;
        this.loadProjects();
        this.loadUsers();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to load department.';
      }
    });
  }

  loadProjects(): void {
    this.deptService.getDepartmentProjects(this.departmentId).subscribe({
      next: (res) => { if (res.success) this.projects = res.data; }
    });
  }

  loadUsers(): void {
    this.deptService.getDepartmentUsers(this.departmentId).subscribe({
      next: (res) => {
        if (res.success) {
          this.employees = res.data.filter(u => u.role !== 'Lead' && u.role !== 'Manager');
          this.leads = res.data.filter(u => u.role === 'Lead');
        }
      }
    });
  }

  setTab(tab: TabId): void {
    this.activeTab = tab;
  }

  saveSettings(): void {
    if (this.settingsForm.invalid || this.isUpdating) return;
    this.isUpdating = true;

    this.deptService.updateDepartment(this.departmentId, this.settingsForm.value).subscribe({
      next: (res) => {
        this.isUpdating = false;
        if (res.success) {
          this.department = res.data;
          this.showSuccess('Department updated successfully!');
        }
      },
      error: (err) => {
        this.isUpdating = false;
        this.errorMessage = err.error?.message || 'Failed to update department.';
      }
    });
  }

  goBack(): void {
    // Navigate back to the parent vertical if we know it
    const verticalId = (this.department?.verticalId as any)?._id || this.department?.verticalId;
    if (verticalId) {
      this.router.navigate(['/verticals', verticalId]);
    } else {
      this.router.navigate(['/verticals']);
    }
  }

  // Computed
  get activeProjects(): number {
    return this.projects.filter(p => p.status === 'Active' || p.status === 'Accepted').length;
  }

  get completedProjects(): number {
    return this.projects.filter(p => p.status === 'Completed').length;
  }

  get verticalName(): string {
    const v = this.department?.verticalId;
    if (!v) return '';
    return typeof v === 'string' ? '' : v.name;
  }

  getStatusColor(status: string): string {
    return this.projectStatusColors[status] || '#64748b';
  }

  getRoleColor(role: string): string {
    const map: Record<string, string> = { Manager: '#f59e0b', Lead: '#6366f1', User: '#10b981' };
    return map[role] || '#64748b';
  }

  getInitials(name: string): string {
    return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  }

  getManagerNames(): string {
    const dept = this.department;
    if (!dept) return 'Unassigned';
    if (dept.managerIds && dept.managerIds.length > 0) {
      return dept.managerIds.map(m => m.employeeName).join(', ');
    }
    if (dept.managerId) return dept.managerId.employeeName;
    return 'Unassigned';
  }

  private showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => (this.successMessage = null), 3000);
  }
}
