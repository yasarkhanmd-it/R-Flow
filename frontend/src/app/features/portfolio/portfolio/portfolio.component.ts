import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService } from '../../../core/services/dashboard.service';
import { LucideAngularModule, Briefcase, Activity, CheckCircle, AlertTriangle, Clock, DollarSign, Flag, FolderKanban } from 'lucide-angular';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.scss'
})
export class PortfolioComponent implements OnInit {
  readonly Briefcase = Briefcase;
  readonly Activity = Activity;
  readonly CheckCircle = CheckCircle;
  readonly AlertTriangle = AlertTriangle;
  readonly Clock = Clock;
  readonly DollarSign = DollarSign;
  readonly Flag = Flag;
  readonly FolderKanban = FolderKanban;
  readonly Math = Math;

  private readonly dashboardService = inject(DashboardService);
  private readonly router = inject(Router);
  
  isLoading = true;
  portfolioData: any = null;

  ganttViewMode: 'Projects' | 'Tasks + resources' = 'Projects';
  timelineMonths: { name: string; year: number; isCurrentMonth?: boolean }[] = [];
  timelineStartMs: number = 0;
  timelineEndMs: number = 0;
  todayLeftPct: number = 50;

  ngOnInit() {
    this.fetchPortfolio();
  }

  generateTimelineScale(ganttList?: any[]) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    let minMs = Infinity;
    let maxMs = -Infinity;

    if (ganttList && ganttList.length > 0) {
      ganttList.forEach(p => {
        if (p.startDate) {
          const s = new Date(p.startDate).getTime();
          if (!isNaN(s) && s < minMs) minMs = s;
        }
        if (p.expectedEndDate) {
          const e = new Date(p.expectedEndDate).getTime();
          if (!isNaN(e) && e > maxMs) maxMs = e;
        }
      });
    }

    let start: Date;
    let end: Date;

    if (minMs !== Infinity && maxMs !== -Infinity) {
      const dMin = new Date(minMs);
      const dMax = new Date(maxMs);
      // Pad starting from 1st of earliest month to last day of latest month
      start = new Date(dMin.getFullYear(), dMin.getMonth(), 1);
      end = new Date(dMax.getFullYear(), dMax.getMonth() + 1, 0);
    } else {
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      end = new Date(now.getFullYear(), now.getMonth() + 8, 0);
    }
    
    this.timelineStartMs = start.getTime();
    this.timelineEndMs = end.getTime();
    
