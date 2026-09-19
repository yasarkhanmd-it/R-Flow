import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-title">
          <h1>System Settings</h1>
        </div>
      </div>
      <div class="data-card">
        <div style="padding: 20px;">
          <p>Settings configuration is currently handled by the super admin portal. General configurations will be available here in a future update.</p>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../shared-list-page.scss']
})
export class SettingsComponent {}
