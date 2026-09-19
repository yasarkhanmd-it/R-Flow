import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-title">
          <h1>My Profile</h1>
        </div>
      </div>
      <div class="data-card" *ngIf="user">
        <div style="padding: 20px;">
          <h3>{{ user.employeeName }}</h3>
          <p><strong>Email:</strong> {{ user.email }}</p>
          <p><strong>Role:</strong> {{ user.role }}</p>
          <p><strong>Department ID:</strong> {{ user.departmentId }}</p>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../shared-list-page.scss']
})
export class ProfileComponent implements OnInit {
  private readonly authService = inject(AuthService);
  user: any;

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
  }
}
