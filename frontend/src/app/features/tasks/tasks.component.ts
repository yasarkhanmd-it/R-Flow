import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LucideAngularModule, BookOpen, Plus, Search, Calendar, CheckCircle, User, X, Loader, Trash2 } from 'lucide-angular';
import { ModuleService, Module } from '../../core/services/module.service';
import { ProjectService, Project } from '../../core/services/project.service';
import { TaskService } from '../../core/services/task.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

interface StoryCard {
  module: Module;
  projectName: string;
  projectId: string;
  taskCount: number;
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss'
})
export class TasksComponent implements OnInit {
  readonly BookOpen = BookOpen;
  readonly Plus = Plus;
  readonly Search = Search;
  readonly Calendar = Calendar;
  readonly CheckCircle = CheckCircle;
  readonly User = User;
  readonly X = X;
  readonly Loader = Loader;
  readonly Trash2 = Trash2;

  stories: StoryCard[] = [];
  filteredStories: StoryCard[] = [];
  availableProjects: Project[] = [];
  isLoading = true;
  searchTerm = '';

  // New Story dialog
  showNewStoryDialog = false;
  isSaving = false;
  newStory = {
    name: '',
    projectId: '',
    description: '',
    dueDate: ''
  };

  readonly statusTabs = ['All', 'Approved', 'Pending Approval', 'In Progress', 'Completed', 'Rejected'];
  activeTab = 0;

  private router = inject(Router);
  private projectService = inject(ProjectService);
  private moduleService = inject(ModuleService);
  private taskService = inject(TaskService);
  private authService = inject(AuthService);

  currentUser = this.authService.getCurrentUser();

  ngOnInit() {
    this.loadStories();
  }

  loadStories() {
    this.isLoading = true;

    this.projectService.getProjects().subscribe({
      next: (pRes) => {
        if (pRes.success) this.availableProjects = pRes.data;
      }
    });

    this.moduleService.getAllModules().pipe(
      switchMap(res => {
        if (!res.success || !res.data || res.data.length === 0) {
          return of([]);
        }
        const allModules = res.data;

        const taskCountRequests = allModules.map(mod => {
          const pId = typeof mod.projectId === 'string' ? mod.projectId : (mod.projectId as any)?._id || '';
          const pName = typeof mod.projectId === 'object' && mod.projectId?.name ? mod.projectId.name : 'Project';

          return this.taskService.getTasks({ moduleId: mod._id, projectId: pId }).pipe(
            map(taskRes => ({
              module: mod as Module,
              projectName: pName,
              projectId: pId,
              taskCount: taskRes.success && taskRes.data ? taskRes.data.length : 0
            } as StoryCard)),
            catchError(() => of({
              module: mod as Module,
              projectName: pName,
              projectId: pId,
              taskCount: 0
            } as StoryCard))
          );
        });

        return forkJoin(taskCountRequests);
      }),
      catchError(() => of([]))
    ).subscribe({
      next: (stories: StoryCard[]) => {
        this.stories = stories;
        this.filterStories();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  filterStories() {
    let filtered = [...this.stories];
    if (this.activeTab > 0) {
      const status = this.statusTabs[this.activeTab];
      filtered = filtered.filter(s => s.module.status === status);
    }
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.module.name.toLowerCase().includes(term) ||
        s.projectName.toLowerCase().includes(term)
      );
    }
    this.filteredStories = filtered;
  }

  setTab(index: number) {
    this.activeTab = index;
    this.filterStories();
  }

  onSearch(event: Event) {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.filterStories();
  }

  // ─── Navigate directly to Story Details (bypasses project board) ────────────
  openStory(story: StoryCard) {
    this.router.navigate(['/stories', story.module._id]);
  }

  deleteStory(story: StoryCard, event: Event) {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete story "${story.module.name}"?\nThis will also delete all tasks associated with this story.`)) {
      this.moduleService.deleteModule(story.module._id).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadStories();
          }
        },
        error: (err) => alert(err.error?.message || 'Failed to delete story')
      });
    }
  }

  // ─── New Story Dialog ───────────────────────────────────────────────────────
  openNewStoryDialog() {
    this.newStory = { name: '', projectId: '', description: '', dueDate: '' };
    this.showNewStoryDialog = true;
  }

  closeNewStoryDialog() {
    this.showNewStoryDialog = false;
  }

  saveNewStory() {
    if (!this.newStory.name.trim() || !this.newStory.projectId) {
      alert('Story Name and Project are required.');
      return;
    }
    this.isSaving = true;
    const payload = {
      name: this.newStory.name.trim(),
      projectId: this.newStory.projectId,
      description: this.newStory.description.trim(),
      dueDate: this.newStory.dueDate || undefined
    };
    this.moduleService.createModule(payload).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success) {
          this.closeNewStoryDialog();
          this.loadStories();
        } else {
          alert('Failed to create story.');
        }
      },
      error: (err) => {
        this.isSaving = false;
        alert(err.error?.message || 'Failed to create story.');
      }
    });
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────
  getStatusClass(status: string): string {
    switch (status) {
      case 'Approved': return 'status-approved';
      case 'Pending Approval': return 'status-pending';
      case 'In Progress': return 'status-inprogress';
      case 'Completed': return 'status-completed';
      case 'Rejected': return 'status-rejected';
      default: return 'status-draft';
    }
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'No due date';
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  getCreatorName(createdBy: any): string {
    if (!createdBy) return 'Unknown';
    return createdBy.employeeName || createdBy.name || 'Unknown';
  }

  isOverdue(dueDate?: string, status?: string): boolean {
    if (!dueDate || status === 'Completed') return false;
    return new Date(dueDate) < new Date();
  }
}
