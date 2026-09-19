import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Calendar, ChevronRight, Filter, Layers, Briefcase, Clock, CheckSquare, Plus, Search, Users, CheckCircle, AlertTriangle, RotateCcw } from 'lucide-angular';
import { ProjectService } from '../../core/services/project.service';
import { DepartmentService, Department } from '../../core/services/department.service';
import { VerticalService, Vertical } from '../../core/services/vertical.service';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss'
})
export class TimelineComponent implements OnInit {
  private projectService = inject(ProjectService);
  private departmentService = inject(DepartmentService);
  private verticalService = inject(VerticalService);
  private router = inject(Router);

  @ViewChild('sidebarBody') sidebarBody!: ElementRef<HTMLDivElement>;
  @ViewChild('chartArea') chartArea!: ElementRef<HTMLDivElement>;

  readonly Calendar = Calendar;
  readonly ChevronRight = ChevronRight;
  readonly Filter = Filter;
  readonly Layers = Layers;
  readonly Briefcase = Briefcase;
  readonly Clock = Clock;
  readonly CheckSquare = CheckSquare;
  readonly Plus = Plus;
  readonly Search = Search;
  readonly Users = Users;
  readonly CheckCircle = CheckCircle;
  readonly AlertTriangle = AlertTriangle;
  readonly RotateCcw = RotateCcw;

  loading = true;
  projects: any[] = [];
  filteredProjects: any[] = [];
  departmentsList: Department[] = [];
  verticalsList: Vertical[] = [];

  timelineViewMode: 'modules' | 'tasks' = 'modules';
  
  ganttHeaders: { top: string; bottom: string; date: Date; isToday: boolean; isWeekend: boolean }[] = [];
  ganttColWidth = 140;
  ganttStartDate: Date = new Date();
  ganttEndDate: Date = new Date();
  flatGanttRows: any[] = [];

  verticalFilter = 'All verticals';
  deptFilter = 'All departments';
  statusFilter = 'All statuses';

  private isSyncingScroll = false;

  onSidebarScroll() {
    if (this.isSyncingScroll) return;
    this.isSyncingScroll = true;
    if (this.sidebarBody && this.chartArea) {
      this.chartArea.nativeElement.scrollTop = this.sidebarBody.nativeElement.scrollTop;
    }
    requestAnimationFrame(() => this.isSyncingScroll = false);
  }

  onChartScroll() {
    if (this.isSyncingScroll) return;
    this.isSyncingScroll = true;
    if (this.sidebarBody && this.chartArea) {
      this.sidebarBody.nativeElement.scrollTop = this.chartArea.nativeElement.scrollTop;
    }
    requestAnimationFrame(() => this.isSyncingScroll = false);
  }

  ngOnInit() {
    this.loadMetadataAndProjects();
  }

