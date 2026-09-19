import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { 
  LucideAngularModule, 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter, 
  RotateCcw, 
  Edit, 
  Eye, 
  MoreHorizontal, 
  MessageSquare, 
  Paperclip, 
  Calendar, 
  User, 
  AlertCircle,
  FileText,
  CheckCircle,
  Activity,
  FolderOpen,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  X,
  Copy,
  Clock
, LayoutDashboard, Briefcase, Box, ShieldAlert, PieChart, CheckSquare, Users, UserPlus, Flag } from 'lucide-angular';
import { TaskService, Task } from '../../../core/services/task.service';
import { ProjectService, Project, ProjectOverview } from '../../../core/services/project.service';
import { ModuleService, Module } from '../../../core/services/module.service';
import { MilestoneService, Milestone } from '../../../core/services/milestone.service';
import { RiskService, Risk } from '../../../core/services/risk.service';
import { IssueService, Issue } from '../../../core/services/issue.service';
import { ChangeRequestService, ChangeRequest } from '../../../core/services/change-request.service';
import { BomService, Bom, BomRevision, BomItem } from '../../../core/services/bom.service';
import { FinancialService, Transaction, FinancialSummary } from '../../../core/services/financial.service';
import { GanttService, GanttData, GanttItem } from '../../../core/services/gantt.service';
import { ResourceService, ResourceAllocation, WorkLog, ResourceUtilizationSummary } from '../../../core/services/resource.service';
import { ProcurementService } from '../../../core/services/procurement.service';
import { AuthService } from '../../../core/services/auth.service';
import { WorkflowService, ProjectDepartment } from '../../../core/services/workflow.service';
import { DepartmentService, Department } from '../../../core/services/department.service';
import { VerticalService, Vertical } from '../../../core/services/vertical.service';
import { TaskFormComponent } from '../../tasks/task-form/task-form.component';
import { ModuleFormComponent } from '../module-form/module-form.component';
import { ProjectProcurementComponent } from '../project-procurement/project-procurement.component';
import { timer, Subscription } from 'rxjs';

interface RichTask extends Task {
  module: string;
  commentCount: number;
  attachmentCount: number;
}

@Component({
  selector: 'app-project-board',
  standalone: true,
  imports: [CommonModule, DragDropModule, LucideAngularModule, FormsModule, TaskFormComponent, ModuleFormComponent, ProjectProcurementComponent],
  templateUrl: './project-board.component.html',
  styleUrl: './project-board.component.scss'
})
export class ProjectBoardComponent implements OnInit, OnDestroy {
  // Lucide Icons
  readonly ArrowLeft = ArrowLeft;
  readonly Plus = Plus;
  readonly Search = Search;
  readonly Filter = Filter;
  readonly RotateCcw = RotateCcw;
  readonly Edit = Edit;
  readonly Eye = Eye;
  readonly MoreHorizontal = MoreHorizontal;
  readonly MessageSquare = MessageSquare;
  readonly Paperclip = Paperclip;
  readonly Calendar = Calendar;
  readonly User = User;
  readonly AlertCircle = AlertCircle;
  readonly FileText = FileText;
  readonly CheckCircle = CheckCircle;
  readonly Activity = Activity;
  readonly FolderOpen = FolderOpen;
  readonly Trash2 = Trash2;
  readonly ChevronDown = ChevronDown;
  readonly ChevronRight = ChevronRight;
  readonly AlertTriangle = AlertTriangle;
  readonly X = X;
  readonly Copy = Copy;
  readonly Clock = Clock;
  readonly Math = Math;
  readonly LayoutDashboard = LayoutDashboard;
  readonly Briefcase = Briefcase;
  readonly Box = Box;
  readonly ShieldAlert = ShieldAlert;
  readonly PieChart = PieChart;
  readonly CheckSquare = CheckSquare;
  readonly Users = Users;
  readonly UserPlus = UserPlus;
  readonly Flag = Flag;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  private moduleService = inject(ModuleService);
  private authService = inject(AuthService);
  private workflowService = inject(WorkflowService);
  private departmentService = inject(DepartmentService);
  private milestoneService = inject(MilestoneService);
  private riskService = inject(RiskService);
  private issueService = inject(IssueService);
  private crService = inject(ChangeRequestService);
  private bomService = inject(BomService);
  private financialService = inject(FinancialService);
  private ganttService = inject(GanttService);
  private resourceService = inject(ResourceService);
  private procurementService = inject(ProcurementService);
  private verticalService = inject(VerticalService);

  allVerticalsList: Vertical[] = [];

  projectId: string = '';
  project: Project | null = null;
  tasks: RichTask[] = [];
  isLoading = true;

  isManager = false;
  isLead = false;
  isUnitHead = false;
  currentUserId = '';
  recentActivities: any[] = [];

  // Stats
  totalTasks = 0;
  completedTasks = 0;
  pendingTasks = 0;
  progressPercentage = 0;

  // Filter States
  searchQuery: string = '';
  selectedPriority: string = '';
  selectedStatus: string = '';
  selectedAssignee: string = '';
  selectedType: string = '';

  // Options for Dropdowns
  priorities = ['Critical', 'High', 'Medium', 'Low'];
  statuses = ['To Do', 'In Progress', 'Blocked', 'Completed', 'Pending Review', 'Done'];
  taskTypes = ['Story', 'Task', 'Bug', 'Epic', 'Sub-task'];

  // Columns for Drag and Drop (Filtered Sets)
  todoTasks: RichTask[] = [];
  inProgressTasks: RichTask[] = [];
  reviewTasks: RichTask[] = [];
  doneTasks: RichTask[] = [];

  // Modal Control
  showTaskForm = false;
  selectedTaskToEdit: Task | null = null;
  
  // Delete Modal Control
  showDeleteModal = false;
  itemToDelete: Task | null = null;
  deleteTitle = '';
  deleteMessage = '';

  // Tabs
  activeTab: 'Overview' | 'Board' | 'Milestones' | 'Risks' | 'Timeline' | 'Modules' | 'Story' | 'Departments' | 'Members' | 'Reports' | 'Settings' | 'Issues' | 'BOM' | 'Financials' | 'Resources' | 'Procurement' = 'Overview';

  // Overview data
  overviewData: ProjectOverview | null = null;
  overviewLoading = false;

