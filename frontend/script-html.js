const fs = require('fs');
const file = 'd:/rflow/frontend/src/app/features/projects/module-details/module-details.component.html';

const html = `
<div class="module-details-page" [class.drawer-open]="showTaskDetails">
  <!-- Story Details Header -->
  <header class="module-header">
    <div class="header-top">
      <div class="module-info" *ngIf="module; else loadingHeader">
        <button class="btn-back" (click)="goBack()" [title]="fromStories ? 'Back to My Stories' : 'Back to Project'">
          <lucide-icon [img]="ArrowLeft" [size]="20"></lucide-icon>
          <span class="back-label">{{ fromStories ? 'My Stories' : 'Project' }}</span>
        </button>
        <div class="module-title-wrapper">
          <!-- Story name + status -->
          <div class="title-row">
            <h2>{{ module.name }}</h2>
            <span class="badge" [ngClass]="{
              'badge-warning': module.status === 'Pending Approval',
              'badge-success': module.status === 'Approved' || module.status === 'Completed',
              'badge-danger':  module.status === 'Rejected',
              'badge-info':    module.status === 'In Progress' || module.status === 'Draft'
            }">{{ module.status }}</span>
          </div>

          <!-- Project + progress chips -->
          <div class="story-meta-row">
            <span class="meta-chip project-chip">
              <lucide-icon [img]="FileText" [size]="12"></lucide-icon>
              {{ project?.name || '...' }}
            </span>
            <span class="meta-chip progress-chip">
              <lucide-icon [img]="MoreHorizontal" [size]="12"></lucide-icon>
              Total Tasks: <strong>{{ totalTasks }}</strong>
            </span>
            <span class="meta-chip progress-chip">
              <lucide-icon [img]="CheckCircle" [size]="12"></lucide-icon>
              Progress: <strong>{{ module.progress || 0 }}%</strong>
            </span>
            <span class="meta-chip progress-chip">
              <lucide-icon [img]="Calendar" [size]="12"></lucide-icon>
              Due: <strong>{{ module.dueDate ? formatDate(module.dueDate) : 'No Date' }}</strong>
            </span>
          </div>

          <!-- Progress bar -->
          <div class="story-progress-bar-wrap">
            <div class="story-progress-track">
              <div class="story-progress-fill" [style.width.%]="module.progress || 0"></div>
            </div>
          </div>

          <p class="module-desc">{{ module.description || 'No description provided.' }}</p>
        </div>
        
        <div class="header-actions">
           <button class="btn-primary-custom" (click)="openNewTaskModal()">
             <lucide-icon [img]="Plus" [size]="18"></lucide-icon>
             <span>Add Task</span>
           </button>
        </div>
      </div>

      <!-- Loading skeleton -->
      <ng-template #loadingHeader>
        <div class="header-skeleton">
          <div class="sk-line sk-title"></div>
          <div class="sk-line sk-subtitle"></div>
        </div>
      </ng-template>
    </div>

    <!-- Tabs -->
    <div class="module-tabs">
      <button class="tab-btn" [class.active]="activeTab === 'Tasks'"       (click)="activeTab = 'Tasks'">Tasks</button>
      <button class="tab-btn" [class.active]="activeTab === 'Comments'"    (click)="activeTab = 'Comments'">Comments</button>
      <button class="tab-btn" [class.active]="activeTab === 'Activity'"    (click)="activeTab = 'Activity'">Activity</button>
      <button class="tab-btn" [class.active]="activeTab === 'Attachments'" (click)="activeTab = 'Attachments'">Attachments</button>
    </div>
  </header>

  <!-- Content -->
  <div class="module-content">
    <!-- Tasks Tab -->
    <div *ngIf="activeTab === 'Tasks'" class="tasks-tab">
      
      <!-- Enterprise Table Controls -->
      <div class="table-controls">
        <div class="search-box">
          <lucide-icon [img]="Search" [size]="16" class="search-icon"></lucide-icon>
          <input type="text" placeholder="Search tasks..." [value]="searchQuery" (keyup)="onSearch($event)">
        </div>
        
        <div class="filter-group">
          <select [(ngModel)]="selectedPriority" (change)="onFilterChange()" class="filter-select">
            <option value="">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          
          <select [(ngModel)]="selectedStatus" (change)="onFilterChange()" class="filter-select">
            <option value="">All Statuses</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Blocked">Blocked</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Completed">Completed</option>
            <option value="Done">Done</option>
          </select>
          
          <select [(ngModel)]="selectedAssignee" (change)="onFilterChange()" class="filter-select">
            <option value="">All Assignees</option>
            <option *ngFor="let member of projectMembers" [value]="member._id">{{ member.employeeName }}</option>
          </select>
        </div>
      </div>

      <div class="table-responsive">
        <table class="enterprise-table">
          <thead>
            <tr>
              <th (click)="setSort('taskId')" class="sortable">
                Task ID
                <lucide-icon *ngIf="sortBy === 'taskId'" [img]="sortOrder === 'asc' ? ChevronUp : ChevronDown" [size]="14"></lucide-icon>
              </th>
              <th (click)="setSort('Task Name')" class="sortable">
                Task Name
                <lucide-icon *ngIf="sortBy === 'Task Name'" [img]="sortOrder === 'asc' ? ChevronUp : ChevronDown" [size]="14"></lucide-icon>
              </th>
              <th>Assignee</th>
              <th (click)="setSort('Priority')" class="sortable">
                Priority
                <lucide-icon *ngIf="sortBy === 'Priority'" [img]="sortOrder === 'asc' ? ChevronUp : ChevronDown" [size]="14"></lucide-icon>
              </th>
              <th>Status</th>
              <th (click)="setSort('Due Date')" class="sortable">
                Due Date
                <lucide-icon *ngIf="sortBy === 'Due Date'" [img]="sortOrder === 'asc' ? ChevronUp : ChevronDown" [size]="14"></lucide-icon>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="tasks.length === 0">
              <td colspan="7" class="empty-state">
                <lucide-icon [img]="FileText" [size]="40" class="empty-icon"></lucide-icon>
                <h4>No tasks found</h4>
                <p>Try adjusting your filters or <a href="javascript:void(0)" (click)="openNewTaskModal()">add a new task</a>.</p>
              </td>
            </tr>
            <tr *ngFor="let task of tasks" (click)="openTaskDetails(task)" [ngClass]="{
              'row-todo': task.status === 'To Do',
              'row-in-progress': task.status === 'In Progress' || task.status === 'Pending Review',
              'row-completed': task.status === 'Completed' || task.status === 'Done',
              'row-blocked': task.status === 'Blocked'
            }">
              <td class="col-id">{{ task.taskId }}</td>
              <td class="col-name">{{ task.summary }}</td>
              <td class="col-assignee">
                <div class="assignee-cell" *ngIf="task.assigneeId; else unassigned">
                  <div class="avatar" [title]="task.assigneeId.employeeName">
                    {{ getInitials(task.assigneeId.employeeName) }}
                  </div>
                  <span>{{ task.assigneeId.employeeName }}</span>
                </div>
                <ng-template #unassigned><span class="text-muted">Unassigned</span></ng-template>
              </td>
              <td class="col-priority">
                <span class="priority-badge" [ngClass]="'prio-' + task.priority.toLowerCase()">{{ task.priority }}</span>
              </td>
              <td class="col-status">
                <span class="status-badge" [ngClass]="{
                  'badge-todo': task.status === 'To Do',
                  'badge-in-progress': task.status === 'In Progress' || task.status === 'Pending Review',
                  'badge-completed': task.status === 'Completed' || task.status === 'Done',
                  'badge-blocked': task.status === 'Blocked'
                }">{{ task.status }}</span>
              </td>
              <td class="col-date">{{ formatDate(task.dueDate) }}</td>
              <td class="col-actions" (click)="$event.stopPropagation()">
                <button class="action-btn" title="View Details" (click)="openTaskDetails(task)">
                  <lucide-icon [img]="Eye" [size]="16"></lucide-icon>
                </button>
                <button class="action-btn edit-btn" *ngIf="canEditTask(task)" title="Edit Task" (click)="editTask(task, $event)">
                  <lucide-icon [img]="Edit2" [size]="16"></lucide-icon>
                </button>
                <button class="action-btn delete-btn" *ngIf="canDeleteTask()" title="Delete Task" (click)="deleteTask(task, $event)">
                  <lucide-icon [img]="Trash2" [size]="16"></lucide-icon>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination-controls" *ngIf="totalPages > 1">
        <button class="page-btn" [disabled]="page === 1" (click)="prevPage()">Previous</button>
        <span class="page-info">Page {{ page }} of {{ totalPages }}</span>
        <button class="page-btn" [disabled]="page === totalPages" (click)="nextPage()">Next</button>
      </div>

    </div>

    <!-- Placeholder Tabs -->
    <div *ngIf="activeTab === 'Comments' || activeTab === 'Activity' || activeTab === 'Attachments'" class="placeholder-tab">
      <h3>{{ activeTab }}</h3>
      <p>This section is under construction.</p>
    </div>
  </div>

  <!-- Task Details Side Drawer -->
  <div class="task-drawer-overlay" *ngIf="showTaskDetails" (click)="closeTaskDetails()"></div>
  <div class="task-drawer" [class.open]="showTaskDetails">
    <div class="drawer-header" *ngIf="selectedTaskDetails">
      <div class="drawer-title">
        <span class="drawer-task-id">{{ selectedTaskDetails.taskId }}</span>
        <h3>{{ selectedTaskDetails.summary }}</h3>
      </div>
      <button class="drawer-close" (click)="closeTaskDetails()">
        <lucide-icon [img]="XCircle" [size]="24"></lucide-icon>
      </button>
    </div>
    <div class="drawer-content" *ngIf="selectedTaskDetails">
      <div class="detail-section">
        <h4>Task Information</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <label>Status</label>
            <span class="status-badge badge-{{ selectedTaskDetails.status.toLowerCase().replace(' ', '-') }}">{{ selectedTaskDetails.status }}</span>
          </div>
          <div class="detail-item">
            <label>Priority</label>
            <span class="priority-badge prio-{{ selectedTaskDetails.priority.toLowerCase() }}">{{ selectedTaskDetails.priority }}</span>
          </div>
          <div class="detail-item">
            <label>Assignee</label>
            <span>{{ selectedTaskDetails.assigneeId?.employeeName || 'Unassigned' }}</span>
          </div>
          <div class="detail-item">
            <label>Created By</label>
            <span>{{ selectedTaskDetails.reporterId?.employeeName }}</span>
          </div>
          <div class="detail-item">
            <label>Due Date</label>
            <span>{{ formatDate(selectedTaskDetails.dueDate) }}</span>
          </div>
          <div class="detail-item">
            <label>Est. Hours</label>
            <span>{{ selectedTaskDetails.estimatedHours || 0 }} h</span>
          </div>
        </div>
      </div>
      
      <div class="detail-section">
        <h4>Description</h4>
        <div class="detail-description">
          {{ selectedTaskDetails.description || 'No description provided.' }}
        </div>
      </div>
      
      <div class="detail-section">
        <h4>Comments & Activity</h4>
        <div class="placeholder-block">
          <lucide-icon [img]="MessageSquare" [size]="20"></lucide-icon>
          <p>Comments feature coming soon.</p>
        </div>
      </div>
    </div>
    <div class="drawer-footer" *ngIf="selectedTaskDetails">
       <button class="btn-primary-custom" *ngIf="canEditTask(selectedTaskDetails)" (click)="editTask(selectedTaskDetails, $event); closeTaskDetails()">Edit Task</button>
    </div>
  </div>

</div>

<app-task-form
  *ngIf="showTaskForm"
  [task]="selectedTaskToEdit"
  [preselectedProjectId]="projectId"
  [preselectedModuleId]="moduleId"
  (close)="closeTaskForm()"
  (save)="onTaskSaved()">
</app-task-form>
`;
fs.writeFileSync(file, html);
