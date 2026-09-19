import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { 
  Project, 
  Task, 
  Milestone, 
  Risk, 
  Issue, 
  Bom, 
  BomItem, 
  Transaction, 
  ResourceAllocation, 
  WorkLog, 
  User, 
  Department, 
  Vertical 
} from '../models/reportModels';

const getUser = (req: Request) => (req as any).user;

const buildProjectQueryFilter = (query: any) => {
  const filter: any = {};
  if (query.verticalId && mongoose.Types.ObjectId.isValid(query.verticalId)) {
    filter.verticalId = new mongoose.Types.ObjectId(query.verticalId);
  }
  if (query.departmentId && mongoose.Types.ObjectId.isValid(query.departmentId)) {
    filter.departmentIds = new mongoose.Types.ObjectId(query.departmentId);
  }
  if (query.projectId && mongoose.Types.ObjectId.isValid(query.projectId)) {
    filter._id = new mongoose.Types.ObjectId(query.projectId);
  }
  return filter;
};

// ── GET /api/reports/executive-summary ────────────────────────────────────────
export const getExecutiveSummaryReport = async (req: Request, res: Response) => {
  try {
    const filter = buildProjectQueryFilter(req.query);
    const projects = await Project.find(filter)
      .populate('managerId', 'employeeName email')
      .populate('leadId', 'employeeName email')
      .populate('verticalId', 'name')
      .populate('departmentIds', 'departmentName departmentCode');

    const projectIds = projects.map(p => p._id);

    const tasks = await Task.find({ projectId: { $in: projectIds } });
    const milestones = await Milestone.find({ projectId: { $in: projectIds } });
    const risks = await Risk.find({ projectId: { $in: projectIds } });
    const issues = await Issue.find({ projectId: { $in: projectIds } });
    const transactions = await Transaction.find({ projectId: { $in: projectIds } });
    const allocations = await ResourceAllocation.find({ projectId: { $in: projectIds } });

    let totalBudget = 0;
    let actualCost = 0;
    let realizedRevenue = 0;

    projects.forEach(p => totalBudget += (p.budget || 0));
    transactions.forEach(t => {
      if (t.type === 'Outflow') actualCost += (t.amount || 0);
      if (t.type === 'Inflow') realizedRevenue += (t.amount || 0);
    });

    let totalEstHours = 0;
    let totalActHours = 0;
    tasks.forEach(t => {
      totalEstHours += (t.estimatedHours || 0);
      totalActHours += (t.actualHours || 0);
    });

    res.json({
      success: true,
      data: {
        totalProjects: projects.length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'Done').length,
        overdueTasks: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Done').length,
        totalMilestones: milestones.length,
        completedMilestones: milestones.filter(m => m.status === 'Completed').length,
        openRisks: risks.filter(r => r.status !== 'Mitigated' && r.status !== 'Closed').length,
        openIssues: issues.filter(i => i.status !== 'Resolved' && i.status !== 'Closed').length,
        financials: {
          totalBudget,
          actualCost,
          realizedRevenue,
          variance: totalBudget - actualCost
        },
        resourceStats: {
          totalAllocations: allocations.length,
          totalEstHours,
          totalActHours,
          overallUtilization: totalEstHours > 0 ? Math.round((totalActHours / totalEstHours) * 100) : 0
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/reports/project-performance ──────────────────────────────────────
export const getProjectPerformanceReport = async (req: Request, res: Response) => {
  try {
    const filter = buildProjectQueryFilter(req.query);
    const projects = await Project.find(filter)
      .populate('managerId', 'employeeName')
      .populate('leadId', 'employeeName')
      .populate('verticalId', 'name')
      .populate('departmentIds', 'departmentName');

    const projectPerformanceList = await Promise.all(projects.map(async (p) => {
      const pTasks = await Task.find({ projectId: p._id });
      const pMilestones = await Milestone.find({ projectId: p._id });
      const pRisks = await Risk.find({ projectId: p._id, status: { $nin: ['Closed', 'Mitigated'] } });
      const pIssues = await Issue.find({ projectId: p._id, status: { $nin: ['Closed', 'Resolved'] } });

      const totalTasks = pTasks.length;
      const completedTasks = pTasks.filter(t => t.status === 'Done').length;
      const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      let estHours = 0;
      let actHours = 0;
      pTasks.forEach(t => {
        estHours += (t.estimatedHours || 0);
        actHours += (t.actualHours || 0);
      });

      return {
        id: p._id,
        name: p.name,
        code: p.projectCode || 'N/A',
        managerName: (p.managerId as any)?.employeeName || 'Unassigned',
        leadName: (p.leadId as any)?.employeeName || 'Unassigned',
        verticalName: (p.verticalId as any)?.name || 'General',
        status: p.status,
        health: p.health || 'On Track',
        progressPct,
        totalTasks,
        completedTasks,
        milestonesTotal: pMilestones.length,
        milestonesDone: pMilestones.filter(m => m.status === 'Completed').length,
        openRisks: pRisks.length,
        openIssues: pIssues.length,
        estHours,
        actHours,
        hoursVariance: actHours - estHours
      };
    }));

    res.json({ success: true, data: projectPerformanceList });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/reports/resource-utilization ─────────────────────────────────────
export const getResourceUtilizationReport = async (req: Request, res: Response) => {
  try {
    const filter = buildProjectQueryFilter(req.query);
    const projects = await Project.find(filter);
    const projectIds = projects.map(p => p._id);

    const allocations = await ResourceAllocation.find({ projectId: { $in: projectIds } })
      .populate('userId', 'employeeName employeeId email department role')
      .populate('projectId', 'name projectCode')
      .populate('departmentId', 'departmentName');

    const tasks = await Task.find({ projectId: { $in: projectIds } }).populate('assigneeId', 'employeeName');

    const resourceReport = allocations.map(a => {
      const u = a.userId as any;
      const p = a.projectId as any;
      const d = a.departmentId as any;

      const userTasks = tasks.filter(t => {
        const assignee = t.assigneeId as any;
        return assignee && assignee._id.toString() === u?._id?.toString() && t.projectId.toString() === p?._id?.toString();
      });

      let estHours = 0;
      let actHours = 0;
      userTasks.forEach(t => {
        estHours += (t.estimatedHours || 0);
        actHours += (t.actualHours || 0);
      });

      return {
        id: a._id,
        userName: u?.employeeName || 'Unknown User',
        employeeId: u?.employeeId || 'N/A',
        email: u?.email || '',
        projectName: p?.name || 'Project',
        projectRole: a.projectRole,
        departmentName: d?.departmentName || u?.department || 'Unassigned',
        allocationPct: a.allocationPercentage,
        status: a.status,
        assignedTasksCount: userTasks.length,
        estHours,
        actHours,
        utilizationPct: estHours > 0 ? Math.round((actHours / estHours) * 100) : 0
      };
    });

    res.json({ success: true, data: resourceReport });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/reports/financial-bom ────────────────────────────────────────────
export const getFinancialBomReport = async (req: Request, res: Response) => {
  try {
    const filter = buildProjectQueryFilter(req.query);
    const projects = await Project.find(filter);

    const report = await Promise.all(projects.map(async (p) => {
      const txns = await Transaction.find({ projectId: p._id });
      const boms = await Bom.find({ projectId: p._id });
      const bomItems = await BomItem.find({ projectId: p._id });

      let actualCost = 0;
      let realizedRevenue = 0;
      txns.forEach(t => {
        if (t.type === 'Outflow') actualCost += (t.amount || 0);
        if (t.type === 'Inflow') realizedRevenue += (t.amount || 0);
      });

      let bomEstimatedCost = 0;
      bomItems.forEach(bi => {
        bomEstimatedCost += ((bi.quantity || 0) * (bi.unitCost || 0));
      });

      const budget = p.budget || 0;

      return {
        projectId: p._id,
        projectName: p.name,
        projectCode: p.projectCode || 'N/A',
        budget,
        actualCost,
        realizedRevenue,
        budgetVariance: budget - actualCost,
        bomsCount: boms.length,
        bomItemsCount: bomItems.length,
        bomEstimatedCost
      };
    }));

    res.json({ success: true, data: report });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/reports/risks-issues ─────────────────────────────────────────────
export const getRisksIssuesReport = async (req: Request, res: Response) => {
  try {
    const filter = buildProjectQueryFilter(req.query);
    const projects = await Project.find(filter);
    const projectIds = projects.map(p => p._id);

    const risks = await Risk.find({ projectId: { $in: projectIds } }).populate('projectId', 'name');
    const issues = await Issue.find({ projectId: { $in: projectIds } }).populate('projectId', 'name');

    const severityCount = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    risks.forEach(r => {
      if (r.severity && (severityCount as any)[r.severity] !== undefined) {
        (severityCount as any)[r.severity]++;
      }
    });

    res.json({
      success: true,
      data: {
        riskSummary: {
          totalRisks: risks.length,
          openRisks: risks.filter(r => r.status !== 'Mitigated' && r.status !== 'Closed').length,
          severityCount
        },
        issueSummary: {
          totalIssues: issues.length,
          openIssues: issues.filter(i => i.status !== 'Resolved' && i.status !== 'Closed').length
        },
        risksList: risks.map(r => ({
          title: r.title,
          projectName: (r.projectId as any)?.name || 'Project',
          severity: r.severity,
          status: r.status
        })),
        issuesList: issues.map(i => ({
          issueId: i.issueId,
          title: i.title,
          projectName: (i.projectId as any)?.name || 'Project',
          severity: i.severity,
          status: i.status
        }))
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/reports/export (CSV Generator) ───────────────────────────────────
export const exportReportCSV = async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const filter = buildProjectQueryFilter(req.query);

    if (type === 'project-performance') {
      const projects = await Project.find(filter)
        .populate('managerId', 'employeeName')
        .populate('leadId', 'employeeName');

      let csv = 'Project Name,Code,Manager,Lead,Status,Health,Estimated Hours,Actual Hours\n';
      for (const p of projects) {
        const pTasks = await Task.find({ projectId: p._id });
        let est = 0, act = 0;
        pTasks.forEach(t => { est += (t.estimatedHours || 0); act += (t.actualHours || 0); });

        const mgr = (p.managerId as any)?.employeeName || '';
        const lead = (p.leadId as any)?.employeeName || '';
        csv += `"${p.name}","${p.projectCode || ''}","${mgr}","${lead}","${p.status}","${p.health || 'On Track'}",${est},${act}\n`;
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=project-performance-report.csv');
      return res.send(csv);
    }

    res.status(400).json({ success: false, message: 'Invalid export type requested' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