  // Dropdown state
  openDropdown: string = '';

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    this.openDropdown = '';
  }

  toggleDropdown(dropdown: string, event: Event) {
    event.stopPropagation();
    if (this.openDropdown === dropdown) {
      this.openDropdown = '';
    } else {
      this.openDropdown = dropdown;
    }
  }


  // Timeline / Gantt Data
  timelineViewMode: 'modules' | 'tasks' = 'modules';
  ganttData: GanttData | null = null;
  ganttLoading = false;
  ganttScale: 'day' | 'week' | 'month' = 'month';
  ganttGroupBy: 'milestone' | 'module' | 'none' = 'module';
  ganttSearchQuery = '';
  ganttStatusFilter = '';
  ganttHeaders: { top: string; bottom: string; date: Date; isToday: boolean; isWeekend: boolean }[] = [];
  flatGanttRows: any[] = [];
  expandedGanttRows: Record<string, boolean> = {};
  ganttStartDate: Date = new Date();
  ganttEndDate: Date = new Date();
  ganttColWidth = 140; // Default for month scale
  hoveredGanttItem: GanttItem | null = null;
  ganttTooltipX = 0;
  ganttTooltipY = 0;

  get modulesShown(): number {
    return this.ganttData ? this.ganttData.modules.length : 0;
  }

  get tasksShown(): number {
    return this.ganttData ? this.ganttData.tasks.length : 0;
  }

  get onTrackCount(): number {
    if (!this.ganttData) return 0;
    return this.ganttData.modules.filter(m => m.status === 'On Track' || m.status === 'Completed' || m.status === 'In Progress').length;
  }

  get atRiskCount(): number {
    if (!this.ganttData) return 0;
    return this.ganttData.modules.filter(m => m.status === 'At Risk').length;
  }

  get delayedCount(): number {
    if (!this.ganttData) return 0;
    return this.ganttData.modules.filter(m => m.status === 'Delayed').length;
  }

  get behindBaselineCount(): number {
    return this.delayedCount;
  }

  setTimelineViewMode(mode: 'modules' | 'tasks') {
    this.timelineViewMode = mode;
    this.ganttGroupBy = 'module'; 
    this.buildFlatGanttRows();
  }

  // Milestones Data
  milestones: Milestone[] = [];
  milestonesLoading = false;
  showMilestoneModal = false;
  editingMilestone: Milestone | null = null;
  isSavingMilestone = false;
  milestoneError: string | null = null;
  showDeleteMilestoneModal = false;
  milestoneToDelete: Milestone | null = null;
  userList: any[] = [];

  milestoneForm = {
    name: '',
    description: '',
    plannedStart: '',
    plannedEnd: '',
    actualEnd: '',
    ownerId: '',
    status: 'Not Started',
    progress: 0
  };

  // Risks Data
  risks: Risk[] = [];
  risksLoading = false;
  showRiskModal = false;
  editingRisk: Risk | null = null;
  isSavingRisk = false;
  riskError: string | null = null;
  showDeleteRiskModal = false;
  riskToDelete: Risk | null = null;

  riskForm: any = {
    title: '',
    description: '',
    probability: 'Medium',
    impact: 'Medium',
    severity: 'Medium',
    status: 'Identified',
    mitigationPlan: '',
    ownerId: ''
  };

  // Modules Data
  modules: Module[] = [];
  showModuleForm = false;

  // Departments Data
  projectDepartments: ProjectDepartment[] = [];
  allDepartments: Department[] = [];
  deptLoading = false;
  showAddDeptModal = false;
  selectedDeptId = '';
  deptError: string | null = null;
  deptSuccess: string | null = null;

  // Resource & Effort Management Data
  resourceAllocations: ResourceAllocation[] = [];
  resourceUtilization: ResourceUtilizationSummary | null = null;
  resourcesLoading = false;
  showAddAllocationModal = false;
  allocationForm = {
    userId: '',
    departmentId: '',
    projectRole: 'Team Member',
    allocationPercentage: 100,
    startDate: '',
    endDate: '',
    status: 'Active' as 'Active' | 'Inactive' | 'Completed'
  };

  showWorkLogModal = false;
  selectedTaskForWorkLog: Task | null = null;
  taskWorkLogs: WorkLog[] = [];
  workLogForm = {
    hoursLogged: 1,
    workDate: '',
    description: ''
  };

  switchTab(tab: 'Overview' | 'Board' | 'Milestones' | 'Risks' | 'Timeline' | 'Modules' | 'Story' | 'Departments' | 'Members' | 'Reports' | 'Settings' | 'Issues' | 'BOM' | 'Financials' | 'Resources' | 'Procurement') {
    this.activeTab = tab;
    this.openDropdown = '';
    if (tab === 'Overview') {
      this.loadOverview();
    }
    if (tab === 'Board') {
      this.loadTasks();
    }
    if (tab === 'Milestones') {
      this.loadMilestones();
    }
    if (tab === 'Risks') {
      this.loadRisks();
    }
    if (tab === 'Timeline') {
      this.loadGanttData();
    }
    if (tab === 'Issues') {
      this.loadIssuesAndCRs();
    }
    if (tab === 'BOM') {
      this.loadBoms();
    }
    if (tab === 'Financials') {
      this.loadFinancials();
    }
    if (tab === 'Modules' || tab === 'Story') {
      this.loadModules();
    }
    if (tab === 'Departments') {
      this.loadProjectDepartments();
    }
    if (tab === 'Resources') {
      this.loadResourceData();
    }
  }

  // ── Resource Management Methods ──────────────────────────────────────────
  loadResourceData() {
    if (!this.projectId) return;
    this.resourcesLoading = true;
    this.loadUsersList();
    this.loadProjectDepartments();

    this.resourceService.getProjectResources(this.projectId).subscribe({
      next: (res) => {
        if (res.success) {
          this.resourceAllocations = res.data;
        }
      },
      error: (err) => console.error('Failed to load resources', err)
    });

    this.resourceService.getProjectResourceUtilization(this.projectId).subscribe({
      next: (res) => {
        this.resourcesLoading = false;
        if (res.success) {
          this.resourceUtilization = res.data;
        }
      },
      error: (err) => {
        this.resourcesLoading = false;
        console.error('Failed to load utilization', err);
      }
    });
  }

  openAddAllocationModal() {
    this.allocationForm = {
      userId: '',
      departmentId: '',
      projectRole: 'Team Member',
      allocationPercentage: 100,
      startDate: new Date().toISOString().substring(0, 10),
      endDate: '',
      status: 'Active'
    };
    this.loadUsersList();
    this.showAddAllocationModal = true;
  }

  closeAddAllocationModal() {
    this.showAddAllocationModal = false;
  }

  saveResourceAllocation() {
    if (!this.allocationForm.userId) {
      alert('Please select a team member.');
      return;
    }
    this.resourceService.addOrUpdateResourceAllocation(this.projectId, this.allocationForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeAddAllocationModal();
          this.loadResourceData();
          this.loadProjectDetails();
        }
      },
      error: (err) => alert(err.error?.message || 'Failed to save allocation')
    });
  }

  deleteAllocation(allocationId: string) {
    if (!confirm('Remove this resource allocation?')) return;
    this.resourceService.deleteResourceAllocation(this.projectId, allocationId).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadResourceData();
        }
      },
      error: (err) => alert(err.error?.message || 'Failed to remove allocation')
    });
  }

  // ── Work Log Methods ──────────────────────────────────────────────────────
  openWorkLogModal(task: Task, event?: Event) {
    if (event) event.stopPropagation();
    this.selectedTaskForWorkLog = task;
    this.workLogForm = {
      hoursLogged: 1,
      workDate: new Date().toISOString().substring(0, 10),
      description: ''
    };
    this.showWorkLogModal = true;
    this.loadTaskWorkLogs(task._id);
  }

  closeWorkLogModal() {
    this.showWorkLogModal = false;
    this.selectedTaskForWorkLog = null;
    this.taskWorkLogs = [];
  }

  loadTaskWorkLogs(taskId: string) {
    this.resourceService.getTaskWorkLogs(taskId).subscribe({
      next: (res) => {
        if (res.success) {
          this.taskWorkLogs = res.data;
        }
      },
      error: (err) => console.error('Failed to load task work logs', err)
    });
  }

  saveWorkLog() {
    if (!this.selectedTaskForWorkLog) return;
    if (!this.workLogForm.hoursLogged || this.workLogForm.hoursLogged <= 0) {
      alert('Please enter valid hours logged.');
      return;
    }

    this.resourceService.addWorkLog(this.selectedTaskForWorkLog._id, this.workLogForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadTaskWorkLogs(this.selectedTaskForWorkLog!._id);
          this.loadTasks(true);
          this.workLogForm.hoursLogged = 1;
          this.workLogForm.description = '';
          if (this.activeTab === 'Resources') {
            this.loadResourceData();
          }
        }
      },
      error: (err) => alert(err.error?.message || 'Failed to add work log')
    });
  }

  deleteWorkLog(logId: string) {
    if (!confirm('Delete this work log entry?')) return;
    this.resourceService.deleteWorkLog(logId).subscribe({
      next: (res) => {
        if (res.success) {
          if (this.selectedTaskForWorkLog) {
            this.loadTaskWorkLogs(this.selectedTaskForWorkLog._id);
          }
          this.loadTasks(true);
          if (this.activeTab === 'Resources') {
            this.loadResourceData();
          }
        }
      },
      error: (err) => alert(err.error?.message || 'Failed to delete work log')
    });
  }

  loadOverview() {
    if (!this.projectId) return;
    this.overviewLoading = true;
    this.projectService.getProjectOverview(this.projectId).subscribe({
      next: (res) => {
        this.overviewLoading = false;
        if (res.success) {
          this.overviewData = res.data;
          // Sync project reference from overview
          if (!this.project && res.data?.project) {
            this.project = res.data.project as unknown as Project;
          }
        }
      },
      error: (err) => {
        this.overviewLoading = false;
        console.error('Failed to load project overview', err);
      }
    });
  }

  getHealthClass(health?: string): string {
    const map: Record<string, string> = {
      'On Track': 'health-on-track',
      'At Risk': 'health-at-risk',
      'Delayed': 'health-delayed',
      'Completed': 'health-completed'
    };
    return map[health || ''] || 'health-none';
  }

  getHealthLabel(health?: string): string {
    return health || 'Not Set';
  }

  formatDate(dateStr?: string | Date): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  getInitials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getVerticalName(): string {
    if (!this.project?.verticalId) return '—';
    if (typeof this.project.verticalId === 'object') {
      return (this.project.verticalId as any).name || '—';
    }
    const val = String(this.project.verticalId);
    if (this.allVerticalsList?.length) {
      const found = this.allVerticalsList.find(v => v._id === val || (v as any).code === val);
      if (found) return found.name;
    }
    return val.length > 20 ? '—' : val;
  }


  loadModules() {
    this.moduleService.getModules(this.projectId).subscribe({
      next: (res) => {
        if (res.success) {
          this.modules = res.data;
        }
      },
      error: (err) => console.error('Failed to load modules', err)
    });
  }

  closeModuleForm() {
    this.showModuleForm = false;
  }

  onModuleSaved() {
    this.loadModules();
  }

  approveModule(module: Module, event: Event) {
    event.stopPropagation();
    if (confirm(`Approve module "${module.name}"?`)) {
      this.moduleService.approveModule(module._id).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadModules();
          }
        },
        error: (err) => alert(err.error?.message || 'Failed to approve module')
      });
    }
  }

  rejectModule(module: Module, event: Event) {
    event.stopPropagation();
    const reason = prompt('Please enter a rejection reason:');
    if (reason === null) return;
    if (!reason.trim()) {
      alert('A rejection reason is required.');
      return;
    }
    this.moduleService.rejectModule(module._id, reason).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadModules();
        }
      },
      error: (err) => alert(err.error?.message || 'Failed to reject module')
    });
  }

  openModule(module: Module) {
    this.router.navigate(['/projects', this.projectId, 'modules', module._id]);
  }

  deleteModule(module: Module, event: Event) {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete story "${module.name}"?\nThis will also delete all tasks associated with this story.`)) {
      this.moduleService.deleteModule(module._id).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadModules();
          }
        },
        error: (err) => alert(err.error?.message || 'Failed to delete story')
      });
    }
  }

  // ── Department Methods ────────────────────────────────────────────────────
  loadProjectDepartments() {
    this.deptLoading = true;
    this.workflowService.getProjectDepartments(this.projectId).subscribe({
      next: (res) => {
        this.deptLoading = false;
        if (res.success) this.projectDepartments = res.data;
      },
      error: () => { this.deptLoading = false; }
    });
  }

  openAddDeptModal() {
    this.selectedDeptId = '';
    this.departmentService.getDepartments().subscribe({
      next: (res) => {
        if (res.success) {
          // Filter out already-linked departments
          const linkedIds = this.projectDepartments.map(pd => pd.departmentId._id);
          this.allDepartments = res.data.filter(d => !linkedIds.includes(d._id));
        }
        this.showAddDeptModal = true;
      }
    });
  }

  closeAddDeptModal() {
    this.showAddDeptModal = false;
    this.selectedDeptId = '';
  }

  addDepartmentToProject() {
    if (!this.selectedDeptId) return;
    this.workflowService.addDepartmentToProject(this.projectId, this.selectedDeptId).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeAddDeptModal();
          this.loadProjectDepartments();
          this.showDeptSuccess('Department added to project!');
        }
      },
      error: (err) => { this.deptError = err.error?.message || 'Failed to add department.'; }
    });
  }

  removeDeptFromProject(deptId: string) {
    if (!confirm('Remove this department from the project?')) return;
    this.workflowService.removeDepartmentFromProject(this.projectId, deptId).subscribe({
      next: () => {
        this.loadProjectDepartments();
        this.showDeptSuccess('Department removed.');
      },
      error: (err) => { this.deptError = err.error?.message || 'Failed to remove.'; }
    });
  }

  // Stage tracking removed — ProjectDepartment is now a simple link

  getStatusColor(status: string): string {
    const map: Record<string, string> = {
      'Not Started': '#94a3b8',
      'In Progress': '#f59e0b',
      'Completed':   '#10b981'
    };
    return map[status] || '#64748b';
  }

  private showDeptSuccess(msg: string) {
    this.deptSuccess = msg;
    setTimeout(() => (this.deptSuccess = null), 3000);
  }

  private pollingSubscription?: Subscription;

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    
    const user = this.authService.getCurrentUser();
    if (user) {
      const isAdmin = user.role === 'Administrator' || !!user.superAdmin;
      this.isManager = user.role === 'Manager' || isAdmin;
      this.isLead = user.role === 'Lead' || this.isManager;
      this.isUnitHead = user.role === 'Unit Head';
      const userRaw = JSON.parse(localStorage.getItem('rflow_auth_user') || '{}');
      this.currentUserId = user.id || userRaw._id;
    }

    if (this.projectId) {
      this.verticalService.getVerticals().subscribe(res => {
        if (res.success) this.allVerticalsList = res.data;
      });
      this.loadProjectDetails();
      this.loadOverview();
      this.loadTasks();
      this.startPolling();
    }
  }

  ngOnDestroy(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  startPolling() {
    this.pollingSubscription = timer(10000, 10000).subscribe(() => {
      // Don't poll if forms are open
      if (!this.showTaskForm && !this.showModuleForm) {
        this.loadTasks(true);
        if (this.activeTab === 'Modules') {
          this.loadModules();
        }
      }
    });
  }

  loadProjectDetails() {
    this.projectService.getProjects().subscribe({
      next: (res) => {
        if (res.success) {
          this.project = res.data.find(p => p._id === this.projectId) || null;
        }
      }
    });
  }

  loadTasks(silent = false) {
    if (!silent) this.isLoading = true;
    this.taskService.getTasks({ projectId: this.projectId }).subscribe({
      next: (res) => {
        if (!silent) this.isLoading = false;
        if (res.success) {
          this.tasks = res.data.map(task => {
            const numId = parseInt(task._id.slice(-4), 16) || 0;
            const modules = ['Authentication', 'Dashboard', 'Billing', 'Settings', 'Database', 'API Integration'];
            return {
              ...task,
              module: modules[numId % modules.length],
              commentCount: numId % 5,
              attachmentCount: numId % 3
            } as RichTask;
          });
          this.calculateStats();
          this.filterAndOrganizeTasks();

          // Generate task activity feed
          this.recentActivities = this.tasks
            .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
            .slice(0, 10)
            .map(t => {
              let actionText = '';
              if (t.status === 'Done') {
                actionText = `completed task ${t.taskId}`;
              } else if (t.status === 'Pending Review') {
                actionText = `moved ${t.taskId} to Pending Review`;
              } else if (t.status === 'In Progress') {
                actionText = `started working on ${t.taskId}`;
              } else {
                actionText = `created task ${t.taskId}`;
              }
              return {
                userName: t.assigneeId?.employeeName || 'Someone',
                action: actionText,
                timestamp: t.updatedAt || t.createdAt
              };
            });
        }
      },
      error: (err) => {
        if (!silent) this.isLoading = false;
        console.error('Failed to load tasks', err);
      }
    });
  }

  calculateStats() {
    this.totalTasks = this.tasks.length;
    this.completedTasks = this.tasks.filter(t => t.status === 'Done').length;
    this.pendingTasks = this.totalTasks - this.completedTasks;
    this.progressPercentage = this.totalTasks > 0 ? Math.round((this.completedTasks / this.totalTasks) * 100) : 0;
  }

  filterAndOrganizeTasks() {
    let filtered = [...this.tasks];

    // Apply text search
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.summary.toLowerCase().includes(q) || 
        t.taskId.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // Apply dropdown filters
    if (this.selectedPriority) {
      filtered = filtered.filter(t => t.priority === this.selectedPriority);
    }
    if (this.selectedStatus) {
      filtered = filtered.filter(t => t.status === this.selectedStatus);
    }
    if (this.selectedAssignee) {
      filtered = filtered.filter(t => t.assigneeId?._id === this.selectedAssignee);
    }
    if (this.selectedType) {
      filtered = filtered.filter(t => t.type === this.selectedType);
    }

    // Organize into columns
    this.todoTasks = filtered.filter(t => t.status === 'To Do');
    this.inProgressTasks = filtered.filter(t => t.status === 'In Progress');
    this.reviewTasks = filtered.filter(t => t.status === 'Pending Review');
    this.doneTasks = filtered.filter(t => t.status === 'Done');
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedPriority = '';
    this.selectedStatus = '';
    this.selectedAssignee = '';
    this.selectedType = '';
    this.filterAndOrganizeTasks();
  }

  drop(event: CdkDragDrop<RichTask[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      
      const canMove = this.isManager || 
                      (this.isLead && this.project?.leadId?._id === this.currentUserId) ||
                      task.assigneeId?._id === this.currentUserId || 
                      task.reporterId?._id === this.currentUserId;
                      
      if (!canMove) {
        alert("You don't have permission to move this task.");
        return;
      }

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Determine new status
      let newStatus: 'To Do' | 'In Progress' | 'Review' | 'Done' = 'To Do';
      switch (event.container.id) {
        case 'todoList': newStatus = 'To Do'; break;
        case 'inProgressList': newStatus = 'In Progress'; break;
        case 'reviewList': newStatus = 'Review'; break;
        case 'doneList': newStatus = 'Done'; break;
      }

      // Update in main collection
      const mainTask = this.tasks.find(t => t._id === task._id);
      if (mainTask) {
        mainTask.status = newStatus as any;
        this.calculateStats();
      }

      // Save to server
      this.taskService.updateTask(task._id, { status: newStatus as any }).subscribe({
        next: (res) => {
          if (!res.success) {
             this.loadTasks();
          }
        },
        error: () => {
          alert("Failed to update task status");
          this.loadTasks();
        }
      });
    }
  }

  openNewTaskModal() {
    this.selectedTaskToEdit = null;
    this.showTaskForm = true;
  }

  closeTaskForm() {
    this.showTaskForm = false;
    this.selectedTaskToEdit = null;
  }

  onTaskSaved() {
    this.loadTasks();
    this.loadGanttData();
  }

  goBack() {
    this.router.navigate(['/projects']);
  }
  
  editTask(task: Task, event: Event) {
    event.stopPropagation();
    this.selectedTaskToEdit = task;
    this.showTaskForm = true;
  }

  viewDetails(task: Task, event: Event) {
    event.stopPropagation();
    // Implementation placeholder or alert for future view function
    alert(`Viewing task ${task.taskId} details:\n\n${task.description || 'No description provided.'}`);
  }
  

  confirmDeleteTask(task: Task, event: Event) {
    event.stopPropagation();
    this.itemToDelete = task;
    this.deleteTitle = 'Delete Task';
    this.deleteMessage = `Are you sure you want to delete task "${task.summary}"?\n\nThis action cannot be undone.`;
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
        if (res.success) {
          this.loadTasks();
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to delete task');
      }
    });
    this.showDeleteModal = false;
    this.itemToDelete = null;
  }

  // ── Milestone Methods ───────────────────────────────────────────────────────
  canManageMilestones(): boolean {
    const user = this.authService.getCurrentUser();
    if (!user) return false;
    if (user.superAdmin || user.role === 'Administrator' || user.role === 'Manager') return true;
    if (user.role === 'Lead' && this.project?.leadId?._id === user.id) return true;
    return false;
  }

  loadUsersList() {
    if (this.userList.length > 0) return;
    this.authService.getUsersAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.userList = res.data;
        }
      },
      error: (err) => console.error('Failed to load user list', err)
    });
  }

  loadMilestones() {
    if (!this.projectId) return;
    this.milestonesLoading = true;
    this.milestoneService.getMilestones(this.projectId).subscribe({
      next: (res) => {
        this.milestonesLoading = false;
        if (res.success) {
          this.milestones = res.data;
        }
      },
      error: (err) => {
        this.milestonesLoading = false;
        console.error('Failed to load milestones', err);
      }
    });
  }

  getMilestoneCountByStatus(status: string): number {
    return this.milestones.filter(m => m.status === status).length;
  }

  getOwnerName(ownerId: any): string {
    if (!ownerId) return '';
    if (typeof ownerId === 'object') return ownerId.employeeName || ownerId.name || 'Unknown';
    const found = this.userList.find(u => u._id === ownerId);
    return found ? found.employeeName : 'Assigned User';
  }

  getMilestoneStatusClass(status: string): string {
    switch (status) {
      case 'Completed': return 'status-completed';
      case 'In Progress': return 'status-in-progress';
      case 'Delayed': return 'status-delayed';
      default: return 'status-not-started';
    }
  }

  openAddMilestoneModal() {
    this.editingMilestone = null;
    this.milestoneError = null;
    this.milestoneForm = {
      name: '',
      description: '',
      plannedStart: '',
      plannedEnd: '',
      actualEnd: '',
      ownerId: '',
      status: 'Not Started',
      progress: 0
    };
    this.loadUsersList();
    this.showMilestoneModal = true;
  }

  openEditMilestoneModal(m: Milestone) {
    this.editingMilestone = m;
    this.milestoneError = null;
    const ownerVal = typeof m.ownerId === 'object' ? m.ownerId?._id : m.ownerId;
    this.milestoneForm = {
      name: m.name,
      description: m.description || '',
      plannedStart: m.plannedStart ? m.plannedStart.substring(0, 10) : '',
      plannedEnd: m.plannedEnd ? m.plannedEnd.substring(0, 10) : '',
      actualEnd: m.actualEnd ? m.actualEnd.substring(0, 10) : '',
      ownerId: ownerVal || '',
      status: m.status,
      progress: m.progress || 0
    };
    this.loadUsersList();
    this.showMilestoneModal = true;
  }

  closeMilestoneModal() {
    this.showMilestoneModal = false;
    this.editingMilestone = null;
    this.milestoneError = null;
  }

  onMilestoneProgressChange(val: number) {
    const p = Number(val);
    if (p >= 100) {
      this.milestoneForm.progress = 100;
      this.milestoneForm.status = 'Completed';
      if (!this.milestoneForm.actualEnd) {
        this.milestoneForm.actualEnd = new Date().toISOString().substring(0, 10);
      }
    } else if (this.milestoneForm.status === 'Completed') {
      this.milestoneForm.status = 'In Progress';
    }
  }

  onMilestoneStatusChange(status: string) {
    if (status === 'Completed') {
      this.milestoneForm.progress = 100;
      if (!this.milestoneForm.actualEnd) {
        this.milestoneForm.actualEnd = new Date().toISOString().substring(0, 10);
      }
    }
  }

  saveMilestone() {
    this.milestoneError = null;

    if (!this.milestoneForm.name || !this.milestoneForm.name.trim()) {
      this.milestoneError = 'Milestone name is required.';
      return;
    }

    if (!this.milestoneForm.plannedStart || !this.milestoneForm.plannedEnd) {
      this.milestoneError = 'Both Planned Start Date and Planned End Date are required.';
      return;
    }

    if (new Date(this.milestoneForm.plannedEnd) < new Date(this.milestoneForm.plannedStart)) {
      this.milestoneError = 'Planned End Date cannot be earlier than Planned Start Date.';
      return;
    }

    this.isSavingMilestone = true;

    const rawOwnerId = this.milestoneForm.ownerId;
    const cleanOwnerId = (rawOwnerId && rawOwnerId !== 'undefined' && rawOwnerId !== 'null' && rawOwnerId !== '') ? rawOwnerId : undefined;

    const payload: any = {
      name: this.milestoneForm.name.trim(),
      description: this.milestoneForm.description ? this.milestoneForm.description.trim() : '',
      plannedStart: this.milestoneForm.plannedStart,
      plannedEnd: this.milestoneForm.plannedEnd,
      actualEnd: this.milestoneForm.actualEnd || undefined,
      ownerId: cleanOwnerId,
      status: this.milestoneForm.status,
      progress: Number(this.milestoneForm.progress)
    };

    if (this.editingMilestone) {
      this.milestoneService.updateMilestone(this.projectId, this.editingMilestone._id, payload).subscribe({
        next: (res) => {
          this.isSavingMilestone = false;
          if (res.success) {
            this.closeMilestoneModal();
            this.loadMilestones();
            if (this.overviewData) this.loadOverview();
          }
        },
        error: (err) => {
          this.isSavingMilestone = false;
          this.milestoneError = err.error?.message || 'Failed to update milestone.';
        }
      });
    } else {
      this.milestoneService.createMilestone(this.projectId, payload).subscribe({
        next: (res) => {
          this.isSavingMilestone = false;
          if (res.success) {
            this.closeMilestoneModal();
            this.loadMilestones();
            if (this.overviewData) this.loadOverview();
          }
        },
        error: (err) => {
          this.isSavingMilestone = false;
          this.milestoneError = err.error?.message || 'Failed to create milestone.';
        }
      });
    }
  }

  confirmDeleteMilestone(m: Milestone) {
    this.milestoneToDelete = m;
    this.showDeleteMilestoneModal = true;
  }

  executeDeleteMilestone() {
    if (!this.milestoneToDelete) return;
    this.milestoneService.deleteMilestone(this.projectId, this.milestoneToDelete._id).subscribe({
      next: (res) => {
        this.showDeleteMilestoneModal = false;
        this.milestoneToDelete = null;
        if (res.success) {
          this.loadMilestones();
          if (this.overviewData) this.loadOverview();
        }
      },
      error: (err) => {
        this.showDeleteMilestoneModal = false;
        this.milestoneToDelete = null;
        alert(err.error?.message || 'Failed to delete milestone');
      }
    });
  }

  // ── Risk Methods ───────────────────────────────────────────────────────────
  loadRisks() {
    if (!this.projectId) return;
    this.risksLoading = true;
    this.riskService.getRisks(this.projectId).subscribe({
      next: (res) => {
        this.risksLoading = false;
        if (res.success) {
          this.risks = res.data;
        }
      },
      error: (err) => {
        this.risksLoading = false;
        console.error('Failed to load risks', err);
      }
    });
  }

  getRiskStatusClass(status: string): string {
    switch (status) {
      case 'Closed': return 'status-completed';
      case 'Mitigated': return 'status-on-track';
      case 'Open': return 'status-delayed';
      case 'Realized': return 'status-delayed'; // Or Critical
      default: return 'status-not-started';
    }
  }

  getRiskSeverityClass(severity: string): string {
    switch (severity) {
      case 'Low': return 'severity-low';
      case 'Medium': return 'severity-medium';
      case 'High': return 'severity-high';
      case 'Critical': return 'severity-critical';
      default: return 'severity-low';
    }
  }

  openAddRiskModal() {
    this.editingRisk = null;
    this.riskError = null;
    this.riskForm = {
      title: '',
      description: '',
      probability: 'Medium',
      impact: 'Medium',
      severity: 'Medium',
      status: 'Identified',
      mitigationPlan: '',
      ownerId: ''
    };
    this.loadUsersList();
    this.showRiskModal = true;
  }

  openEditRiskModal(r: Risk) {
    this.editingRisk = r;
    this.riskError = null;
    const ownerVal = typeof r.ownerId === 'object' ? r.ownerId?._id : r.ownerId;
    this.riskForm = {
      title: r.title,
      description: r.description || '',
      probability: r.probability,
      impact: r.impact,
      severity: r.severity,
      status: r.status,
      mitigationPlan: r.mitigationPlan || '',
      ownerId: ownerVal || ''
    };
    this.loadUsersList();
    this.showRiskModal = true;
  }

  closeRiskModal() {
    this.showRiskModal = false;
    this.editingRisk = null;
    this.riskError = null;
  }

  saveRisk() {
    this.riskError = null;

    if (!this.riskForm.title || !this.riskForm.title.trim()) {
      this.riskError = 'Risk title is required.';
      return;
    }

    this.isSavingRisk = true;

    const payload: any = {
      title: this.riskForm.title.trim(),
      description: this.riskForm.description ? this.riskForm.description.trim() : '',
      probability: this.riskForm.probability,
      impact: this.riskForm.impact,
      severity: this.riskForm.severity,
      status: this.riskForm.status,
      mitigationPlan: this.riskForm.mitigationPlan ? this.riskForm.mitigationPlan.trim() : '',
      ownerId: this.riskForm.ownerId || undefined
    };

    if (this.editingRisk) {
      this.riskService.updateRisk(this.projectId, this.editingRisk._id, payload).subscribe({
        next: (res) => {
          this.isSavingRisk = false;
          if (res.success) {
            this.closeRiskModal();
            this.loadRisks();
          }
        },
        error: (err) => {
          this.isSavingRisk = false;
          this.riskError = err.error?.message || 'Failed to update risk.';
        }
      });
    } else {
      this.riskService.createRisk(this.projectId, payload).subscribe({
        next: (res) => {
          this.isSavingRisk = false;
          if (res.success) {
            this.closeRiskModal();
            this.loadRisks();
          }
        },
        error: (err) => {
          this.isSavingRisk = false;
          this.riskError = err.error?.message || 'Failed to create risk.';
        }
      });
    }
  }

  confirmDeleteRisk(r: Risk) {
    this.riskToDelete = r;
    this.showDeleteRiskModal = true;
  }

  executeDeleteRisk() {
    if (!this.riskToDelete) return;
    this.riskService.deleteRisk(this.projectId, this.riskToDelete._id).subscribe({
      next: (res) => {
        this.showDeleteRiskModal = false;
        this.riskToDelete = null;
        if (res.success) {
          this.loadRisks();
        }
      },
      error: (err) => {
        this.showDeleteRiskModal = false;
        this.riskToDelete = null;
        alert(err.error?.message || 'Failed to delete risk');
      }
    });
  }

  // ── Timeline / Gantt Methods ───────────────────────────────────────────────
  loadGanttData() {
    if (!this.projectId) return;
    this.ganttLoading = true;
    this.ganttService.getGanttData(this.projectId).subscribe({
      next: (res) => {
        this.ganttLoading = false;
        if (res.success && res.data) {
          this.ganttData = res.data;
        } else {
          this.createFallbackGanttData();
        }
        this.ensureGanttHasContent();
        this.generateTimelineGrid();
      },
      error: (err) => {
        this.ganttLoading = false;
        console.error('Failed to load Gantt data', err);
        this.createFallbackGanttData();
        this.ensureGanttHasContent();
        this.generateTimelineGrid();
      }
    });
  }

  ensureGanttHasContent() {
    if (!this.ganttData) {
      this.createFallbackGanttData();
      return;
    }

    // Use actual project modules if present
    if (this.modules && this.modules.length > 0 && (!this.ganttData.modules || this.ganttData.modules.length === 0)) {
      this.ganttData.modules = this.modules.map(m => {
        const mTasks = (this.ganttData?.tasks || []).filter(t => t.moduleId === m._id);
        const totalT = mTasks.length;
        const compT = mTasks.filter(t => t.progress === 100).length;
        const prog = totalT > 0 ? Math.round((compT / totalT) * 100) : (m.progress || 0);

        return {
          id: m._id,
          title: m.name,
          type: 'module' as const,
          startDate: m.createdAt ? new Date(m.createdAt).toISOString() : (this.project?.startDate ? new Date(this.project.startDate).toISOString() : new Date().toISOString()),
          endDate: m.dueDate ? new Date(m.dueDate).toISOString() : (this.project?.expectedEndDate ? new Date(this.project.expectedEndDate).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString()),
          progress: prog,
          status: m.status || 'Active',
          owner: { _id: m.createdBy?._id || 'u1', employeeName: m.createdBy?.employeeName || this.project?.managerId?.employeeName || 'Module Owner' },
          taskCount: totalT,
          completedTaskCount: compT
        };
      });
    }

    // If still 0 modules, create a single module based on the actual Project
    if (!this.ganttData.modules || this.ganttData.modules.length === 0) {
      const pStart = this.project?.startDate ? new Date(this.project.startDate) : new Date();
      const pEnd = this.project?.expectedEndDate ? new Date(this.project.expectedEndDate) : new Date(pStart.getTime() + 60 * 86400000);
      const projTasks = this.ganttData.tasks || [];
      const totalT = projTasks.length;
      const compT = projTasks.filter(t => t.progress === 100).length;
      const prog = totalT > 0 ? Math.round((compT / totalT) * 100) : (this.progressPercentage || 0);

      this.ganttData.modules = [
        {
          id: 'proj-main-mod',
          title: `${this.project?.name || 'Project'} Core Scope`,
          type: 'module' as const,
          startDate: pStart.toISOString(),
          endDate: pEnd.toISOString(),
          progress: prog,
          status: this.project?.status || 'Active',
          owner: { _id: 'proj-owner', employeeName: this.project?.managerId?.employeeName || 'Project Manager' },
          taskCount: totalT,
          completedTaskCount: compT
        }
      ];
    }
  }

  createFallbackGanttData() {
    const pStart = this.project?.startDate ? new Date(this.project.startDate) : new Date();
    const pEnd = this.project?.expectedEndDate ? new Date(this.project.expectedEndDate) : new Date(pStart.getTime() + 60 * 86400000);
    const combinedTasks: any[] = [...(this.todoTasks || []), ...(this.inProgressTasks || []), ...(this.reviewTasks || []), ...(this.doneTasks || [])];

    this.ganttData = {
      project: {
        id: this.projectId || 'p1',
        title: this.project?.name || 'Project Timeline',
        type: 'project',
        startDate: pStart.toISOString(),
        endDate: pEnd.toISOString(),
        progress: this.progressPercentage || 0,
        status: this.project?.status || 'Active',
        taskCount: combinedTasks.length,
        completedTaskCount: (this.doneTasks || []).length
      },
      milestones: (this.milestones || []).map(m => ({
        id: m._id,
        title: m.name,
        type: 'milestone' as const,
        startDate: m.plannedStart ? new Date(m.plannedStart).toISOString() : pStart.toISOString(),
        endDate: m.plannedEnd ? new Date(m.plannedEnd).toISOString() : pEnd.toISOString(),
        progress: m.progress || 0,
        status: m.status || 'Active'
      })),
      modules: [],
      tasks: combinedTasks.map((t: any) => ({
        id: t._id,
        title: `${t.taskId}: ${t.summary}`,
        type: 'task' as const,
        startDate: t.startDate ? new Date(t.startDate).toISOString() : pStart.toISOString(),
        endDate: t.dueDate ? new Date(t.dueDate).toISOString() : pEnd.toISOString(),
        progress: t.status === 'Done' ? 100 : t.status === 'In Progress' ? 50 : 0,
        status: t.status,
        assignee: t.assigneeId ? { _id: t.assigneeId._id || t.assigneeId, employeeName: t.assigneeId.employeeName || 'Assigned' } : undefined,
        moduleId: t.module ? t.module : undefined
      })),
      bounds: {
        startDate: pStart.toISOString(),
        endDate: pEnd.toISOString()
      }
    };
  }

  setGanttScale(scale: 'day' | 'week' | 'month') {
    this.ganttScale = scale;
    this.generateTimelineGrid();
  }

  setGanttGroupBy(groupBy: 'milestone' | 'module' | 'none') {
    this.ganttGroupBy = groupBy;
    this.buildFlatGanttRows();
  }

  toggleGanttRow(id: string) {
    this.expandedGanttRows[id] = !this.expandedGanttRows[id];
    this.buildFlatGanttRows();
  }

  ganttDeptFilter: string = '';
  ganttVerticalFilter: string = '';

  buildFlatGanttRows() {
    if (!this.ganttData) {
      this.flatGanttRows = [];
      return;
    }

    const rows: any[] = [];
    const palettes = [
      { fill: '#2563eb', bg: '#dbeafe', border: '#93c5fd' }, // Blue
      { fill: '#c2410c', bg: '#ffedd5', border: '#fdba74' }, // Rust / Orange
      { fill: '#d97706', bg: '#fef3c7', border: '#fde68a' }, // Ochre / Amber
      { fill: '#059669', bg: '#d1fae5', border: '#a7f3d0' }, // Emerald / Teal
      { fill: '#0d9488', bg: '#ccfbf1', border: '#99f6e4' }  // Dark Teal
    ];

    if (this.timelineViewMode === 'modules') {
      let idx = 0;
      for (const mod of this.ganttData.modules) {
        if (this.expandedGanttRows[mod.id] === undefined) {
          this.expandedGanttRows[mod.id] = true;
        }

        // Generate milestone markers along the module bar
        const modMilestones = (this.ganttData.milestones || []).slice(0, 3).map((m, mIdx) => ({
          id: m.id,
          title: m.title,
          date: m.startDate || m.endDate,
          status: m.status || (mIdx === 0 ? 'Completed' : mIdx === 1 ? 'In Progress' : 'Delayed'),
          pct: (mIdx + 1) * 30
        }));

        rows.push({
          id: mod.id,
          type: 'module',
          name: mod.title,
          department: mod.owner?.employeeName || 'General',
          start: mod.startDate,
          end: mod.endDate,
          progress: mod.progress || 45,
          status: mod.status,
          assignee: '',
          level: 0,
          palette: palettes[idx % palettes.length],
          milestones: modMilestones,
          expanded: this.expandedGanttRows[mod.id]
        });
        idx++;
      }
    } else {
      // Tasks + resources mode
      let modIdx = 0;
      for (const mod of this.ganttData.modules) {
        // Module header
        rows.push({
          id: mod.id,
          type: 'module-header',
          name: mod.title,
          department: '',
          level: 0
        });

        const tasks = this.ganttData.tasks.filter(t => t.moduleId === mod.id || !t.moduleId);
        for (const t of tasks) {
          const isOverdue = t.status === 'Delayed' || (t.endDate && new Date(t.endDate) < new Date() && t.progress < 100);
          rows.push({
            id: t.id,
            type: 'task',
            name: t.title,
            start: t.startDate,
            end: t.endDate,
            progress: t.progress || 30,
            status: t.status,
            isOverdue,
            assignee: t.assignee?.employeeName || t.owner?.employeeName || 'Unassigned',
            level: 1,
            palette: palettes[modIdx % palettes.length]
          });
        }
        modIdx++;
      }
    }

    this.flatGanttRows = rows;
  }

  generateTimelineGrid() {
    if (!this.ganttData) return;

    this.buildFlatGanttRows();

    let s = new Date(this.ganttData.bounds.startDate);
    let e = new Date(this.ganttData.bounds.endDate);

    // Pad start by -3 days and end by +7 days
    s.setDate(s.getDate() - 3);
    e.setDate(e.getDate() + 7);

    this.ganttStartDate = new Date(s.getFullYear(), s.getMonth(), s.getDate());
    this.ganttEndDate = new Date(e.getFullYear(), e.getMonth(), e.getDate());

    const todayStr = new Date().toDateString();
    this.ganttHeaders = [];

    if (this.ganttScale === 'day') {
      this.ganttColWidth = 44;
      let cur = new Date(this.ganttStartDate);
      while (cur <= this.ganttEndDate) {
        const dayNum = cur.getDate();
        const monthName = cur.toLocaleDateString('en-US', { month: 'short' });
        const dayOfWeek = cur.toLocaleDateString('en-US', { weekday: 'narrow' });
        const dayOfWeekNum = cur.getDay();

        this.ganttHeaders.push({
          top: `${monthName} ${dayNum}`,
          bottom: dayOfWeek,
          date: new Date(cur),
          isToday: cur.toDateString() === todayStr,
          isWeekend: dayOfWeekNum === 0 || dayOfWeekNum === 6
        });
        cur.setDate(cur.getDate() + 1);
      }
    } else if (this.ganttScale === 'week') {
      this.ganttColWidth = 110;
      let cur = new Date(this.ganttStartDate);
      const day = cur.getDay();
      const diff = cur.getDate() - day + (day === 0 ? -6 : 1);
      cur.setDate(diff);

      while (cur <= this.ganttEndDate) {
        const weekEnd = new Date(cur);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const label = `${cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

        this.ganttHeaders.push({
          top: label,
          bottom: `W${this.getWeekNumber(cur)}`,
          date: new Date(cur),
          isToday: new Date() >= cur && new Date() <= weekEnd,
          isWeekend: false
        });
        cur.setDate(cur.getDate() + 7);
      }
    } else {
      this.ganttColWidth = 140;
      let cur = new Date(this.ganttStartDate.getFullYear(), this.ganttStartDate.getMonth(), 1);
      const endMonth = new Date(this.ganttEndDate.getFullYear(), this.ganttEndDate.getMonth() + 1, 1);

      while (cur < endMonth) {
        const label = cur.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const now = new Date();
        const isCurrentMonth = now.getFullYear() === cur.getFullYear() && now.getMonth() === cur.getMonth();

        this.ganttHeaders.push({
          top: label,
          bottom: '',
          date: new Date(cur),
          isToday: isCurrentMonth,
          isWeekend: false
        });
        cur.setMonth(cur.getMonth() + 1);
      }
    }
  }

  getWeekNumber(d: Date): number {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  }

  getGanttBarLeft(startStr: string): number {
    const d = new Date(startStr);
    const msDiff = d.getTime() - this.ganttStartDate.getTime();
    if (this.ganttScale === 'day') {
      const days = msDiff / (1000 * 60 * 60 * 24);
      return Math.max(0, days * this.ganttColWidth);
    } else if (this.ganttScale === 'week') {
      const weeks = msDiff / (1000 * 60 * 60 * 24 * 7);
      return Math.max(0, weeks * this.ganttColWidth);
    } else {
      const monthDiff = (d.getFullYear() - this.ganttStartDate.getFullYear()) * 12 + (d.getMonth() - this.ganttStartDate.getMonth());
      const dayFrac = d.getDate() / 30;
      return Math.max(0, (monthDiff + dayFrac) * this.ganttColWidth);
    }
  }

  getGanttBarWidth(startStr: string, endStr: string): number {
    const s = new Date(startStr);
    let e = new Date(endStr);
    if (e <= s) {
      e = new Date(s.getTime() + 24 * 60 * 60 * 1000);
    }

    const msDiff = e.getTime() - s.getTime();
    if (this.ganttScale === 'day') {
      const days = Math.max(1, msDiff / (1000 * 60 * 60 * 24));
      return days * this.ganttColWidth;
    } else if (this.ganttScale === 'week') {
      const weeks = Math.max(0.3, msDiff / (1000 * 60 * 60 * 24 * 7));
      return weeks * this.ganttColWidth;
    } else {
      const days = Math.max(1, msDiff / (1000 * 60 * 60 * 24));
      return (days / 30) * this.ganttColWidth;
    }
  }

  getTodayLineLeft(): number {
    return this.getGanttBarLeft(new Date().toISOString());
  }

  getTotalChartWidth(): number {
    return Math.max(800, this.ganttHeaders.length * this.ganttColWidth);
  }

  showGanttTooltip(item: GanttItem, event: MouseEvent) {
    this.hoveredGanttItem = item;
    this.ganttTooltipX = event.clientX + 12;
    this.ganttTooltipY = event.clientY + 12;
  }

  hideGanttTooltip() {
    this.hoveredGanttItem = null;
  }

  getFilteredTasksForModule(moduleId: string): GanttItem[] {
    if (!this.ganttData) return [];
    return this.ganttData.tasks.filter(t => t.moduleId === moduleId && this.matchesGanttFilters(t));
  }

  getUnassignedGanttTasks(): GanttItem[] {
    if (!this.ganttData) return [];
    return this.ganttData.tasks.filter(t => !t.moduleId && this.matchesGanttFilters(t));
  }

  getAllFilteredGanttTasks(): GanttItem[] {
    if (!this.ganttData) return [];
    return this.ganttData.tasks.filter(t => this.matchesGanttFilters(t));
  }

  matchesGanttFilters(t: GanttItem): boolean {
    if (this.ganttSearchQuery && !t.title.toLowerCase().includes(this.ganttSearchQuery.toLowerCase())) {
      return false;
    }
    if (this.ganttStatusFilter && t.status !== this.ganttStatusFilter) {
      return false;
    }
    return true;
  }

  getGanttItemStatusClass(status: string): string {
    switch (status) {
      case 'Done':
      case 'Completed':
        return 'gt-status-done';
      case 'Pending Review':
        return 'gt-status-review';
      case 'In Progress':
        return 'gt-status-in-progress';
      case 'Blocked':
      case 'Delayed':
        return 'gt-status-blocked';
      default:
        return 'gt-status-todo';
    }
  }

  // =========================================================================
  // ISSUES & CHANGE REQUESTS TAB LOGIC
  // =========================================================================

  issuesLoading = false;
  issues: Issue[] = [];
  changeRequests: ChangeRequest[] = [];
  
  issueTabFilter: 'All' | 'Issue' | 'Change Request' = 'All';
  
  showIssueModal = false;
  editingIssue = false;
  issueForm: any = {};
  issueError = '';
  isSavingIssue = false;
  showDeleteIssueModal = false;
  issueToDelete: Issue | null = null;
  
  showCrModal = false;
  editingCr = false;
  crForm: any = {};
  crError = '';
  isSavingCr = false;
  showDeleteCrModal = false;
  crToDelete: ChangeRequest | null = null;

  loadIssuesAndCRs() {
    this.issuesLoading = true;
    let issuesDone = false;
    let crsDone = false;

    const checkDone = () => {
      if (issuesDone && crsDone) {
        this.issuesLoading = false;
      }
    };

    this.issueService.getIssues(this.projectId).subscribe({
      next: (res) => {
        this.issues = res.data;
        issuesDone = true;
        checkDone();
      },
      error: () => {
        issuesDone = true;
        checkDone();
      }
    });

    this.crService.getChangeRequests(this.projectId).subscribe({
      next: (res) => {
        this.changeRequests = res.data;
        crsDone = true;
        checkDone();
      },
      error: () => {
        crsDone = true;
        checkDone();
      }
    });
  }

  get combinedIssuesAndCRs(): any[] {
    let combined: any[] = [];
    if (this.issueTabFilter === 'All' || this.issueTabFilter === 'Issue') {
      combined = combined.concat(this.issues.map(i => ({ ...i, itemType: 'Issue', displayId: i.issueId })));
    }
    if (this.issueTabFilter === 'All' || this.issueTabFilter === 'Change Request') {
      combined = combined.concat(this.changeRequests.map(cr => ({ ...cr, itemType: 'Change Request', displayId: cr.crId })));
    }
    // Sort descending by creation date
    return combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  setIssueTabFilter(filter: 'All' | 'Issue' | 'Change Request') {
    this.issueTabFilter = filter;
  }

  // ISSUE MODAL
  openAddIssueModal() {
    this.editingIssue = false;
    this.issueForm = {
      title: '',
      description: '',
      priority: 'Medium',
      status: 'Open',
      resolution: ''
    };
    this.issueError = '';
    this.showIssueModal = true;
  }

  openEditIssueModal(issue: Issue) {
    this.editingIssue = true;
    this.issueForm = {
      _id: issue._id,
      title: issue.title,
      description: issue.description,
      priority: issue.priority,
      status: issue.status,
      resolution: issue.resolution,
      ownerId: issue.ownerId?._id || issue.ownerId
    };
    this.issueError = '';
    this.showIssueModal = true;
  }

  closeIssueModal() {
    this.showIssueModal = false;
  }

  saveIssue() {
    if (!this.issueForm.title?.trim()) {
      this.issueError = 'Title is required';
      return;
    }
    this.isSavingIssue = true;
    this.issueError = '';

    if (this.editingIssue) {
      this.issueService.updateIssue(this.projectId, this.issueForm._id, this.issueForm).subscribe({
        next: () => {
          this.isSavingIssue = false;
          this.closeIssueModal();
          this.loadIssuesAndCRs();
          if (this.overviewData) this.loadOverview();
        },
        error: (err) => {
          this.isSavingIssue = false;
          this.issueError = err.error?.message || 'Failed to update Issue';
        }
      });
    } else {
      this.issueService.createIssue(this.projectId, this.issueForm).subscribe({
        next: () => {
          this.isSavingIssue = false;
          this.closeIssueModal();
          this.loadIssuesAndCRs();
          if (this.overviewData) this.loadOverview();
        },
        error: (err) => {
          this.isSavingIssue = false;
          this.issueError = err.error?.message || 'Failed to create Issue';
        }
      });
    }
  }

  confirmDeleteIssue(issue: Issue) {
    this.issueToDelete = issue;
    this.showDeleteIssueModal = true;
  }

  executeDeleteIssue() {
    if (!this.issueToDelete) return;
    this.issueService.deleteIssue(this.projectId, this.issueToDelete._id).subscribe({
      next: () => {
        this.showDeleteIssueModal = false;
        this.issueToDelete = null;
        this.loadIssuesAndCRs();
        if (this.overviewData) this.loadOverview();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to delete issue');
        this.showDeleteIssueModal = false;
        this.issueToDelete = null;
      }
    });
  }

  // CHANGE REQUEST MODAL
  openAddCrModal() {
    this.editingCr = false;
    this.crForm = {
      title: '',
      description: '',
      priority: 'Medium',
      reason: '',
      scopeImpact: '',
      costImpact: '',
      scheduleImpact: '',
      approvalStatus: 'Pending',
      status: 'Open'
    };
    this.crError = '';
    this.showCrModal = true;
  }

  openEditCrModal(cr: ChangeRequest) {
    this.editingCr = true;
    this.crForm = {
      _id: cr._id,
      title: cr.title,
      description: cr.description,
      priority: cr.priority,
      reason: cr.reason,
      scopeImpact: cr.scopeImpact,
      costImpact: cr.costImpact,
      scheduleImpact: cr.scheduleImpact,
      approvalStatus: cr.approvalStatus,
      status: cr.status,
      ownerId: cr.ownerId?._id || cr.ownerId
    };
    this.crError = '';
    this.showCrModal = true;
  }

  closeCrModal() {
    this.showCrModal = false;
  }

  saveCr() {
    if (!this.crForm.title?.trim()) {
      this.crError = 'Title is required';
      return;
    }
    this.isSavingCr = true;
    this.crError = '';

    if (this.editingCr) {
      this.crService.updateChangeRequest(this.projectId, this.crForm._id, this.crForm).subscribe({
        next: () => {
          this.isSavingCr = false;
          this.closeCrModal();
          this.loadIssuesAndCRs();
          if (this.overviewData) this.loadOverview();
        },
        error: (err) => {
          this.isSavingCr = false;
          this.crError = err.error?.message || 'Failed to update Change Request';
        }
      });
    } else {
      this.crService.createChangeRequest(this.projectId, this.crForm).subscribe({
        next: () => {
          this.isSavingCr = false;
          this.closeCrModal();
          this.loadIssuesAndCRs();
          if (this.overviewData) this.loadOverview();
        },
        error: (err) => {
          this.isSavingCr = false;
          this.crError = err.error?.message || 'Failed to create Change Request';
        }
      });
    }
  }

  confirmDeleteCr(cr: ChangeRequest) {
    this.crToDelete = cr;
    this.showDeleteCrModal = true;
  }

  executeDeleteCr() {
    if (!this.crToDelete) return;
    this.crService.deleteChangeRequest(this.projectId, this.crToDelete._id).subscribe({
      next: () => {
        this.showDeleteCrModal = false;
        this.crToDelete = null;
        this.loadIssuesAndCRs();
        if (this.overviewData) this.loadOverview();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to delete change request');
        this.showDeleteCrModal = false;
        this.crToDelete = null;
      }
    });
  }

  getIssuePriorityClass(priority: string): string {
    switch(priority) {
      case 'Critical': return 'badge-priority-critical';
      case 'High': return 'badge-priority-high';
      case 'Medium': return 'badge-priority-medium';
      case 'Low': return 'badge-priority-low';
      default: return 'badge-priority-medium';
    }
  }

  getIssueStatusClass(status: string): string {
    switch(status) {
      case 'Closed': case 'Resolved': case 'Approved': return 'badge-status-closed';
      case 'In Progress': case 'Implementing': case 'In Review': return 'badge-status-mitigated';
      case 'Open': case 'Pending': return 'badge-status-identified';
      case 'Rejected': return 'badge-status-realized';
      default: return 'badge-status-identified';
    }
  }

  // =========================================================================
  // BOM TAB LOGIC
  // =========================================================================

  boms: Bom[] = [];
  bomsLoading = false;
  activeBom: Bom | null = null;
  
  revisions: BomRevision[] = [];
  revisionsLoading = false;
  activeRevision: BomRevision | null = null;

  bomItems: BomItem[] = [];
  bomItemsLoading = false;
  materialStatus: { ordered: Record<string, number>, received: Record<string, number> } = { ordered: {}, received: {} };

  showBomModal = false;
  bomForm: any = {};
  isSavingBom = false;
  bomError = '';

  showRevisionModal = false;
  revisionForm: any = {};
  isSavingRevision = false;
  revisionError = '';

  showBomItemModal = false;
  editingBomItem = false;
  bomItemForm: any = {};
  isSavingBomItem = false;
  bomItemError = '';

  showDeleteBomItemModal = false;
  bomItemToDelete: BomItem | null = null;

  loadBoms() {
    this.bomsLoading = true;
    this.activeBom = null;
    this.activeRevision = null;
    this.bomService.getBoms(this.projectId).subscribe({
      next: (res) => {
        this.boms = res.data;
        this.bomsLoading = false;
      },
      error: () => {
        this.bomsLoading = false;
      }
    });
  }

  selectBom(bom: Bom) {
    this.activeBom = bom;
    this.loadRevisions(bom._id);
  }

  backToBomList() {
    this.activeBom = null;
    this.activeRevision = null;
    this.revisions = [];
    this.bomItems = [];
    this.loadBoms();
  }

  loadRevisions(bomId: string) {
    this.revisionsLoading = true;
    this.bomService.getRevisions(this.projectId).subscribe({
      next: (res) => {
        // filter by bomId since API returns all for project
        this.revisions = res.data.filter(r => r.bomId === bomId);
        this.revisionsLoading = false;
        if (this.revisions.length > 0) {
          // Select latest revision
          this.selectRevision(this.revisions[0]);
        }
      },
      error: () => {
        this.revisionsLoading = false;
      }
    });
  }

  selectRevision(revision: BomRevision) {
    this.activeRevision = revision;
    this.loadBomItems(revision._id);
  }

  loadBomItems(revisionId: string) {
    this.bomItemsLoading = true;
    
    // Load material status
    this.procurementService.getMaterialStatus(this.projectId).subscribe({
      next: (res) => {
        if (res.success) {
          this.materialStatus = res.data;
        }
      }
    });

    this.bomService.getItems(this.projectId, revisionId).subscribe({
      next: (res) => {
        this.bomItems = res.data;
        this.bomItemsLoading = false;
      },
      error: () => {
        this.bomItemsLoading = false;
      }
    });
  }

  // BOM MODAL
  openAddBomModal() {
    const today = new Date().toISOString().split('T')[0];
    const autoBomNum = 'BOM-2026-' + String(Math.floor(100 + Math.random() * 900));
    this.bomForm = {
      bomNumber: autoBomNum,
      revision: 'A',
      titleAssembly: '',
      name: '',
      releasedBy: '',
      releaseDate: today,
      status: 'Draft',
      lineItemsCount: 0,
      vendorSupplier: '',
      deliveryStatus: 'Pending',
      expectedDelivery: '',
      actualDelivery: '',
      estimatedCost: 0,
      actualCost: 0
    };
    this.bomError = '';
    this.showBomModal = true;
  }

  closeBomModal() {
    this.showBomModal = false;
  }

  saveBom() {
    if (!this.bomForm.titleAssembly?.trim() && !this.bomForm.name?.trim()) {
      this.bomError = 'Title / Assembly is required';
      return;
    }
    if (!this.bomForm.name) {
      this.bomForm.name = this.bomForm.titleAssembly;
    }
    this.isSavingBom = true;
    this.bomService.createBom(this.projectId, this.bomForm).subscribe({
      next: (res) => {
        this.isSavingBom = false;
        this.closeBomModal();
        this.loadBoms();
      },
      error: (err) => {
        this.isSavingBom = false;
        this.bomError = err.error?.message || 'Failed to create BOM';
      }
    });
  }

  // REVISION MODAL
  openAddRevisionModal() {
    if (!this.activeBom) return;
    this.revisionForm = { description: '', changeReason: '' };
    this.revisionError = '';
    this.showRevisionModal = true;
  }

  closeRevisionModal() {
    this.showRevisionModal = false;
  }

  saveRevision() {
    if (!this.activeBom) return;
    this.isSavingRevision = true;
    this.bomService.createRevision(this.projectId, { ...this.revisionForm, bomId: this.activeBom._id }).subscribe({
      next: (res) => {
        this.isSavingRevision = false;
        this.closeRevisionModal();
        this.loadRevisions(this.activeBom!._id);
      },
      error: (err) => {
        this.isSavingRevision = false;
        this.revisionError = err.error?.message || 'Failed to create Revision';
      }
    });
  }

  releaseRevision(revision: BomRevision) {
    if (confirm('Are you sure you want to release this revision? It will become read-only.')) {
      this.bomService.updateRevision(this.projectId, revision._id, { status: 'Released' }).subscribe({
        next: () => {
          this.loadRevisions(this.activeBom!._id);
        },
        error: (err) => {
          alert(err.error?.message || 'Failed to release revision');
        }
      });
    }
  }

  // BOM ITEM MODAL
  openAddBomItemModal() {
    this.editingBomItem = false;
    this.bomItemForm = {
      partNumber: '',
      description: '',
      quantity: 1,
      unit: 'pcs',
      category: '',
      make: '',
      vendor: '',
      unitCost: 0,
      deliveryStatus: 'Pending',
      inspectionStatus: 'Not Inspected',
      remarks: ''
    };
    this.bomItemError = '';
    this.showBomItemModal = true;
  }

  openEditBomItemModal(item: BomItem) {
    this.editingBomItem = true;
    this.bomItemForm = { ...item };
    this.bomItemError = '';
    this.showBomItemModal = true;
  }

  closeBomItemModal() {
    this.showBomItemModal = false;
  }

  saveBomItem() {
    if (!this.activeRevision) return;
    if (!this.bomItemForm.partNumber || !this.bomItemForm.description) {
      this.bomItemError = 'Part Number and Description are required';
      return;
    }
    
    this.isSavingBomItem = true;
    if (this.editingBomItem) {
      this.bomService.updateItem(this.projectId, this.bomItemForm._id, this.bomItemForm).subscribe({
        next: () => {
          this.isSavingBomItem = false;
          this.closeBomItemModal();
          this.loadBomItems(this.activeRevision!._id);
        },
        error: (err) => {
          this.isSavingBomItem = false;
          this.bomItemError = err.error?.message || 'Failed to update item';
        }
      });
    } else {
      this.bomService.createItem(this.projectId, this.activeRevision._id, this.bomItemForm).subscribe({
        next: () => {
          this.isSavingBomItem = false;
          this.closeBomItemModal();
          this.loadBomItems(this.activeRevision!._id);
        },
        error: (err) => {
          this.isSavingBomItem = false;
          this.bomItemError = err.error?.message || 'Failed to add item';
        }
      });
    }
  }

  confirmDeleteBomItem(item: BomItem) {
    this.bomItemToDelete = item;
    this.showDeleteBomItemModal = true;
  }

  executeDeleteBomItem() {
    if (!this.bomItemToDelete || !this.activeRevision) return;
    this.bomService.deleteItem(this.projectId, this.bomItemToDelete._id).subscribe({
      next: () => {
        this.showDeleteBomItemModal = false;
        this.bomItemToDelete = null;
        this.loadBomItems(this.activeRevision!._id);
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to delete item');
        this.showDeleteBomItemModal = false;
        this.bomItemToDelete = null;
      }
    });
  }
  // =========================================================================
  // FINANCIALS TAB LOGIC
  // =========================================================================

  financialSummary: FinancialSummary | null = null;
  transactions: Transaction[] = [];
  financialsLoading = false;

  showTransactionModal = false;
  editingTransaction = false;
  transactionForm: any = {};
  isSavingTransaction = false;
  transactionError = '';

  showBudgetModal = false;
  budgetForm: any = { budget: 0 };
  isSavingBudget = false;
  budgetError = '';

  transactionFilter: 'All' | 'Inflow' | 'Outflow' = 'All';

  get filteredTransactions() {
    if (this.transactionFilter === 'All') return this.transactions;
    return this.transactions.filter(t => t.type === this.transactionFilter);
  }

  setTransactionFilter(filter: 'All' | 'Inflow' | 'Outflow') {
    this.transactionFilter = filter;
  }

  loadFinancials() {
    this.financialsLoading = true;
    
    // Load Summary
    this.financialService.getSummary(this.projectId).subscribe({
      next: (res) => {
        this.financialSummary = res.data;
        // Also update overviewData if it exists
        if (this.overviewData && this.overviewData.financialStats) {
          this.overviewData.financialStats = this.financialSummary;
        } else if (this.overviewData) {
          this.overviewData.financialStats = this.financialSummary;
        }
      },
      error: () => {}
    });

    // Load Transactions
    this.financialService.getTransactions(this.projectId).subscribe({
      next: (res) => {
        this.transactions = res.data;
        this.financialsLoading = false;
      },
      error: () => {
        this.financialsLoading = false;
      }
    });
  }

  // Transaction Modal
  openAddTransactionModal() {
    this.editingTransaction = false;
    this.transactionForm = {
      description: '',
      amount: null,
      type: 'Outflow',
      category: 'General',
      date: new Date().toISOString().split('T')[0],
      status: 'Planned'
    };
    this.transactionError = '';
    this.showTransactionModal = true;
  }

  openEditTransactionModal(txn: Transaction) {
    this.editingTransaction = true;
    this.transactionForm = {
      ...txn,
      date: new Date(txn.date).toISOString().split('T')[0]
    };
    this.transactionError = '';
    this.showTransactionModal = true;
  }

  closeTransactionModal() {
    this.showTransactionModal = false;
  }

  saveTransaction() {
    if (!this.transactionForm.description || !this.transactionForm.amount) {
      this.transactionError = 'Description and Amount are required';
      return;
    }
    
    this.isSavingTransaction = true;
    if (this.editingTransaction) {
      this.financialService.updateTransaction(this.projectId, this.transactionForm._id, this.transactionForm).subscribe({
        next: () => {
          this.isSavingTransaction = false;
          this.closeTransactionModal();
          this.loadFinancials();
        },
        error: (err) => {
          this.isSavingTransaction = false;
          this.transactionError = err.error?.message || 'Failed to update transaction';
        }
      });
    } else {
      this.financialService.createTransaction(this.projectId, this.transactionForm).subscribe({
        next: () => {
          this.isSavingTransaction = false;
          this.closeTransactionModal();
          this.loadFinancials();
        },
        error: (err) => {
          this.isSavingTransaction = false;
          this.transactionError = err.error?.message || 'Failed to add transaction';
        }
      });
    }
  }

  deleteTransaction(txn: Transaction) {
    if (confirm('Are you sure you want to delete this transaction?')) {
      this.financialService.deleteTransaction(this.projectId, txn._id).subscribe({
        next: () => {
          this.loadFinancials();
        },
        error: (err) => {
          alert(err.error?.message || 'Failed to delete transaction');
        }
      });
    }
  }

  // Budget Modal
  openBudgetModal() {
    this.budgetForm = { budget: this.financialSummary?.budget || this.overviewData?.project?.budget || 0 };
    this.budgetError = '';
    this.showBudgetModal = true;
  }

  closeBudgetModal() {
    this.showBudgetModal = false;
  }

  saveBudget() {
    this.isSavingBudget = true;
    // We update budget via existing updateProject endpoint
    this.projectService.updateProject(this.projectId, { budget: this.budgetForm.budget }).subscribe({
      next: () => {
        this.isSavingBudget = false;
        this.closeBudgetModal();
        this.loadOverview();
        if (this.activeTab === 'Financials') {
          this.loadFinancials();
        }
      },
      error: (err) => {
        this.isSavingBudget = false;
        this.budgetError = err.error?.message || 'Failed to update budget';
      }
    });
  }

  // ── Member Assignment & Management ──────────────────────────────────────────
  showAssignMemberModal = false;
  selectedUserIdToAssign = '';
  assignableUsers: any[] = [];
  isAssigningMember = false;
  assignMemberError: string | null = null;
  assignMemberSuccess: string | null = null;

  getProjectMembersList(): any[] {
    if (!this.project || !this.project.members) return [];
    return this.project.members;
  }

  getMemberDepartmentName(m: any): string {
    if (!m) return 'General';
    if (m.departmentId && typeof m.departmentId === 'object') {
      const name = m.departmentId.departmentName || '';
      const code = m.departmentId.departmentCode || '';
      return code ? `${name} (${code})` : name || m.department || 'General';
    }
    return m.department || 'General';
  }

  getMemberVerticalName(m: any): string {
    if (!m) return 'General';
    if (m.verticalId && typeof m.verticalId === 'object') {
      return m.verticalId.name || 'General';
    }
    return 'General';
  }

  getMemberRoleBadgeClass(role?: string): string {
    switch (role) {
      case 'Manager': return 'status-in-progress';
      case 'Lead': return 'status-completed';
      default: return 'status-not-started';
    }
  }

  getUniqueDepartmentCount(): number {
    const members = this.getProjectMembersList();
    const depts = new Set(members.map(m => this.getMemberDepartmentName(m)));
    return depts.size;
  }

  getUniqueVerticalCount(): number {
    const members = this.getProjectMembersList();
    const verts = new Set(members.map(m => this.getMemberVerticalName(m)));
    return verts.size;
  }

  openAssignMemberModal() {
    this.assignMemberError = null;
    this.selectedUserIdToAssign = '';
    this.showAssignMemberModal = true;

    this.authService.getUsers().subscribe({
      next: (res) => {
        if (res.success) {
          const currentMemberIds = new Set((this.project?.members || []).map((m: any) => (m._id || m.id || m).toString()));
          this.assignableUsers = res.data.filter(u => !currentMemberIds.has((u.id || (u as any)._id).toString()));
        }
      },
      error: (err) => {
        this.assignMemberError = err.error?.message || 'Failed to fetch users';
      }
    });
  }

  closeAssignMemberModal() {
    this.showAssignMemberModal = false;
    this.selectedUserIdToAssign = '';
    this.assignMemberError = null;
  }

  getSelectedUserToAssign(): any | null {
    if (!this.selectedUserIdToAssign) return null;
    return this.assignableUsers.find(u => (u.id || u._id) === this.selectedUserIdToAssign) || null;
  }

  submitAssignMember() {
    if (!this.selectedUserIdToAssign || !this.projectId) return;
    this.isAssigningMember = true;
    this.assignMemberError = null;

    this.projectService.addMember(this.projectId, this.selectedUserIdToAssign).subscribe({
      next: (res) => {
        this.isAssigningMember = false;
        if (res.success && res.data) {
          this.project = res.data as unknown as Project;
          this.assignMemberSuccess = 'Member assigned to project successfully!';
          setTimeout(() => this.assignMemberSuccess = null, 4000);
          this.closeAssignMemberModal();
        }
      },
      error: (err) => {
        this.isAssigningMember = false;
        this.assignMemberError = err.error?.message || 'Failed to assign member to project';
      }
    });
  }

  removeMemberFromProject(memberId: string) {
    if (!confirm('Are you sure you want to remove this member from the project?')) return;
    this.projectService.removeMember(this.projectId, memberId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.project = res.data as unknown as Project;
          this.assignMemberSuccess = 'Member removed from project.';
          setTimeout(() => this.assignMemberSuccess = null, 4000);
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to remove member');
      }
    });
  }
}


