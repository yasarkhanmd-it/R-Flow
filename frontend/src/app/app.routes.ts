import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { VerifyOtpComponent } from './features/auth/verify-otp/verify-otp.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
import { DashboardComponent } from './features/dashboard/dashboard/dashboard.component';
import { PortfolioComponent } from './features/portfolio/portfolio/portfolio.component';
import { ProjectsComponent } from './features/projects/projects.component';
import { ProjectBoardComponent } from './features/projects/project-board/project-board.component';
import { ModuleDetailsComponent } from './features/projects/module-details/module-details.component';
import { TasksComponent } from './features/tasks/tasks.component';
import { ReportsComponent } from './features/reports/reports.component';
import { DepartmentListComponent } from './features/departments/department-list/department-list.component';
import { DepartmentDetailComponent } from './features/departments/department-detail/department-detail.component';
import { VerticalListComponent } from './features/verticals/vertical-list/vertical-list.component';
import { VerticalDetailComponent } from './features/verticals/vertical-detail/vertical-detail.component';
import { UsersComponent } from './features/users/users.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';

import { TimelineComponent } from './features/timeline/timeline.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'verify-otp', component: VerifyOtpComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'portfolio', component: PortfolioComponent },
      { path: 'tasks', component: TasksComponent },
      { path: 'projects', component: ProjectsComponent },
      { path: 'timeline', component: TimelineComponent },
      { path: 'projects/:id/board', component: ProjectBoardComponent },
      { path: 'projects/:id/modules/:moduleId', component: ModuleDetailsComponent },
      { path: 'stories/:moduleId', component: ModuleDetailsComponent },
      // Verticals (new organizational structure)
      { path: 'verticals', component: VerticalListComponent },
      { path: 'verticals/:id', component: VerticalDetailComponent },
      // Departments (still accessible by direct URL / from vertical detail)
      { path: 'departments', component: VerticalListComponent },
      { path: 'departments/:id', component: DepartmentDetailComponent },
      { path: 'users', component: UsersComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'notifications', loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent) },
      { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent) }
    ]
  },
  { path: '**', redirectTo: '/login' }
];
