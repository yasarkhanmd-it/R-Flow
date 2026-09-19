import { Component, EventEmitter, Output, Input, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { LucideAngularModule, X } from 'lucide-angular';
import { TaskService } from '../../../core/services/task.service';
import { ProjectService, Project } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss'
})
export class TaskFormComponent implements OnInit {
  @Input() task: any = null; // Passed when editing
  @Input() preselectedProjectId?: string;
  @Input() preselectedModuleId?: string;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  readonly X = X;

  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);

  taskForm: FormGroup;
  projects: Project[] = [];
  employees: any[] = [];

  taskTypes = ['Story', 'Task', 'Bug', 'Epic', 'Sub-task'];
  priorities = ['Critical', 'High', 'Medium', 'Low'];
  statuses = ['To Do', 'In Progress', 'Blocked', 'Completed', 'Pending Review', 'Done'];
  
  isSubmitting = false;
  isManager = false;
  isLead = false;
  currentUserId = '';

  constructor() {
    this.taskForm = this.fb.group({
      projectId: ['', Validators.required],
      moduleId: [''],
      summary: ['', Validators.required],
      description: [''],
      type: ['', Validators.required],
      priority: ['', Validators.required],
      status: [{value: 'To Do', disabled: true}, Validators.required],
      estimatedHours: [0, [Validators.min(0)]],
      assigneeId: [''],
      startDate: [''],
      dueDate: ['']
    }, { validators: this.dateValidator });
  }

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.isManager = user.role === 'Manager';
      this.isLead = user.role === 'Lead';
      const userRaw = JSON.parse(localStorage.getItem('rflow_auth_user') || '{}');
      this.currentUserId = user.id || userRaw._id;

      // Auto-assign to current user by default on creation
      if (!this.task) {
        this.taskForm.get('assigneeId')?.setValue(this.currentUserId);
      }
    }

    // Watch project changes to load corresponding members
    this.taskForm.get('projectId')?.valueChanges.subscribe(projId => {
      if (projId) this.loadProjectMembers(projId);
    });

    // If editing, pre-lock project and module immediately (before async calls)
    if (this.task) {
      const pId = this.task.projectId?._id || this.task.projectId;
      const mId = this.task.moduleId?._id || this.task.moduleId || this.preselectedModuleId || '';

      this.taskForm.patchValue({ projectId: pId, moduleId: mId });
      this.taskForm.get('projectId')?.disable();
      this.taskForm.get('moduleId')?.disable();
      this.taskForm.get('status')?.enable();
      this.loadProjectMembers(pId);
    } else {
      // Creating: apply preselected fields
      if (this.preselectedProjectId) {
        this.taskForm.patchValue({ projectId: this.preselectedProjectId });
        this.taskForm.get('projectId')?.disable();
        this.loadProjectMembers(this.preselectedProjectId);
      }
      if (this.preselectedModuleId) {
        this.taskForm.patchValue({ moduleId: this.preselectedModuleId });
        this.taskForm.get('moduleId')?.disable();
      }
    }

    this.loadProjects();
  }

  loadProjectMembers(projId: string) {
    if (!projId) {
      this.loadAllSystemUsers();
      return;
    }
    const project = this.projects.find(p => p._id === projId);
    if (project) {
      const list: any[] = [];

      // Add Manager
      if (project.managerId) {
        const mgrId = typeof project.managerId === 'string' ? project.managerId : (project.managerId as any)._id;
        const mgrName = typeof project.managerId === 'string' ? 'Manager' : ((project.managerId as any).employeeName || 'Manager');
        if (mgrId) list.push({ _id: mgrId, employeeName: `${mgrName} (Manager)` });
      }

      // Add Lead
      if (project.leadId) {
        const leadId = typeof project.leadId === 'string' ? project.leadId : (project.leadId as any)._id;
        const leadName = typeof project.leadId === 'string' ? 'Team Lead' : ((project.leadId as any).employeeName || 'Lead');
        if (leadId && !list.find(e => e._id === leadId)) {
          list.push({ _id: leadId, employeeName: `${leadName} (Lead)` });
        }
      }

      // Add Members
      if (project.members && Array.isArray(project.members)) {
        project.members.forEach((m: any) => {
          const mId = typeof m === 'string' ? m : m._id;
          const mName = typeof m === 'string' ? 'Member' : (m.employeeName || m.name || 'Member');
          if (mId && !list.find(e => e._id === mId)) {
            list.push({ _id: mId, employeeName: mName });
          }
        });
      }

      this.employees = list;
    }

    if (this.employees.length === 0) {
      this.loadAllSystemUsers();
    }
  }

  loadAllSystemUsers() {
    this.authService.getUsers().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.employees = res.data.map((u: any) => ({
            _id: u.id || u._id,
            employeeName: `${u.employeeName} (${u.role || 'User'})`
          }));
        }
      }
    });
  }

  loadProjects() {
    this.projectService.getProjects().subscribe({
      next: (res) => {
        if (res.success) {
          this.projects = res.data;

          const activeProjId = this.task ? (this.task.projectId?._id || this.task.projectId) : (this.preselectedProjectId || this.taskForm.get('projectId')?.value);
          if (activeProjId) {
            this.loadProjectMembers(activeProjId);
          } else {
            this.loadAllSystemUsers();
          }

          // In edit mode: patch remaining form fields once project list is available
          if (this.task) {
            this.taskForm.patchValue({
              summary: this.task.summary,
              description: this.task.description,
              type: this.task.type,
              priority: this.task.priority,
              status: this.task.status,
              estimatedHours: this.task.estimatedHours || 0,
              assigneeId: this.task.assigneeId?._id || this.task.assigneeId || '',
              startDate: this.task.startDate ? new Date(this.task.startDate).toISOString().substring(0, 10) : '',
              dueDate: this.task.dueDate ? new Date(this.task.dueDate).toISOString().substring(0, 10) : ''
            });

            // Apply role-based field restrictions for employees / non-creator leads
            if (this.isLead || (!this.isManager && !this.isLead)) {
              const repId = this.task.reporterId?._id || this.task.reporterId;
              const isCreator = repId === this.currentUserId;
              if (!isCreator) {
                this.taskForm.get('summary')?.disable();
                this.taskForm.get('description')?.disable();
                this.taskForm.get('type')?.disable();
                this.taskForm.get('priority')?.disable();
              }
            }
          }
        }
      },
      error: (err) => console.error('Error loading projects', err)
    });
  }

  get previewTaskId(): string {
    if (this.task) return this.task.taskId;
    const projectId = this.taskForm.get('projectId')?.value;
    if (!projectId) return 'Auto-generated';
    const project = this.projects.find(p => p._id === projectId);
    if (!project) return 'Auto-generated';
    
    const prefix = project.name
      .split(' ')
      .map((word: string) => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 4);
    
    return `${prefix}-XXX (Auto)`;
  }

  dateValidator(control: AbstractControl): ValidationErrors | null {
    const start = control.get('startDate')?.value;
    const due = control.get('dueDate')?.value;

    if (start && due && new Date(start) > new Date(due)) {
      return { dateMismatch: true };
    }
    return null;
  }

  onSubmit() {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const payload = this.taskForm.getRawValue();

    if (this.task) {
      this.taskService.updateTask(this.task._id, payload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          if (res.success) {
            this.save.emit();
            this.onClose();
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          alert(err.error?.message || 'Error updating task');
        }
      });
    } else {
      this.taskService.createTask(payload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          if (res.success) {
            this.save.emit();
            this.onClose();
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          alert(err.error?.message || 'Error creating task');
        }
      });
    }
  }

  onClose() {
    this.close.emit();
  }
}
