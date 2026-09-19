import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ArrowLeft, Plus, CheckCircle, Clock, Calendar, MessageSquare, Activity, Paperclip, MoreHorizontal, FileText, ChevronUp, ChevronDown, Filter, Search, XCircle, Edit2, Trash2, Eye } from 'lucide-angular';
import { ModuleService, Module } from '../../../core/services/module.service';
import { TaskService, Task } from '../../../core/services/task.service';
import { ProjectService, Project } from '../../../core/services/project.service';
import { TaskFormComponent } from '../../tasks/task-form/task-form.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-module-details',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule, TaskFormComponent],
  templateUrl: './module-details.component.html',
  styleUrl: './module-details.component.scss'
})
export class ModuleDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private moduleService = inject(ModuleService);
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);

  readonly ArrowLeft = ArrowLeft;
  readonly Plus = Plus;
  readonly CheckCircle = CheckCircle;
  readonly Clock = Clock;
  readonly Calendar = Calendar;
  readonly MessageSquare = MessageSquare;
  readonly Activity = Activity;
  readonly Paperclip = Paperclip;
  readonly MoreHorizontal = MoreHorizontal;
  readonly FileText = FileText;
  readonly ChevronUp = ChevronUp;
  readonly ChevronDown = ChevronDown;
  readonly Filter = Filter;
  readonly Search = Search;
  readonly XCircle = XCircle;
  readonly Edit2 = Edit2;
  readonly Trash2 = Trash2;
  readonly Eye = Eye;

  projectId: string = '';
  moduleId: string = '';
  project: Project | null = null;
  module: Module | null = null;
  tasks: Task[] = [];

  // true when navigated via /stories/:moduleId (not via project board)
  fromStories = false;

  activeTab: 'Tasks' | 'Comments' | 'Activity' | 'Attachments' = 'Tasks';
  showTaskForm = false;
  selectedTaskToEdit: Task | null = null;
  
  // ── Delete Modal ──────────────────────────────────────────────────────────
  showDeleteModal = false;
  itemToDelete: Task | null = null;
  deleteTitle = '';
  deleteMessage = '';

  searchQuery = '';
  searchSubject = new Subject<string>();
  selectedPriority = '';
  selectedStatus = '';
  selectedAssignee = '';
  sortBy = 'Newest';
  sortOrder: 'asc' | 'desc' = 'desc';
  page = 1;
  limit = 20;
  totalTasks = 0;
  totalPages = 1;
  
  isManager = false;
  isLead = false;
  currentUserId = '';
  projectMembers: any[] = [];
  
  selectedTaskDetails: Task | null = null;
  showTaskDetails = false;

  get completedTasksCount(): number {
    if (!this.module || this.totalTasks === 0) return 0;
    return Math.round((this.totalTasks * (this.module.progress || 0)) / 100);
  }

  get pendingTasksCount(): number {
    return this.totalTasks - this.completedTasksCount;
  }


  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.isManager = user.role === 'Manager';
      this.isLead = user.role === 'Lead';
      const userRaw = JSON.parse(localStorage.getItem('rflow_auth_user') || '{}');
      this.currentUserId = user.id || userRaw._id;
    }
    
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(val => {
      this.searchQuery = val;
      this.page = 1;
      this.loadTasks();
    });
    const routeId = this.route.snapshot.paramMap.get('id');
    this.moduleId = this.route.snapshot.paramMap.get('moduleId') || '';

    if (!routeId) {
      // Navigated via /stories/:moduleId — no projectId in URL
      this.fromStories = true;
      this.loadModuleFirst();
    } else {
      // Navigated via /projects/:id/modules/:moduleId
      this.projectId = routeId;
      this.loadProjectAndModule();
      this.loadTasks();
    }
  }

  /** When opened from My Stories, load the module first to get its projectId */
  loadModuleFirst() {
    this.moduleService.getModuleById(this.moduleId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.module = res.data;
          const rawProj = res.data.projectId;
          this.projectId = typeof rawProj === 'string' ? rawProj : (rawProj?._id || '');
          this.loadProjectAndModule();
          this.loadTasks();
        } else {
          this.fallbackLoadModule();
        }
      },
      error: () => this.fallbackLoadModule()
    });
  }

  fallbackLoadModule() {
    this.projectService.getProjects().subscribe({
      next: (res) => {
        if (!res.success) return;
        const projects = res.data;
        let found = false;

        const tryNext = (index: number) => {
          if (index >= projects.length || found) return;
          const proj = projects[index];
          this.moduleService.getModules(proj._id).subscribe({
            next: (modRes) => {
              if (modRes.success) {
                const match = modRes.data.find(m => m._id === this.moduleId);
                if (match) {
                  found = true;
                  this.projectId = proj._id;
                  this.project = proj;
                  this.module = match;
                  this.loadTasks();
                } else {
                  tryNext(index + 1);
                }
              } else {
                tryNext(index + 1);
              }
            },
            error: () => tryNext(index + 1)
          });
        };

        tryNext(0);
      }
    });
  }

  loadProjectAndModule() {
    this.projectService.getProjects().subscribe({
      next: (res) => {
        if (res.success) {
          this.project = res.data.find(p => p._id === this.projectId) || null;
          if (this.project && this.project.members) this.projectMembers = this.project.members;
        }
      }
    });

    this.moduleService.getModules(this.projectId).subscribe({
      next: (res) => {
        if (res.success) {
          this.module = res.data.find(m => m._id === this.moduleId) || null;
        }
      }
    });
  }

  loadTasks() {
    const filters = {
      projectId: this.projectId,
      moduleId: this.moduleId,
      page: this.page,
      limit: this.limit,
      search: this.searchQuery,
      priority: this.selectedPriority,
      status: this.selectedStatus,
      assigneeId: this.selectedAssignee,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };
    
    this.taskService.getTasks(filters).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.tasks = res.data;
          this.totalTasks = res.total || res.count;
          this.totalPages = res.totalPages || 1;
        }
      },
      error: (err) => console.error('Failed to load tasks', err)
    });
  }

  goBack() {
    if (this.fromStories) {
      this.router.navigate(['/tasks']);
    } else {
      this.router.navigate(['/projects', this.projectId, 'board']);
    }
  }

  approveModule() {
    if (!this.module) return;
    if (confirm(`Approve story "${this.module.name}"?`)) {
      this.moduleService.approveModule(this.module._id).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.module = res.data;
          }
        },
        error: (err) => alert(err.error?.message || 'Failed to approve story')
      });
    }
  }

  rejectModule() {
    if (!this.module) return;
    const reason = prompt('Please enter a rejection reason:');
    if (reason === null) return;
    if (!reason.trim()) {
      alert('A rejection reason is required.');
      return;
    }
    this.moduleService.rejectModule(this.module._id, reason).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.module = res.data;
        }
      },
      error: (err) => alert(err.error?.message || 'Failed to reject story')
    });
  }

  openNewTaskModal() {
    this.selectedTaskToEdit = null;
    this.showTaskForm = true;
  }

  editTask(task: Task, event: Event) {
    event.stopPropagation();
    this.selectedTaskToEdit = task;
    this.showTaskForm = true;
  }

  closeTaskForm() {
    this.showTaskForm = false;
    this.selectedTaskToEdit = null;
  }

  onTaskSaved() {
    this.loadTasks();
  }


  onSearch(event: any) {
    this.searchSubject.next(event.target.value);
  }

  onFilterChange() {
    this.page = 1;
    this.loadTasks();
  }

  setSort(field: string) {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'desc';
    }
    this.page = 1;
    this.loadTasks();
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadTasks();
    }
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.loadTasks();
    }
  }

  canEditTask(task: Task): boolean {
    if (this.isManager || this.isLead) return true;
    return task.reporterId?._id === this.currentUserId || task.reporterId === this.currentUserId;
  }

  canDeleteTask(): boolean {
    return this.isManager || this.isLead;
  }

  confirmDeleteTask(task: Task, event: Event) {
    event.stopPropagation();
    this.itemToDelete = task;
    this.deleteTitle = 'Delete Task';
    this.deleteMessage = `Are you sure you want to delete task "${task.summary}"?\nThis action cannot be undone.`;
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.itemToDelete = null;
  }

  executeDelete() {
    if (!this.itemToDelete) return;
    this.taskService.deleteTask(this.itemToDelete._id).subscribe({
      next: (res) => {
        if (res.success) this.loadTasks();
      },
      error: (err) => alert(err.error?.message || 'Failed to delete task')
    });
    this.showDeleteModal = false;
    this.itemToDelete = null;
  }

  openTaskDetails(task: Task) {
    this.selectedTaskDetails = task;
    this.showTaskDetails = true;
  }

  closeTaskDetails() {
    this.showTaskDetails = false;
    setTimeout(() => this.selectedTaskDetails = null, 300);
  }

  getInitials(name?: string): string {
    if (!name) return 'U';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  get completedTasks(): number {
    return Math.round((this.totalTasks || 0) * ((this.module?.progress || 0) / 100));
  }

  get pendingTasks(): number {
    return Math.max((this.totalTasks || 0) - this.completedTasks, 0);
  }

  getCreatedByName(): string {
    const createdBy = this.module?.createdBy;
    if (!createdBy) return 'N/A';
    if (typeof createdBy === 'string') return createdBy;
    return createdBy.employeeName || createdBy.name || 'N/A';
  }

  getStatusBadgeClass(status?: string): string {
    if (status === 'Approved' || status === 'Completed') return 'status-approved';
    if (status === 'Pending Approval' || status === 'Pending') return 'status-pending';
    if (status === 'Rejected') return 'status-rejected';
    return 'status-neutral';
  }

  formatHeaderDate(dateStr?: string): string {
    if (!dateStr) return 'No Date';
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`;
  }

}
