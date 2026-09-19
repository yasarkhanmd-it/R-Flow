import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule, Layers, Plus, Edit2, Trash2, X, CheckCircle, AlertCircle, Building2, Pencil, Search
} from 'lucide-angular';
import { VerticalService, Vertical } from '../../../core/services/vertical.service';
import { DepartmentService, Department } from '../../../core/services/department.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-vertical-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule],
  templateUrl: './vertical-list.component.html',
  styleUrl: './vertical-list.component.scss'
})
export class VerticalListComponent implements OnInit {
  // Icons
  readonly Layers = Layers;
  readonly Plus = Plus;
  readonly Edit2 = Edit2;
  readonly Trash2 = Trash2;
  readonly X = X;
  readonly CheckCircle = CheckCircle;
  readonly AlertCircle = AlertCircle;
  readonly Building2 = Building2;
  readonly Pencil = Pencil;
  readonly Search = Search;

  // Data State
  departments: Department[] = [];
  verticals: Vertical[] = [];
  isLoading = true;
  
  // View Toggle & Search State
  activeTab: 'all' | 'departments' | 'verticals' = 'all';
  deptSearchQuery = '';
  vertSearchQuery = '';

  // Quick Add Inputs
  newDepartmentName = '';
  newVerticalName = '';
  
  // Action state flags
  isAddingDept = false;
  isAddingVert = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Modal State for Rename / Edit
  showRenameModal = false;
  renameType: 'department' | 'vertical' = 'department';
  renameItem: any = null;
  renameName = '';
  isSubmittingRename = false;

  // Modal State for Delete
  showDeleteModal = false;
  deleteType: 'department' | 'vertical' = 'department';
  deleteItem: any = null;
  isSubmittingDelete = false;

  get filteredDepartments(): Department[] {
    if (!this.deptSearchQuery.trim()) return this.departments;
    const q = this.deptSearchQuery.toLowerCase().trim();
    return this.departments.filter(d => (d.departmentName || '').toLowerCase().includes(q));
  }

  get filteredVerticals(): Vertical[] {
    if (!this.vertSearchQuery.trim()) return this.verticals;
    const q = this.vertSearchQuery.toLowerCase().trim();
    return this.verticals.filter(v => (v.name || '').toLowerCase().includes(q));
  }

  private readonly verticalService = inject(VerticalService);
  private readonly departmentService = inject(DepartmentService);
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    let loadedCount = 0;
    const checkDone = () => {
      loadedCount++;
      if (loadedCount >= 2) {
        this.isLoading = false;
      }
    };

    // Load Departments
    this.departmentService.getDepartments().subscribe({
      next: (res) => {
        if (res.success) {
          this.departments = res.data;
        }
        checkDone();
      },
      error: (err) => {
        console.error('Failed to load departments', err);
        checkDone();
      }
    });

    // Load Verticals
    this.verticalService.getVerticals().subscribe({
      next: (res) => {
        if (res.success) {
          this.verticals = res.data;
        }
        checkDone();
      },
      error: (err) => {
        console.error('Failed to load verticals', err);
        checkDone();
      }
    });
  }

  // Quick Add Department
  addDepartment(): void {
    const name = this.newDepartmentName.trim();
    if (!name || this.isAddingDept) return;

    this.isAddingDept = true;
    this.errorMessage = null;

    this.departmentService.createDepartment({ departmentName: name }).subscribe({
      next: (res) => {
        this.isAddingDept = false;
        if (res.success) {
          this.newDepartmentName = '';
          this.showSuccess(`Department "${name}" added successfully.`);
          this.loadAllData();
        }
      },
      error: (err) => {
        this.isAddingDept = false;
        this.errorMessage = err.error?.message || 'Failed to add department.';
      }
    });
  }

  // Quick Add Business Vertical
  addVertical(): void {
    const name = this.newVerticalName.trim();
    if (!name || this.isAddingVert) return;

    this.isAddingVert = true;
    this.errorMessage = null;

    this.verticalService.createVertical({ name }).subscribe({
      next: (res) => {
        this.isAddingVert = false;
        if (res.success) {
          this.newVerticalName = '';
          this.showSuccess(`Business vertical "${name}" added successfully.`);
          this.loadAllData();
        }
      },
      error: (err) => {
        this.isAddingVert = false;
        this.errorMessage = err.error?.message || 'Failed to add business vertical.';
      }
    });
  }

  // Open Rename Modal
  openRenameModal(type: 'department' | 'vertical', item: any): void {
    this.renameType = type;
    this.renameItem = item;
    this.renameName = type === 'department' ? item.departmentName : item.name;
    this.showRenameModal = true;
    this.errorMessage = null;
  }

  closeRenameModal(): void {
    this.showRenameModal = false;
    this.renameItem = null;
    this.renameName = '';
  }

  saveRename(): void {
    const newName = this.renameName.trim();
    if (!newName || !this.renameItem || this.isSubmittingRename) return;

    this.isSubmittingRename = true;
    this.errorMessage = null;

    const handleResponse = {
      next: (res: any) => {
        this.isSubmittingRename = false;
        if (res.success) {
          this.showSuccess(`${this.renameType === 'department' ? 'Department' : 'Vertical'} updated successfully.`);
          this.closeRenameModal();
          this.loadAllData();
        }
      },
      error: (err: any) => {
        this.isSubmittingRename = false;
        this.errorMessage = err.error?.message || 'Failed to rename item.';
      }
    };

    if (this.renameType === 'department') {
      this.departmentService.updateDepartment(this.renameItem._id, { departmentName: newName }).subscribe(handleResponse);
    } else {
      this.verticalService.updateVertical(this.renameItem._id, { name: newName }).subscribe(handleResponse);
    }
  }

  // Delete Dialog
  confirmDelete(type: 'department' | 'vertical', item: any): void {
    this.deleteType = type;
    this.deleteItem = item;
    this.showDeleteModal = true;
    this.errorMessage = null;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.deleteItem = null;
  }

  executeDelete(): void {
    if (!this.deleteItem || this.isSubmittingDelete) return;

    this.isSubmittingDelete = true;
    this.errorMessage = null;

    const handleResponse = {
      next: (res: any) => {
        this.isSubmittingDelete = false;
        if (res.success) {
          this.showSuccess(`${this.deleteType === 'department' ? 'Department' : 'Business vertical'} deleted successfully.`);
          this.cancelDelete();
          this.loadAllData();
        }
      },
      error: (err: any) => {
        this.isSubmittingDelete = false;
        this.errorMessage = err.error?.message || 'Failed to delete item.';
        this.cancelDelete();
      }
    };

    if (this.deleteType === 'department') {
      this.departmentService.deleteDepartment(this.deleteItem._id).subscribe(handleResponse);
    } else {
      this.verticalService.deleteVertical(this.deleteItem._id).subscribe(handleResponse);
    }
  }

  // Format INR Currency
  formatCurrencyShort(val?: number): string {
    if (val === undefined || val === null || val === 0 || isNaN(val)) return '—';
    const absVal = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (absVal >= 10000000) {
      return `${sign}₹${(absVal / 10000000).toFixed(1)} Cr`;
    } else if (absVal >= 100000) {
      return `${sign}₹${(absVal / 100000).toFixed(0)} L`;
    } else if (absVal >= 1000) {
      return `${sign}₹${(absVal / 1000).toFixed(0)} K`;
    }
    return `${sign}₹${absVal.toLocaleString()}`;
  }

  private showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => {
      if (this.successMessage === msg) this.successMessage = null;
    }, 3500);
  }
}
