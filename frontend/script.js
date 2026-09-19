const fs = require('fs');
const file = 'd:/rflow/frontend/src/app/features/projects/module-details/module-details.component.ts';
let code = fs.readFileSync(file, 'utf8');

// Imports
code = code.replace(/import { CommonModule } from '@angular\/common';/, 
  'import { CommonModule } from \'@angular/common\';\nimport { Subject } from \'rxjs\';\nimport { debounceTime, distinctUntilChanged } from \'rxjs/operators\';');

code = code.replace(/readonly FileText = FileText;/, 
  'readonly FileText = FileText;\n  readonly ChevronUp = require(\'lucide-angular\').ChevronUp;\n  readonly ChevronDown = require(\'lucide-angular\').ChevronDown;\n  readonly Filter = require(\'lucide-angular\').Filter;\n  readonly Search = require(\'lucide-angular\').Search;\n  readonly XCircle = require(\'lucide-angular\').XCircle;\n  readonly Edit2 = require(\'lucide-angular\').Edit2;\n  readonly Trash2 = require(\'lucide-angular\').Trash2;\n  readonly Eye = require(\'lucide-angular\').Eye;');

// Add Lucide imports
code = code.replace(/import { LucideAngularModule, [^}]+ } from 'lucide-angular';/, 
  'import { LucideAngularModule, ArrowLeft, Plus, CheckCircle, Clock, Calendar, MessageSquare, Activity, Paperclip, MoreHorizontal, FileText, ChevronUp, ChevronDown, Filter, Search, XCircle, Edit2, Trash2, Eye } from \'lucide-angular\';');

// Add state variables
const stateVars = `
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
`;
code = code.replace(/selectedTaskToEdit: Task \| null = null;/, 'selectedTaskToEdit: Task | null = null;\n' + stateVars);

// Update ngOnInit to load user and setup search debounce
code = code.replace(/ngOnInit\(\) {/, `ngOnInit() {
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
    });`);

// Update loadProjectAndModule to load members
code = code.replace(/this\.project = res\.data\.find\(p => p\._id === this\.projectId\) \|\| null;/, 
  'this.project = res.data.find(p => p._id === this.projectId) || null;\n          if (this.project && this.project.members) this.projectMembers = this.project.members;');

// Replace loadTasks completely
code = code.replace(/loadTasks\(\) {[\s\S]*?error: \(err\) => console\.error\('Failed to load tasks', err\)\s*}\);\s*}/, 
`loadTasks() {
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
  }`);

// Add table helpers
const tableHelpers = `
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

  deleteTask(task: Task, event: Event) {
    event.stopPropagation();
    if (confirm(\`Are you sure you want to delete task "\${task.summary}"?\`)) {
      this.taskService.deleteTask(task._id).subscribe({
        next: (res) => {
          if (res.success) this.loadTasks();
        },
        error: (err) => alert(err.error?.message || 'Failed to delete task')
      });
    }
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

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return \`\${date.getDate()}-\${months[date.getMonth()]}-\${date.getFullYear()}\`;
  }
`;

code = code.replace(/onTaskSaved\(\) {\s*this\.loadTasks\(\);\s*}/, `onTaskSaved() {\n    this.loadTasks();\n  }\n\n${tableHelpers}`);

fs.writeFileSync(file, code);
