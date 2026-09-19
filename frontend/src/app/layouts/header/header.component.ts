import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Search, Bell, HelpCircle, ChevronDown, LogOut, Check } from 'lucide-angular';
import { AuthService, AuthUser } from '../../core/services/auth.service';
import { NotificationService, Notification } from '../../core/services/notification.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  readonly Search = Search;
  readonly Bell = Bell;
  readonly HelpCircle = HelpCircle;
  readonly ChevronDown = ChevronDown;
  readonly LogOut = LogOut;
  readonly Check = Check;

  user: AuthUser | null = null;
  isUserMenuOpen = false;
  
  notifications: Notification[] = [];
  isNotificationMenuOpen = false;

  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    if (this.user?.role === 'Manager' || this.user?.role === 'Lead') {
      this.loadNotifications();
    }
  }

  loadNotifications() {
    this.notificationService.getNotifications().subscribe({
      next: (res) => {
        if (res.success) {
          this.notifications = res.data;
        }
      },
      error: (err) => console.error(err)
    });
  }

  get pendingNotifications() {
    return this.notifications.filter(n => n.status === 'PENDING');
  }

  get userInitials(): string {
    if (!this.user?.employeeName) return 'JD';

    const names = this.user.employeeName.trim().split(/\s+/);
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();

    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }

  get displayRole(): string {
    if ((this.user as any)?.superAdmin) {
      return 'Unit Head';
    }
    return this.user?.role || 'Employee';
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
    this.isNotificationMenuOpen = false;
  }

  toggleNotificationMenu(): void {
    this.isNotificationMenuOpen = !this.isNotificationMenuOpen;
    this.isUserMenuOpen = false;
    if (this.isNotificationMenuOpen && (this.user?.role === 'Manager' || this.user?.role === 'Lead')) {
      this.loadNotifications();
    }
  }

  approve(notificationId: string) {
    this.notificationService.approveRequest(notificationId).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadNotifications();
        }
      },
      error: (err) => console.error(err)
    });
  }

  logout(): void {
    this.isUserMenuOpen = false;
    this.authService.logout();
  }
}