    const totalMs = this.timelineEndMs - this.timelineStartMs;
    const nowMs = Date.now();
    this.todayLeftPct = Math.max(0, Math.min(100, ((nowMs - this.timelineStartMs) / totalMs) * 100));

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    this.timelineMonths = [];
    let cur = new Date(start);
    while (cur <= end) {
      const mIdx = cur.getMonth();
      const yr = cur.getFullYear();
      const mName = months[mIdx];
      const yrShort = String(yr).slice(-2);
      const isCurrentMonth = yr === currentYear && mIdx === currentMonth;

      this.timelineMonths.push({
        name: `${mName} '${yrShort}`,
        year: yr,
        isCurrentMonth
      });
      cur.setMonth(cur.getMonth() + 1);
    }
  }

  fetchPortfolio() {
    this.isLoading = true;
    this.dashboardService.getPortfolioData().subscribe({
      next: (res) => {
        if (res.success) {
          this.portfolioData = res.data;
          this.generateTimelineScale(this.portfolioData?.ganttTimeline);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to fetch portfolio data', err);
        this.generateTimelineScale();
        this.isLoading = false;
      }
    });
  }

  getGanttBarLeft(startDateStr?: string): number {
    if (!this.timelineStartMs || !this.timelineEndMs) return 0;
    const totalMs = this.timelineEndMs - this.timelineStartMs;
    const start = startDateStr ? new Date(startDateStr).getTime() : this.timelineStartMs;
    const leftPct = ((start - this.timelineStartMs) / totalMs) * 100;
    return Math.max(0, Math.min(95, leftPct));
  }

  getGanttBarWidth(startDateStr?: string, endDateStr?: string): number {
    if (!this.timelineStartMs || !this.timelineEndMs) return 20;
    const totalMs = this.timelineEndMs - this.timelineStartMs;
    const start = startDateStr ? new Date(startDateStr).getTime() : this.timelineStartMs;
    const end = endDateStr ? new Date(endDateStr).getTime() : (start + 90 * 24 * 60 * 60 * 1000);
    const widthPct = ((end - start) / totalMs) * 100;
    const leftPct = this.getGanttBarLeft(startDateStr);
    return Math.max(4, Math.min(100 - leftPct, widthPct));
  }

  getMilestoneLeft(dueDateStr?: string): number {
    if (!dueDateStr || !this.timelineStartMs || !this.timelineEndMs) return -1;
    const totalMs = this.timelineEndMs - this.timelineStartMs;
    const due = new Date(dueDateStr).getTime();
    const leftPct = ((due - this.timelineStartMs) / totalMs) * 100;
    return Math.max(0, Math.min(100, leftPct));
  }

  formatCurrencyShort(val?: number): string {
    if (val === undefined || val === null || isNaN(val)) return '₹0';
    const absVal = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (absVal >= 10000000) {
      return `${sign}₹${(absVal / 10000000).toFixed(2)} Cr`;
    } else if (absVal >= 100000) {
      return `${sign}₹${(absVal / 100000).toFixed(1)} L`;
    } else if (absVal >= 1000) {
      return `${sign}₹${(absVal / 1000).toFixed(1)} K`;
    }
    return `${sign}₹${absVal.toLocaleString()}`;
  }

  getProjectWidth(proj: any): number {
    const matrix = this.portfolioData?.projectMatrix || [];
    if (matrix.length === 0) return 0;
    const totalB = this.portfolioData?.stats?.totalBudget || 0;
    if (totalB <= 0) {
      return 100 / matrix.length;
    }
    const b = proj.budget || 0;
    const pct = (b / totalB) * 100;
    return Math.max(pct, 5); // Ensure minimum 5% width for visibility
  }

  getSegmentColor(health: string): string {
    switch (health) {
      case 'On Track': return '#dc2626'; // Primary Brand Red
      case 'At Risk': return '#ea580c'; // Shaded Warm Red
      case 'Delayed': return '#991b1b'; // Dark Crimson Red
      case 'Completed': return '#ef4444'; // Soft Rose Red
      default: return '#64748b'; // slate
    }
  }

  openProjectBoard(projectId: string) {
    if (projectId) {
      this.router.navigate(['/projects', projectId, 'board']);
    }
  }

  getDeptChartMaxY(): number {
    const list = this.portfolioData?.departmentComparison || [];
    if (list.length === 0) return 100;
    let max = 0;
    list.forEach((d: any) => {
      if (d.budget > max) max = d.budget;
      if (d.actual > max) max = d.actual;
    });
    return max > 0 ? max * 1.15 : 100;
  }

  getRankedProjects(): any[] {
    const list = this.portfolioData?.projectMatrix || [];
    if (!list.length) return [];
    return list.map((p: any) => {
      const b = p.budget || 0;
      const act = p.actualCost || p.actual || 0;
      const rev = p.revenue || 0;
      let margin = 0;
      if (rev > 0) {
        margin = Math.round(((rev - act) / rev) * 100);
      } else if (b > 0) {
        margin = Math.round(((b - act) / b) * 100);
      }
      return {
        ...p,
        marginPct: Math.max(0, Math.min(100, margin))
      };
    }).sort((a: any, b: any) => b.marginPct - a.marginPct).slice(0, 8);
  }

  getHealthColor(health: string): string {
    switch (health) {
      case 'On Track': return '#10b981'; // green
      case 'At Risk': return '#f59e0b'; // yellow
      case 'Delayed': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  }

  getHealthBadgeClass(health: string): string {
    switch (health) {
      case 'On Track': return 'badge-success';
      case 'At Risk': return 'badge-warning';
      case 'Delayed': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }
}
