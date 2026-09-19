import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  LucideAngularModule, Users, Search, UserCheck, Building2,
  X, CheckCircle, AlertCircle, Shield, UserX
} from 'lucide-angular';
import { AuthService, AuthUser } from '../../core/services/auth.service';
import { DepartmentService, Department } from '../../core/services/department.service';
import { VerticalService, Vertical } from '../../core/services/vertical.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  // ── Icons ─────────────────────────────────────────────────────────────────
  readonly Users = Users;
  readonly Search = Search;
  readonly UserCheck = UserCheck;
  readonly Building2 = Building2;
  readonly X = X;
  readonly CheckCircle = CheckCircle;
  readonly AlertCircle = AlertCircle;
  readonly Shield = Shield;
  readonly UserX = UserX;

  // ── State ─────────────────────────────────────────────────────────────────
  allUsers: AuthUser[] = [];
  filteredUsers: AuthUser[] = [];
  departments: Department[] = [];
  verticals: Vertical[] = [];
  verticalDepartments: any[] = [];
  isLoading = true;
  searchTerm = '';

  // ── Modal ─────────────────────────────────────────────────────────────────
  showAssignModal = false;
  selectedUser: AuthUser | null = null;
  isSubmitting = false;
  assignForm: FormGroup;

  // ── Feedback ──────────────────────────────────────────────────────────────
  successMessage: string | null = null;
  errorMessage: string | null = null;

  // ── User context ──────────────────────────────────────────────────────────
  isSuperAdmin = false;
  isAdministrator = false;

  private readonly authService = inject(AuthService);
  private readonly deptService = inject(DepartmentService);
  private readonly verticalService = inject(VerticalService);
  private readonly fb = inject(FormBuilder);

  constructor() {
    this.assignForm = this.fb.group({
      verticalId: ['', Validators.required],
      departmentId: [{ value: '', disabled: true }, Validators.required]
    });

    this.assignForm.get('verticalId')?.valueChanges.subscribe(vId => {
      this.assignForm.get('departmentId')?.setValue('');
      if (vId) {
        this.loadVerticalDepartments(vId);
        this.assignForm.get('departmentId')?.enable();
      } else {
        this.verticalDepartments = [];
        this.assignForm.get('departmentId')?.disable();
      }
    });
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.isSuperAdmin = (user as any).superAdmin === true;
      this.isAdministrator = user.role === 'Administrator';
    }
    this.loadUsers();
    this.loadDepartments();
    this.loadVerticals();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.authService.getUsersAll().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.allUsers = res.data;
          this.applyFilter();
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to load users.';
      }
    });
  }

  loadDepartments(): void {
    this.deptService.getDepartments().subscribe({
      next: (res) => {
        if (res.success) {
          this.departments = res.data;
        }
      }
    });
  }

  loadVerticals(): void {
    this.verticalService.getVerticals().subscribe({
      next: (res) => {
        if (res.success) this.verticals = res.data;
      }
    });
  }

  loadVerticalDepartments(verticalId: string): void {
    this.verticalService.getVerticalDepartments(verticalId).subscribe({
      next: (res) => {
        if (res.success) this.verticalDepartments = res.data;
      }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredUsers = term
      ? this.allUsers.filter(u =>
          u.employeeName?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term) ||
          u.employeeId?.toLowerCase().includes(term) ||
          u.role?.toLowerCase().includes(term) ||
          u.department?.toLowerCase().includes(term)
        )
      : [...this.allUsers];
  }

  onSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.applyFilter();
  }

  openAssignModal(user: AuthUser): void {
    this.selectedUser = user;
    if (user.verticalId) {
      this.assignForm.patchValue({ verticalId: user.verticalId }, { emitEvent: false });
      this.assignForm.get('departmentId')?.enable();
      this.verticalService.getVerticalDepartments(user.verticalId).subscribe({
        next: (res) => {
          if (res.success) {
            this.verticalDepartments = res.data;
            this.assignForm.patchValue({ departmentId: user.departmentId || '' }, { emitEvent: false });
          }
        }
      });
    } else {
      this.assignForm.reset({ verticalId: '', departmentId: '' });
      this.verticalDepartments = [];
      this.assignForm.get('departmentId')?.disable();
    }
    this.showAssignModal = true;
  }

  closeModal(): void {
    this.showAssignModal = false;
    this.selectedUser = null;
  }

  onAssignDepartment(): void {
    if (!this.selectedUser || this.assignForm.invalid || this.isSubmitting) return;

    const { departmentId, verticalId } = this.assignForm.value;
    const dept = this.verticalDepartments.find(d => d._id === departmentId);
    const departmentName = dept?.departmentName || '';

    this.isSubmitting = true;
    this.authService.assignUserDepartment(this.selectedUser.id, departmentId, departmentName, verticalId).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success) {
          // Update the local user list
          const idx = this.allUsers.findIndex(u => u.id === this.selectedUser!.id);
          if (idx !== -1) {
            this.allUsers[idx] = res.data;
          }
          this.applyFilter();
          this.closeModal();
          this.showSuccess(`${this.selectedUser?.employeeName} assigned to ${departmentName}`);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Failed to assign department.';
      }
    });
  }

  removeDepartment(user: AuthUser): void {
    this.authService.assignUserDepartment(user.id, null).subscribe({
      next: (res) => {
        if (res.success) {
          const idx = this.allUsers.findIndex(u => u.id === user.id);
          if (idx !== -1) {
            this.allUsers[idx] = res.data;
          }
          this.applyFilter();
          this.showSuccess(`${user.employeeName} removed from department.`);
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to remove department.';
      }
    });
  }

  getDeptName(user: AuthUser): string {
    if (!user.departmentId) return 'Not Assigned';
    const dept = this.departments.find(d => d._id === user.departmentId);
    const deptName = dept?.departmentName || 'Unknown';
    if (user.verticalId) {
      const vert = this.verticals.find(v => v._id === user.verticalId);
      if (vert) {
        return `${vert.name} / ${deptName}`;
      }
    }
    return deptName;
  }

  getRoleBadgeClass(role: string): string {
    const map: Record<string, string> = {
      'Administrator': 'badge-admin',
      'Manager':       'badge-manager',
      'Lead':          'badge-lead',
      'User':          'badge-user'
    };
    return map[role] || 'badge-user';
  }

  getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      'Approved':   'badge-success',
      'Pending':    'badge-warning',
      'Rejected':   'badge-danger',
      'Suspended':  'badge-danger'
    };
    return map[status] || 'badge-user';
  }

  getInitials(name: string): string {
    return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  private showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => (this.successMessage = null), 3500);
  }
}
