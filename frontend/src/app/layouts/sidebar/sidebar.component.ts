import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  LayoutDashboard,
  Users,
  Building,
  Building2,
  Layers,
  FolderKanban,
  CheckSquare,
  BarChart2,
  Bell,
  Shield,
  Settings,
  UserCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Calendar
} from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  isCollapsed = false;

  readonly LayoutDashboard = LayoutDashboard;
  readonly Users = Users;
  readonly Building = Building;
  readonly Building2 = Building2;
  readonly Layers = Layers;
  readonly FolderKanban = FolderKanban;
  readonly CheckSquare = CheckSquare;
  readonly BarChart2 = BarChart2;
  readonly Bell = Bell;
  readonly Shield = Shield;
  readonly Settings = Settings;
  readonly UserCircle = UserCircle;
  readonly LogOut = LogOut;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly Briefcase = Briefcase;
  readonly Calendar = Calendar;

  menuItems = [
    { label: 'Dashboard', route: '/dashboard', icon: this.LayoutDashboard, adminOnly: false, managerOrAdminOnly: false },
    { label: 'Portfolio', route: '/portfolio', icon: this.Briefcase, adminOnly: false, managerOrAdminOnly: true },
    { label: 'My Stories', route: '/tasks', icon: this.CheckSquare, adminOnly: false, managerOrAdminOnly: false },
    { label: 'My Projects', route: '/projects', icon: this.FolderKanban, adminOnly: false, managerOrAdminOnly: false },
    { label: 'Timeline', route: '/timeline', icon: this.Calendar, adminOnly: false, managerOrAdminOnly: false },
    { label: 'Users', route: '/users', icon: this.Users, adminOnly: true, managerOrAdminOnly: false },
    { label: 'Departments & Verticals', route: '/verticals', icon: this.Layers, adminOnly: false, managerOrAdminOnly: false },
    { label: 'Reports', route: '/reports', icon: this.BarChart2, adminOnly: false, managerOrAdminOnly: false },
    { label: 'Notifications', route: '/notifications', icon: this.Bell, adminOnly: false, managerOrAdminOnly: false },
  ];

  bottomMenuItems = [
    { label: 'Settings', route: '/settings', icon: this.Settings },
    { label: 'Profile', route: '/profile', icon: this.UserCircle },
  ];

  constructor(private authService: AuthService) { }

  get filteredMenuItems() {
    const user = this.authService.getCurrentUser();
    const isAdminLevel = (user as any)?.superAdmin === true || user?.role === 'Administrator';
    const isManager = user?.role === 'Manager';
    return this.menuItems.filter(item => {
      if (item.adminOnly && !isAdminLevel) return false;
      if (item.managerOrAdminOnly && !(isAdminLevel || isManager)) return false;
      return true;
    });
  }

  get filteredBottomMenuItems() {
    const user = this.authService.getCurrentUser();
    if (user?.role === 'Lead') {
      return this.bottomMenuItems.filter(item => item.label !== 'Settings');
    }
    return this.bottomMenuItems;
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  logout() {
    this.authService.logout();
  }
}
