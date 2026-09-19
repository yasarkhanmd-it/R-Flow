import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService, Notification, ActivityLog } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './notifications.component.html',
  styleUrls: ['../shared-list-page.scss']
})
export class NotificationsComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly authService = inject(AuthService);

  activeTab: 'notifications' | 'approvals' | 'audit' = 'notifications';
  
  notifications: Notification[] = [];
  approvals: Notification[] = [];
  auditLogs: ActivityLog[] = [];
  
  currentUserRole = this.authService.getCurrentUser()?.role || '';
  
  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.notificationService.getNotifications().subscribe(res => {
      if (res.success) {
        this.notifications = res.data.filter(n => n.type !== 'PROJECT_JOIN_REQUEST');
        this.approvals = res.data.filter(n => n.type === 'PROJECT_JOIN_REQUEST');
      }
    });

    if (this.currentUserRole === 'Manager' || this.currentUserRole === 'Lead' || this.currentUserRole === 'Super Admin') {
      this.notificationService.getAuditLogs(50).subscribe(res => {
        if (res.success) {
          this.auditLogs = res.data;
        }
      });
    }
  }

  markAsRead(notification: Notification) {
    if (!notification.read) {
      this.notificationService.markAsRead(notification._id).subscribe(() => {
        notification.read = true;
      });
    }
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications.forEach(n => n.read = true);
      this.approvals.forEach(n => n.read = true);
    });
  }

  approve(notification: Notification) {
    this.notificationService.approveRequest(notification._id).subscribe(res => {
      if (res.success) {
        notification.status = 'APPROVED';
        notification.read = true;
      }
    });
  }

  reject(notification: Notification) {
    this.notificationService.rejectRequest(notification._id).subscribe(res => {
      if (res.success) {
        notification.status = 'REJECTED';
        notification.read = true;
      }
    });
  }
}
