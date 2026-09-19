import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { 
  LucideAngularModule, 
  Calendar, 
  CheckCircle2, 
  ClipboardList, 
  Folder, 
  Timer,
  Plus,
  ArrowRight,
  User,
  Users,
  Activity,
  Bell,
  Check,
  X,
  AlertCircle,
  FolderOpen
} from 'lucide-angular';
import { AuthService, AuthUser } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ProjectService } from '../../../core/services/project.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TaskFormComponent } from '../../tasks/task-form/task-form.component';
import { timer, Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, TaskFormComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  private readonly projectService = inject(ProjectService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  // Lucide Icons
  readonly Calendar = Calendar;
  readonly ClipboardList = ClipboardList;
  readonly Folder = Folder;
  readonly CheckCircle2 = CheckCircle2;
  readonly Timer = Timer;
  readonly Plus = Plus;
  readonly ArrowRight = ArrowRight;
  readonly User = User;
  readonly Users = Users;
  readonly Activity = Activity;
  readonly Bell = Bell;
  readonly Check = Check;
  readonly X = X;
  readonly AlertCircle = AlertCircle;
  readonly FolderOpen = FolderOpen;

  user: AuthUser | null = this.authService.getCurrentUser();
  currentDate = new Date();
  isLoading = true;

  // Dashboard Data
  dashboardData: any = null;
  role: any;
  stats: any;
  myWork: any;
  latestProjects: any[] = [];

  // Task Form Modal Control
  showTaskForm = false;

  private pollingSubscription?: Subscription;

  ngOnInit(): void {
    this.loadProfileAndStats();
    this.startPolling();
  }

  ngOnDestroy(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  startPolling() {
    this.pollingSubscription = timer(10000, 10000).subscribe(() => {
      if (!this.showTaskForm) {
        this.fetchDashboardData(true);
      }
    });
  }

  loadProfileAndStats() {
    this.isLoading = true;
    this.authService.profile().subscribe({
      next: (response) => {
        this.user = response.data.user;
        this.fetchDashboardData();
      },
      error: () => {
        this.authService.logout();
      }
    });
  }

  fetchDashboardData(silent = false) {
    if (!silent) this.isLoading = true;
    this.dashboardService.getDashboardData().subscribe({
      next: (res) => {
        if (!silent) this.isLoading = false;
        if (res.success) {
          this.dashboardData = res.data;
          this.role = this.dashboardData.role;
          this.stats = this.dashboardData.stats;
          this.myWork = this.dashboardData.myWork;
          this.latestProjects = this.dashboardData.latestProjects || [];
        }
      },
      error: (err) => {
        if (!silent) this.isLoading = false;
        console.error('Failed to load dashboard data', err);
      }
    });
  }

  // Quick Action Handler
  handleQuickAction(action: string) {
    switch (action) {
      case 'new-task':
        this.showTaskForm = true;
        break;
      case 'view-projects':
        this.router.navigate(['/projects']);
        break;
      case 'view-tasks':
        this.router.navigate(['/tasks']);
        break;
      case 'create-project':
        this.router.navigate(['/projects'], { queryParams: { openAdd: 'true' } });
        break;
      case 'manage-requests':
        this.router.navigate(['/notifications']);
        break;
      case 'view-reports':
        alert('Reports generation coming soon!');
        break;
    }
  }

  onTaskSaved() {
    this.showTaskForm = false;
    this.fetchDashboardData();
  }

  // Formatting Helpers
  getInitials(name?: string): string {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  formatTime(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  }

  // Notification action approval directly from dashboard
  approveRequest(notificationId: string, event: Event) {
    event.stopPropagation();
    this.notificationService.approveRequest(notificationId).subscribe({
      next: (res: any) => {
        if (res.success) {
          alert('Join request approved!');
          this.fetchDashboardData();
        }
      },
      error: (err: any) => {
        alert(err.error?.message || 'Failed to approve request');
      }
    });
  }

  acceptProject(projectId: string) {
    this.projectService.acceptProject(projectId).subscribe({
      next: (res: any) => {
        if (res.success) {
          alert('Project accepted successfully!');
          this.fetchDashboardData();
        }
      },
      error: (err: any) => {
        alert(err.error?.message || 'Failed to accept project');
      }
    });
  }

  rejectProject(projectId: string) {
    const reason = prompt('Please enter a rejection reason:');
    if (reason === null) return; // Cancelled prompt
    if (!reason.trim()) {
      alert('A rejection reason is required.');
      return;
    }
    this.projectService.rejectProject(projectId, reason).subscribe({
      next: (res: any) => {
        if (res.success) {
          alert('Project rejected.');
          this.fetchDashboardData();
        }
      },
      error: (err: any) => {
        alert(err.error?.message || 'Failed to reject project');
      }
    });
  }
}