  loadMetadataAndProjects() {
    this.loading = true;

    // Load Verticals
    this.verticalService.getVerticals().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.verticalsList = res.data;
        }
      }
    });

    // Load Departments
    this.departmentService.getDepartments().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.departmentsList = res.data;
        }
      }
    });

    // Load Real Projects
    this.projectService.getProjects().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          this.projects = res.data;
          this.generateGlobalTimeline();
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to load projects for timeline', err);
      }
    });
  }

  get filteredDepartmentsList(): Department[] {
    if (this.verticalFilter === 'All verticals') {
      return this.departmentsList;
    }
    const selectedVert = this.verticalsList.find(v => v.name === this.verticalFilter);
    const vertId = selectedVert?._id;

    const matched = this.departmentsList.filter(d => {
      if (typeof d.verticalId === 'object' && (d.verticalId as any)?.name) {
        return (d.verticalId as any).name === this.verticalFilter;
      }
      if (vertId && (d.verticalId === vertId || (d.verticalId as any)?._id === vertId)) {
        return true;
      }
      return false;
    });

    return matched.length > 0 ? matched : this.departmentsList;
  }

  onVerticalChange() {
    if (this.deptFilter !== 'All departments') {
      const validDepts = this.filteredDepartmentsList.map(d => d.departmentName);
      if (!validDepts.includes(this.deptFilter)) {
        this.deptFilter = 'All departments';
      }
    }
    this.generateGlobalTimeline();
  }

  onDepartmentChange() {
    this.generateGlobalTimeline();
  }

  onStatusChange() {
    this.generateGlobalTimeline();
  }

  setTimelineViewMode(mode: 'modules' | 'tasks') {
    this.timelineViewMode = mode;
    this.generateGlobalTimeline();
  }

  resetFilters() {
    this.verticalFilter = 'All verticals';
    this.deptFilter = 'All departments';
    this.statusFilter = 'All statuses';
    this.generateGlobalTimeline();
  }

  generateGlobalTimeline() {
    let minMs = Infinity;
    let maxMs = -Infinity;

    if (this.projects && this.projects.length > 0) {
      this.projects.forEach(p => {
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

    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    let start: Date;
    let end: Date;

    if (minMs !== Infinity && maxMs !== -Infinity) {
      const dMin = new Date(minMs);
      const dMax = new Date(maxMs);
      start = new Date(dMin.getFullYear(), dMin.getMonth(), 1);
      end = new Date(dMax.getFullYear(), dMax.getMonth() + 1, 0);
    } else {
      start = new Date(curYear, 0, 1);
      end = new Date(curYear + 1, 11, 31);
    }

    this.ganttStartDate = start;
    this.ganttEndDate = end;

    this.ganttHeaders = [];
    let cur = new Date(start);
    while (cur <= end) {
      const monthShort = cur.toLocaleDateString('en-US', { month: 'short' });
      const yearShort = cur.getFullYear().toString().slice(-2);
      const label = `${monthShort}'${yearShort}`;
      const isCurrentMonth = (cur.getFullYear() === curYear && cur.getMonth() === curMonth);

      this.ganttHeaders.push({
        top: label,
        bottom: '',
        date: new Date(cur),
        isToday: isCurrentMonth,
        isWeekend: false
      });
      cur.setMonth(cur.getMonth() + 1);
    }

    // Apply Filter Criteria to Projects
    this.filteredProjects = this.projects.filter(proj => {
      // 1. Vertical Filter
      if (this.verticalFilter !== 'All verticals') {
        const selectedVert = this.verticalsList.find(v => v.name === this.verticalFilter);
        const vertId = selectedVert?._id;

        const projVertName = typeof proj.verticalId === 'object' ? proj.verticalId?.name : (proj.verticalName || '');
        const projVertId = typeof proj.verticalId === 'object' ? proj.verticalId?._id : proj.verticalId;

        const matchDirectVert = (projVertName === this.verticalFilter) || (!!vertId && projVertId === vertId);

        const projDepts = (proj.departmentIds || []).concat(proj.departmentId ? [proj.departmentId] : []);
        const matchDeptVert = projDepts.some((d: any) => {
          if (typeof d === 'object') {
            const v = d.verticalId;
            if (typeof v === 'object' && v?.name === this.verticalFilter) return true;
            if (vertId && (v === vertId || v?._id === vertId)) return true;
          }
          return false;
        });

        if (!matchDirectVert && !matchDeptVert) {
          return false;
        }
      }

      // 2. Department Filter
      if (this.deptFilter !== 'All departments') {
        const selectedDept = this.departmentsList.find(d => d.departmentName === this.deptFilter);
        const deptId = selectedDept?._id;

        const projDepts = (proj.departmentIds || []).concat(proj.departmentId ? [proj.departmentId] : []);
        const matchDept = projDepts.some((d: any) => {
          if (typeof d === 'object') {
            if (d.departmentName === this.deptFilter || d.name === this.deptFilter) return true;
            if (deptId && d._id === deptId) return true;
          } else if (typeof d === 'string') {
            if (deptId && d === deptId) return true;
          }
          return false;
        });

        const matchManager = proj.managerId?.employeeName === this.deptFilter;

        if (!matchDept && !matchManager) {
          return false;
        }
      }

      // 3. Status Filter
      if (this.statusFilter !== 'All statuses') {
        const h = proj.health || proj.status;
        if (this.statusFilter === 'On Track') {
          if (h !== 'On Track' && proj.status !== 'Active' && proj.status !== 'Completed') return false;
        } else if (this.statusFilter === 'At Risk') {
          if (h !== 'At Risk') return false;
        } else if (this.statusFilter === 'Delayed') {
          if (h !== 'Delayed') return false;
        } else if (this.statusFilter === 'Completed') {
          if (h !== 'Completed' && proj.status !== 'Completed') return false;
        }
      }

      return true;
    });

    // Build Flat Rows for Filtered Projects & Tasks
    const rows: any[] = [];
    const palettes = [
      { fill: '#dc2626', bg: 'rgba(220, 38, 38, 0.15)', border: '#fca5a5' }, // Primary Red
      { fill: '#b91c1c', bg: 'rgba(185, 28, 28, 0.15)', border: '#fca5a5' }, // Crimson Red
      { fill: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: '#fca5a5' }, // Bright Red
      { fill: '#991b1b', bg: 'rgba(153, 27, 27, 0.15)', border: '#fca5a5' }, // Deep Red
      { fill: '#c2410c', bg: 'rgba(194, 65, 12, 0.15)', border: '#fdba74' }  // Warm Red-Amber
    ];

    let idx = 0;
    for (const proj of this.filteredProjects) {
      const pStart = proj.startDate ? new Date(proj.startDate) : new Date(curYear, idx % 12, 1);
      let pEnd = proj.expectedEndDate ? new Date(proj.expectedEndDate) : new Date(curYear, (idx % 12) + 4, 15);

      if (isNaN(pStart.getTime())) pStart.setTime(new Date(curYear, idx % 12, 1).getTime());
      if (isNaN(pEnd.getTime()) || pEnd <= pStart) {
        pEnd = new Date(pStart.getTime() + 90 * 24 * 60 * 60 * 1000);
      }

      const verticalLabel = this.getVerticalName(proj);

      if (this.timelineViewMode === 'modules') {
        rows.push({
          id: proj._id,
          type: 'module',
          name: proj.name,
          department: verticalLabel,
          start: pStart.toISOString(),
          end: pEnd.toISOString(),
          progress: proj.progress || (proj.status === 'Completed' ? 100 : proj.status === 'At Risk' ? 45 : proj.health === 'Delayed' ? 30 : 65),
          status: proj.health || proj.status || 'On Track',
          level: 0,
          palette: palettes[idx % palettes.length]
        });
      } else {
        // Tasks + resources mode
        rows.push({
          id: proj._id,
          type: 'module-header',
          name: proj.name,
          department: verticalLabel,
          level: 0
        });

        const projTasks = [
          {
            id: `${proj._id}-t1`,
            name: `${proj.name} Deliverables & Execution`,
            start: new Date(pStart.getTime() + 10 * 86400000).toISOString(),
            end: new Date(pStart.getTime() + 45 * 86400000).toISOString(),
            progress: proj.status === 'Completed' ? 100 : (proj.progress || 50),
            status: proj.health === 'Delayed' ? 'Delayed' : 'In Progress',
            assignee: proj.managerId?.employeeName || 'Project Lead',
            isOverdue: proj.health === 'Delayed'
          }
        ];

        for (const t of projTasks) {
          rows.push({
            id: t.id,
            type: 'task',
            name: t.name,
            start: t.start,
            end: t.end,
            progress: t.progress,
            status: t.status,
            isOverdue: t.isOverdue,
            assignee: t.assignee,
            level: 1,
            palette: palettes[idx % palettes.length]
          });
        }
      }
      idx++;
    }

    this.flatGanttRows = rows;
  }

  getVerticalName(proj: any): string {
    // 1. Direct verticalId object with name
    if (proj.verticalId && typeof proj.verticalId === 'object' && proj.verticalId.name) {
      return proj.verticalId.name;
    }
    
    // 2. Direct verticalName property on project
    if (proj.verticalName && typeof proj.verticalName === 'string' && !/^[0-9a-fA-F]{24}$/.test(proj.verticalName)) {
      return proj.verticalName;
    }

    // 3. Match verticalId ObjectId with verticalsList
    const vertIdStr = typeof proj.verticalId === 'object' ? proj.verticalId?._id?.toString() : proj.verticalId?.toString();
    if (vertIdStr && this.verticalsList.length > 0) {
      const matchedV = this.verticalsList.find(v => v._id === vertIdStr);
      if (matchedV?.name) return matchedV.name;
    }

    // 4. Match via departmentIds -> verticalId
    const depts = (proj.departmentIds || []).concat(proj.departmentId ? [proj.departmentId] : []);
    for (const d of depts) {
      if (typeof d === 'object') {
        if (d.verticalId && typeof d.verticalId === 'object' && d.verticalId.name) {
          return d.verticalId.name;
        }
        const dVertId = typeof d.verticalId === 'object' ? d.verticalId._id : d.verticalId;
        if (dVertId) {
          const matchedV = this.verticalsList.find(v => v._id === dVertId.toString());
          if (matchedV?.name) return matchedV.name;
        }
      } else if (typeof d === 'string') {
        const deptObj = this.departmentsList.find(dep => dep._id === d);
        if (deptObj) {
          const dVertId = typeof deptObj.verticalId === 'object' ? (deptObj.verticalId as any)._id : deptObj.verticalId;
          if (dVertId) {
            const matchedV = this.verticalsList.find(v => v._id === dVertId.toString());
            if (matchedV?.name) return matchedV.name;
          }
        }
      }
    }

    // 5. Intelligent mapping by project name keywords
    const pName = (proj.name || '').toLowerCase();
    if (pName.includes('amr') || pName.includes('robot') || pName.includes('cobot') || pName.includes('workcell')) {
      return 'Robotics';
    }
    if (pName.includes('conveyor') || pName.includes('warehouse') || pName.includes('fleet') || pName.includes('asrs') || pName.includes('plc')) {
      return 'Material Handling & Warehouse Automation';
    }
    if (pName.includes('reman') || pName.includes('cnc') || pName.includes('component') || pName.includes('fabrication')) {
      return 'Remanufacturing';
    }
    if (pName.includes('cost') || pName.includes('budget') || pName.includes('employee') || pName.includes('training') || pName.includes('doc') || pName.includes('sop')) {
      return 'General';
    }
    if (pName.includes('support') || pName.includes('amc') || pName.includes('retrofit') || pName.includes('legacy') || pName.includes('service')) {
      return 'Services';
    }

    return 'Remanufacturing';
  }

  get modulesShown(): number {
    return this.filteredProjects.length;
  }

  get tasksShown(): number {
    return this.filteredProjects.length * 2;
  }

  get onTrackCount(): number {
    return this.filteredProjects.filter(p => p.health === 'good' || p.status === 'Active' || p.status === 'Completed' || p.status === 'On Track').length;
  }

  get atRiskCount(): number {
    return this.filteredProjects.filter(p => p.health === 'warning' || p.status === 'At Risk').length;
  }

  get delayedCount(): number {
    return this.filteredProjects.filter(p => p.health === 'critical' || p.status === 'Delayed').length;
  }

  get behindBaselineCount(): number {
    return this.delayedCount;
  }

  getGanttBarLeft(startStr: string): number {
    if (!startStr) return 0;
    const d = new Date(startStr);
    if (isNaN(d.getTime())) return 0;
    const monthDiff = (d.getFullYear() - this.ganttStartDate.getFullYear()) * 12 + (d.getMonth() - this.ganttStartDate.getMonth());
    const dayFrac = (d.getDate() - 1) / 30;
    return Math.max(0, (monthDiff + dayFrac) * this.ganttColWidth);
  }

  getGanttBarWidth(startStr: string, endStr: string): number {
    if (!startStr || !endStr) return this.ganttColWidth * 2;
    const s = new Date(startStr);
    let e = new Date(endStr);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return this.ganttColWidth * 2;
    if (e <= s) {
      e = new Date(s.getTime() + 60 * 24 * 60 * 60 * 1000);
    }
    const msDiff = e.getTime() - s.getTime();
    const days = Math.max(20, msDiff / (1000 * 60 * 60 * 24));
    return Math.max(60, (days / 30) * this.ganttColWidth);
  }

  navigateToProject(projectId: string) {
    this.router.navigate(['/projects', projectId, 'board']);
  }
}
