import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  LucideAngularModule, Layers, ArrowLeft, Plus, Search, Edit2, Trash2,
  Users, FolderKanban, UserCheck, ChevronRight, X, CheckCircle, AlertCircle,
  Building2, UserCog
} from 'lucide-angular';
import { VerticalService, Vertical, VerticalDepartment } from '../../../core/services/vertical.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-vertical-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, LucideAngularModule],
  templateUrl: './vertical-detail.component.html',
  styleUrl: './vertical-detail.component.scss'
})
export class VerticalDetailComponent implements OnInit {
  // Icons
  readonly Layers = Layers;
  readonly ArrowLeft = ArrowLeft;
  readonly Plus = Plus;
  readonly Search = Search;
  readonly Edit2 = Edit2;
  readonly Trash2 = Trash2;
  readonly Users = Users;
  readonly FolderKanban = FolderKanban;
  readonly UserCheck = UserCheck;
  readonly ChevronRight = ChevronRight;
  readonly X = X;
  readonly CheckCircle = CheckCircle;
  readonly AlertCircle = AlertCircle;
  readonly Building2 = Building2;
  readonly UserCog = UserCog;

  // State
  vertical: Vertical | null = null;
  departments: VerticalDepartment[] = [];
  filteredDepartments: VerticalDepartment[] = [];
  isLoading = true;
  deptLoading = false;
  verticalId = '';
  searchTerm = '';
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Department modal
  showDeptModal = false;
  isEditingDept = false;
  editingDeptId: string | null = null;
  isSubmitting = false;
  deptForm: FormGroup;

  // Delete modal
  showDeleteModal = false;
  itemToDelete: VerticalDepartment | null = null;

  // Available managers
  availableManagers: any[] = [];
  selectedManagerId: string = '';

  // User context
  isSuperAdmin = false;
  isAdministrator = false;
  isManager = false;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly verticalService = inject(VerticalService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);

  private readonly deptApiUrl = 'http://localhost:3000/api/departments';


  constructor() {
    this.deptForm = this.fb.group({
      departmentName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      departmentCode: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(20), Validators.pattern(/^[A-Za-z0-9\s\-]+$/)]],
      description: ['', Validators.maxLength(500)],
      status: ['Active']
    });
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.isSuperAdmin = (user as any).superAdmin === true;
      this.isAdministrator = user.role === 'Administrator';
      this.isManager = user.role === 'Manager';
    }
    this.verticalId = this.route.snapshot.paramMap.get('id') || '';
    this.loadVertical();
    this.loadDepartments();
    if (this.canManage) {
      this.loadManagers();
    }
  }

  get canManage(): boolean {
    return this.isSuperAdmin || this.isAdministrator;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.showDeptModal) this.closeDeptModal();
    if (this.showDeleteModal) this.cancelDelete();
  }

  loadVertical(): void {
    this.isLoading = true;
    this.verticalService.getVerticalById(this.verticalId).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) this.vertical = res.data;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to load vertical.';
      }
    });
  }

  loadDepartments(): void {
    this.deptLoading = true;
    this.verticalService.getVerticalDepartments(this.verticalId).subscribe({
      next: (res) => {
        this.deptLoading = false;
        if (res.success) {
          this.departments = res.data;
          this.applyFilter();
        }
      },
      error: (err) => {
        this.deptLoading = false;
        this.errorMessage = err.error?.message || 'Failed to load departments.';
      }
    });
  }

  loadManagers(): void {
    this.authService.getUsers('Manager').subscribe({
      next: (res) => {
        if (res.success) {
          this.availableManagers = res.data.filter((u: any) => !u.superAdmin && u.role !== 'Administrator');
        }
      }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredDepartments = term
      ? this.departments.filter(d =>
          d.departmentName.toLowerCase().includes(term) ||
          d.departmentCode.toLowerCase().includes(term) ||
          d.description?.toLowerCase().includes(term)
        )
      : [...this.departments];
  }

  onSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.applyFilter();
  }

  openCreateDeptModal(): void {
    this.isEditingDept = false;
    this.editingDeptId = null;
    this.selectedManagerId = '';
    this.deptForm.reset({ departmentName: '', departmentCode: '', description: '', status: 'Active' });
    this.showDeptModal = true;
  }

  openEditDeptModal(dept: VerticalDepartment, event: Event): void {
    event.stopPropagation();
    this.isEditingDept = true;
    this.editingDeptId = dept._id;
    this.selectedManagerId = (dept.managerIds && dept.managerIds.length > 0) ? (dept.managerIds[0] as any)._id || dept.managerIds[0] : '';
    this.deptForm.patchValue({
      departmentName: dept.departmentName,
      departmentCode: dept.departmentCode,
      description: dept.description,
      status: dept.status
    });
    this.showDeptModal = true;
  }

  closeDeptModal(): void {
    this.showDeptModal = false;
    this.isEditingDept = false;
    this.editingDeptId = null;
    this.selectedManagerId = '';
  }

  onSubmitDept(): void {
    if (this.deptForm.invalid || this.isSubmitting) return;
    this.isSubmitting = true;

    const payload = {
      ...this.deptForm.value,
      verticalId: this.verticalId,
      managerIds: this.selectedManagerId ? [this.selectedManagerId] : []
    };

    const url = this.isEditingDept && this.editingDeptId
      ? `${this.deptApiUrl}/${this.editingDeptId}`
      : this.deptApiUrl;

    const req$ = this.isEditingDept
      ? this.http.put<any>(url, payload)
      : this.http.post<any>(url, payload);

    req$.subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success) {
          this.showSuccess(this.isEditingDept ? 'Department updated!' : 'Department created!');
          this.closeDeptModal();
          this.loadDepartments();
          this.loadVertical();
        } else {
          this.errorMessage = res.message || 'Operation failed.';
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Operation failed.';
      }
    });
  }

  assignManagers(deptId: string): void {
    this.http.put<any>(`${this.deptApiUrl}/${deptId}/managers`, {
      managerIds: this.selectedManagerId ? [this.selectedManagerId] : []
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.showSuccess('Managers updated!');
          this.loadDepartments();
        }
      },
      error: (err) => { this.errorMessage = err.error?.message || 'Failed to assign managers.'; }
    });
  }

  confirmDelete(dept: VerticalDepartment, event: Event): void {
    event.stopPropagation();
    this.itemToDelete = dept;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.itemToDelete = null;
  }

  executeDelete(): void {
    if (!this.itemToDelete) return;
    this.http.delete<any>(`${this.deptApiUrl}/${this.itemToDelete._id}`).subscribe({
      next: (res) => {
        if (res.success) {
          this.showSuccess('Department deleted.');
          this.loadDepartments();
          this.loadVertical();
        } else {
          this.errorMessage = res.message || 'Failed to delete.';
        }
      },
      error: (err) => { this.errorMessage = err.error?.message || 'Failed to delete department.'; }
    });
    this.showDeleteModal = false;
    this.itemToDelete = null;
  }

  viewDepartment(deptId: string): void {
    this.router.navigate(['/departments', deptId]);
  }

  goBack(): void {
    this.router.navigate(['/verticals']);
  }


  getManagerNames(dept: VerticalDepartment): string {
    if (!dept.managerIds || dept.managerIds.length === 0) return 'Unassigned';
    return dept.managerIds.map((m: any) => m.employeeName || m).join(', ');
  }

  private showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => (this.successMessage = null), 3000);
  }
}
