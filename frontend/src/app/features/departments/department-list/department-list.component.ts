import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0f172a;color:#94a3b8;font-family:Inter,sans-serif;flex-direction:column;gap:16px;text-align:center;padding:24px;">
      <div style="font-size:2.5rem;">🏛️</div>
      <h2 style="color:#e2e8f0;margin:0;font-size:1.2rem;font-weight:600;">Departments are now organized under Verticals</h2>
      <p style="margin:0;font-size:0.875rem;">Redirecting you to Verticals...</p>
    </div>
  `
})
export class DepartmentListComponent implements OnInit {
  private readonly router = inject(Router);

  ngOnInit(): void {
    setTimeout(() => this.router.navigate(['/verticals']), 1000);
  }
}
