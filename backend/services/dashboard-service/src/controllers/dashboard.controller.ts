import { Request, Response } from 'express';
import { Project } from '../models/projectModel';
import { Task } from '../models/taskModel';
import { Notification } from '../models/notificationModel';
import { Module } from '../models/moduleModel';
import { Milestone } from '../models/milestoneModel';
import { Risk } from '../models/riskModel';
import { Issue } from '../models/issueModel';
import { Transaction } from '../models/transactionModel';
import { Bom } from '../models/bomModel';
import { BomItem } from '../models/bomItemModel';

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const normRole = (user?.role || 'Employee').toLowerCase();
    const userId = user._id || user.id;

    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    if (normRole === 'employee' || normRole === 'user' || (normRole !== 'manager' && normRole !== 'lead')) {
      let joinedProjects = await Project.find({ members: userId })
        .populate('managerId', 'employeeName')
        .populate('leadId', 'employeeName')
        .lean();

      if (!joinedProjects || joinedProjects.length === 0) {
        joinedProjects = await Project.find({})
          .populate('managerId', 'employeeName')
          .populate('leadId', 'employeeName')
          .lean();
      }

      let assignedTasks = await Task.find({ assigneeId: userId })
        .populate('projectId', 'name')
        .populate('assigneeId', 'employeeName')
        .lean();

      if (!assignedTasks || assignedTasks.length === 0) {
        assignedTasks = await Task.find({})
          .populate('projectId', 'name')
          .populate('assigneeId', 'employeeName')
          .lean();
      }

      const tasksByProject = new Map<string, typeof assignedTasks>();
      assignedTasks.forEach(t => {
        const pid = (t.projectId as any)?._id?.toString() || t.projectId?.toString();
        if (!tasksByProject.has(pid)) tasksByProject.set(pid, []);
        tasksByProject.get(pid)!.push(t);
      });

      const totalTasks = assignedTasks.length;
      const completedTasksCount = assignedTasks.filter(t => t.status === 'Done').length;
      const pendingTasksCount = totalTasks - completedTasksCount;
      const completionPercentage = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

      const totalProjects = joinedProjects.length;
      const activeProjectsCount = joinedProjects.filter(p => p.status === 'Active').length;
      const archivedProjectsCount = joinedProjects.filter(p => p.status === 'Completed' || p.status === 'On Hold').length;

      const upcomingDeadlinesCount = assignedTasks.filter(t => {
        if (!t.dueDate || t.status === 'Done') return false;
        const due = new Date(t.dueDate);
        return due >= today && due <= sevenDaysFromNow;
      }).length;

      const dueTodayTasks = assignedTasks.filter(t => {
        if (!t.dueDate || t.status === 'Done') return false;
        return new Date(t.dueDate).setHours(0,0,0,0) === new Date(today).setHours(0,0,0,0);
      });

      const overdueTasksList = assignedTasks.filter(t => {
        if (!t.dueDate || t.status === 'Done') return false;
        return new Date(t.dueDate).setHours(0,0,0,0) < new Date(today).setHours(0,0,0,0);
      });

      const inProgressTasks = assignedTasks.filter(t => t.status === 'In Progress');
      const pendingReviewTasks = assignedTasks.filter(t => t.status === 'Pending Review');
      const recentlyCompletedTasks = assignedTasks
        .filter(t => t.status === 'Done')
        .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
        .slice(0, 10);

      const latestProjectsRaw = [...joinedProjects]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
        .slice(0, 5);

      const latestProjects = latestProjectsRaw.map(proj => {
        const projTasks = tasksByProject.get(proj._id.toString()) || [];
        const totalTasks = projTasks.length;
        const completedTasks = projTasks.filter(t => t.status === 'Done').length;
        const pendingTasks = totalTasks - completedTasks;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        return {
          _id: proj._id,
          name: proj.name,
          description: proj.description,
          status: proj.status,
          managerName: (proj.managerId as any)?.employeeName || 'Unknown',
          leadName: (proj.leadId as any)?.employeeName || 'Unassigned',
          membersCount: proj.members?.length || 0,
          totalTasks,
          completedTasks,
          pendingTasks,
          progress,
          rejectionReason: proj.rejectionReason,
          expectedEndDate: proj.expectedEndDate,
          assignedDate: proj.assignedDate,
          createdAt: proj.createdAt
        };
      });

      return res.status(200).json({
        success: true,
        data: {
          role: 'Employee',
          employeeName: user.employeeName,
          stats: {
            tasks: {
              total: totalTasks,
              pending: pendingTasksCount,
              completed: completedTasksCount
            },
            projects: {
              total: totalProjects,
              active: activeProjectsCount,
              archived: archivedProjectsCount
            },
            completedTasks: {
              total: completedTasksCount,
              percentage: completionPercentage
            },
            upcomingDeadlines: upcomingDeadlinesCount
          },
          myWork: {
            dueToday: dueTodayTasks,
            overdue: overdueTasksList,
            inProgress: inProgressTasks,
            pendingReview: pendingReviewTasks,
            recentlyCompleted: recentlyCompletedTasks
          },
          latestProjects
        }
      });

    } else if (normRole === 'manager') {
      let managedProjects = await Project.find({ managerId: userId })
        .populate('members', 'employeeName');

      if (!managedProjects || managedProjects.length === 0) {
        managedProjects = await Project.find({})
          .populate('members', 'employeeName');
      }

      const projectIds = managedProjects.map(p => p._id);

      let managedTasks = await Task.find({ projectId: { $in: projectIds } })
        .populate('projectId', 'name')
        .populate('assigneeId', 'employeeName');

      if (!managedTasks || managedTasks.length === 0) {
        managedTasks = await Task.find({})
          .populate('projectId', 'name')
          .populate('assigneeId', 'employeeName');
      }

      const uniqueEmployeeIds = new Set<string>();
      managedProjects.forEach(p => {
        p.members.forEach((m: any) => {
          uniqueEmployeeIds.add(m._id.toString());
        });
      });
      const totalEmployees = uniqueEmployeeIds.size;

      const totalProjects = managedProjects.length;
      const totalTasks = managedTasks.length;
      const completedTasksCount = managedTasks.filter(t => t.status === 'Done').length;
      const pendingTasksCount = totalTasks - completedTasksCount;
      const overdueTasksCount = managedTasks.filter(t => {
        if (!t.dueDate || t.status === 'Done') return false;
        return new Date(t.dueDate) < today;
      }).length;

      const activeModulesRaw = await Module.find({ projectId: { $in: projectIds }, status: { $in: ['Approved', 'In Progress'] } }).populate('projectId', 'name');
      const activeModules = activeModulesRaw.map(m => ({
        _id: m._id,
        name: m.name,
        projectName: (m.projectId as any)?.name || 'Unknown',
        progress: m.progress,
        status: m.status
      }));

      const overdueTasksList = managedTasks.filter(t => {
        if (!t.dueDate || t.status === 'Done') return false;
        return new Date(t.dueDate) < today;
      }).map(t => ({
        _id: t._id,
        summary: t.summary,
        projectName: (t.projectId as any)?.name || 'Unknown',
        assigneeName: (t.assigneeId as any)?.employeeName || 'Unassigned',
        dueDate: t.dueDate
      }));

      const projectOverview = await Promise.all(managedProjects.map(async (proj) => {
        const projTasks = managedTasks.filter(t => (t.projectId as any)?._id?.toString() === proj._id?.toString());
        const totalTasks = projTasks.length;
        const completedTasks = projTasks.filter(t => t.status === 'Done').length;
        const pendingTasks = totalTasks - completedTasks;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        return {
          _id: proj._id,
          name: proj.name,
          description: proj.description,
          status: proj.status,
          managerName: (proj.managerId as any)?.employeeName || 'Unknown',
          leadName: (proj.leadId as any)?.employeeName || 'Unassigned',
          membersCount: proj.members?.length || 0,
          totalTasks,
          completedTasks,
          pendingTasks,
          progress,
          rejectionReason: proj.rejectionReason,
          expectedEndDate: proj.expectedEndDate,
          assignedDate: proj.assignedDate,
          createdAt: proj.createdAt
        };
      }));

      const upcomingDeadlines = managedTasks
        .filter(t => {
          if (!t.dueDate || t.status === 'Done') return false;
          const due = new Date(t.dueDate);
          return due >= today && due <= sevenDaysFromNow;
        })
        .map(t => ({
          _id: t._id,
          summary: t.summary,
          dueDate: t.dueDate,
          assigneeName: (t.assigneeId as any)?.employeeName || 'Unassigned',
          priority: t.priority,
          isOverdue: new Date(t.dueDate as any) < today
        }))
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

      const taskActivities = managedTasks
        .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
        .slice(0, 10)
        .map(t => {
          let actionText = '';
          if (t.status === 'Done') {
            actionText = `completed task ${t.taskId}`;
          } else if (t.status === 'Pending Review') {
            actionText = `moved ${t.taskId} to Pending Review`;
          } else if (t.status === 'In Progress') {
            actionText = `started working on ${t.taskId}`;
          } else {
            actionText = `created task ${t.taskId}`;
          }
          return {
            userName: (t.assigneeId as any)?.employeeName || 'Someone',
            action: actionText,
            timestamp: t.updatedAt || t.createdAt,
            details: t.summary
          };
        });

      const notificationsRaw = await Notification.find({ toUser: userId })
        .populate('fromUser', 'employeeName')
        .populate('project', 'name')
        .sort({ updatedAt: -1 })
        .limit(10);

      const notificationActivities = notificationsRaw.map(n => {
        let actionText = '';
        if (n.status === 'APPROVED') {
          actionText = `approved ${(n.fromUser as any)?.employeeName || 'user'}'s request to join ${(n.project as any)?.name || 'project'}`;
        } else if (n.status === 'REJECTED') {
          actionText = `rejected ${(n.fromUser as any)?.employeeName || 'user'}'s request to join ${(n.project as any)?.name || 'project'}`;
        } else {
          actionText = `requested to join ${(n.project as any)?.name || 'project'}`;
        }
        return {
          userName: n.status === 'PENDING' ? ((n.fromUser as any)?.employeeName || 'Someone') : 'Manager',
          action: actionText,
          timestamp: n.updatedAt || n.createdAt,
          details: (n.project as any)?.name || ''
        };
      });

      const recentActivity = [...taskActivities, ...notificationActivities]
        .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
        .slice(0, 10);

      const pendingNotifications = notificationsRaw.filter(n => n.status === 'PENDING');

      return res.status(200).json({
        success: true,
        data: {
          role: 'Manager',
          employeeName: user.employeeName,
          stats: {
            totalProjects,
            totalEmployees,
            totalTasks,
            completedTasks: completedTasksCount,
            pendingTasks: pendingTasksCount,
            overdueTasks: overdueTasksCount
          },
          myWork: {
            activeModules,
            overdueTasksList
          },
          projectOverview,
          recentActivity,
          upcomingDeadlines,
          pendingNotifications
        }
      });
    } else if (normRole === 'lead') {
      let assignedProjects = await Project.find({ leadId: userId })
        .populate('managerId', 'employeeName')
        .populate('members', 'employeeName');

      if (!assignedProjects || assignedProjects.length === 0) {
        assignedProjects = await Project.find({})
          .populate('managerId', 'employeeName')
          .populate('members', 'employeeName');
      }

      const projectIds = assignedProjects.map(p => p._id);

      let projectTasks = await Task.find({ projectId: { $in: projectIds } })
        .populate('projectId', 'name')
        .populate('assigneeId', 'employeeName employeeId')
        .populate('reporterId', 'employeeName employeeId');

      if (!projectTasks || projectTasks.length === 0) {
        projectTasks = await Task.find({})
          .populate('projectId', 'name')
          .populate('assigneeId', 'employeeName employeeId')
          .populate('reporterId', 'employeeName employeeId');
      }
        
      const pendingModules = await Module.find({ projectId: { $in: projectIds }, status: 'Pending Approval' })
        .populate('projectId', 'name')
        .populate('createdBy', 'employeeName');

      const pendingModuleApprovals = pendingModules.map(m => ({
        _id: m._id,
        name: m.name,
        projectName: (m.projectId as any)?.name || 'Unknown',
        createdBy: (m.createdBy as any)?.employeeName || 'Unknown',
        createdAt: m.createdAt
      }));

      const pendingTaskReviews = projectTasks.filter(t => t.status === 'Pending Review').map(t => ({
        _id: t._id,
        summary: t.summary,
        projectName: (t.projectId as any)?.name || 'Unknown',
        assigneeName: (t.assigneeId as any)?.employeeName || 'Unassigned'
      }));

      const blockedTasks = projectTasks.filter(t => {
        if (t.status === 'Done') return false;
        if (!t.dueDate) return false;
        return new Date(t.dueDate) < today;
      }).map(t => ({
        _id: t._id,
        summary: t.summary,
        projectName: (t.projectId as any)?.name || 'Unknown',
        assigneeName: (t.assigneeId as any)?.employeeName || 'Unassigned',
        dueDate: t.dueDate
      }));

      const overdueTasksForNotif = projectTasks.filter(
        t => t.dueDate && new Date(t.dueDate) < today && t.status !== 'Done'
      );

      if (overdueTasksForNotif.length > 0) {
        const overdueTaskIds = overdueTasksForNotif.map(t => t._id);
        const existingNotifs = await Notification.find({
          type: 'TASK_OVERDUE',
          task: { $in: overdueTaskIds },
          toUser: userId
        }).select('task').lean();

        const alreadyNotified = new Set(existingNotifs.map(n => n.task?.toString()));
        const toCreate = overdueTasksForNotif.filter(t => !alreadyNotified.has(t._id.toString()));

        if (toCreate.length > 0) {
          await Notification.insertMany(toCreate.map(t => ({
            type: 'TASK_OVERDUE',
            toUser: userId,
            fromUser: userId,
            project: (t.projectId as any)._id || t.projectId,
            task: t._id,
            message: `${t.taskId} is overdue`
          })));
        }
      }

      const totalProjects = assignedProjects.length;
      const pendingAcceptance = assignedProjects.filter(p => p.status === 'Assigned' || p.status === 'Pending Acceptance').length;
      const activeProjects = assignedProjects.filter(p => p.status === 'Accepted' || p.status === 'Active').length;

      const totalTasks = projectTasks.length;
      const completedTasks = projectTasks.filter(t => t.status === 'Done').length;
      const pendingTasks = totalTasks - completedTasks;
      const overdueTasks = projectTasks.filter(t => {
        if (!t.dueDate || t.status === 'Done') return false;
        return new Date(t.dueDate) < today;
      }).length;

      const employeeMap = new Map<string, any>();
      assignedProjects.forEach(p => {
        p.members.forEach((m: any) => {
          const empId = m._id.toString();
          if (!employeeMap.has(empId)) {
            employeeMap.set(empId, {
              _id: m._id,
              employeeName: m.employeeName,
              pendingCount: 0,
              completedCount: 0,
              overdueCount: 0
            });
          }
        });
      });

      projectTasks.forEach(t => {
        if (t.assigneeId) {
          const empId = t.assigneeId._id.toString();
          if (employeeMap.has(empId)) {
            const stats = employeeMap.get(empId);
            if (t.status === 'Done') {
              stats.completedCount++;
            } else {
              stats.pendingCount++;
              if (t.dueDate && new Date(t.dueDate) < today) {
                stats.overdueCount++;
              }
            }
          }
        }
      });

      const employeeProgress = Array.from(employeeMap.values());

      const latestProjects = assignedProjects.map(proj => {
        const projTasks = projectTasks.filter(t => (t.projectId as any)?._id?.toString() === proj._id?.toString());
        const totalTasks = projTasks.length;
        const completedTasks = projTasks.filter(t => t.status === 'Done').length;
        const pendingTasks = totalTasks - completedTasks;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        return {
          _id: proj._id,
          name: proj.name,
          description: proj.description,
          status: proj.status,
          managerName: (proj.managerId as any)?.employeeName || 'Unknown',
          leadName: (proj.leadId as any)?.employeeName || 'Unassigned',
          membersCount: proj.members?.length || 0,
          totalTasks,
          completedTasks,
          pendingTasks,
          progress,
          rejectionReason: proj.rejectionReason,
          expectedEndDate: proj.expectedEndDate,
          assignedDate: proj.assignedDate,
          createdAt: proj.createdAt
        };
      });

      const taskActivities = projectTasks
        .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
        .slice(0, 10)
        .map(t => {
          let actionText = '';
          if (t.status === 'Done') {
            actionText = `completed task ${t.taskId}`;
          } else if (t.status === 'Pending Review') {
            actionText = `moved ${t.taskId} to Pending Review`;
          } else if (t.status === 'In Progress') {
            actionText = `started working on ${t.taskId}`;
          } else {
            actionText = `created task ${t.taskId}`;
          }
          return {
            userName: (t.assigneeId as any)?.employeeName || 'Someone',
            action: actionText,
            timestamp: t.updatedAt || t.createdAt,
            details: t.summary
          };
        });

      return res.status(200).json({
        success: true,
        data: {
          role: 'Lead',
          employeeName: user.employeeName,
          stats: {
            assignedProjects: totalProjects,
            pendingAcceptance,
            activeProjects,
            totalTasks,
            completedTasks,
            pendingTasks,
            overdueTasks
          },
          myWork: {
            pendingModuleApprovals,
            pendingTaskReviews,
            blockedTasks
          },
          latestProjects,
          employeeProgress,
          recentActivity: taskActivities
        }
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid User Role' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

export const getPortfolioData = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const normRole = (user?.role || '').toLowerCase();
    const userId = user._id || user.id;
    const isAdminLevel = user?.superAdmin === true || normRole === 'administrator';

    if (!isAdminLevel && normRole !== 'manager') {
      return res.status(403).json({ success: false, message: 'Forbidden: Portfolio access requires Manager or Administrator role.' });
    }

    let projects = [];
    if (isAdminLevel) {
      projects = await Project.find({}).populate('managerId', 'employeeName').lean();
    } else {
      projects = await Project.find({ managerId: userId }).populate('managerId', 'employeeName').lean();
    }

    const projectIds = projects.map(p => p._id);

    // Fetch related data across all projects
    const tasks = await Task.find({ projectId: { $in: projectIds } }).select('projectId status dueDate').lean();
    const milestones = await Milestone.find({ projectId: { $in: projectIds } }).select('projectId title status dueDate').lean();
    const risks = await Risk.find({ projectId: { $in: projectIds }, status: { $nin: ['Closed', 'Mitigated'] } }).select('projectId severity').lean();
    const issues = await Issue.find({ projectId: { $in: projectIds }, status: 'Open' }).select('projectId priority').lean();
    const boms = await Bom.find({ projectId: { $in: projectIds } }).select('projectId status targetDeliveryDate').lean();
    
    // Financials
    const transactions = await Transaction.find({ projectId: { $in: projectIds }, status: 'Completed' }).select('projectId type amount').lean();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Aggregate overall stats
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'Active' || p.status === 'Accepted').length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;
    const delayedProjects = projects.filter(p => p.status === 'Delayed').length;

    let onTrackCount = 0;
    let atRiskCount = 0;
    let delayedCount = 0;

    let totalBudget = 0;
    let actualCost = 0;
    let realizedRevenue = 0;

    projects.forEach(p => {
      totalBudget += (p.budget || 0);
      if ((p as any).actualCost) actualCost += (p as any).actualCost;
      if ((p as any).revenue) realizedRevenue += (p as any).revenue;
    });

    transactions.forEach(tx => {
      if (tx.type === 'Outflow') actualCost += tx.amount;
      else if (tx.type === 'Inflow') realizedRevenue += tx.amount;
    });

    // Open & overdue tasks
    const openTasks = tasks.filter(t => t.status !== 'Done' && t.status !== 'Completed');
    const overdueTasksCount = openTasks.filter(t => t.dueDate && new Date(t.dueDate) < today).length;
    const blockedTasksCount = openTasks.filter(t => t.status === 'Blocked').length;

    // BOM metrics
    const totalBoms = boms.length;
    const deliveredBoms = boms.filter(b => b.status === 'Delivered' || b.status === 'Completed' || b.status === 'Approved').length;
    const pendingBoms = boms.filter(b => b.status === 'Pending Approval' || b.status === 'In Review' || b.status === 'Draft' || b.status === 'Submitted').length;
    const overdueBoms = boms.filter(b => (b as any).targetDeliveryDate && new Date((b as any).targetDeliveryDate) < today && b.status !== 'Delivered').length;

    // Detailed Project Matrix
    const projectMatrix = projects.map(proj => {
      const pId = proj._id.toString();
      const pTasks = tasks.filter(t => (t.projectId as any)?._id?.toString() === pId || t.projectId?.toString() === pId);
      const pMilestones = milestones.filter(m => (m.projectId as any)?._id?.toString() === pId || m.projectId?.toString() === pId);
      const pRisks = risks.filter(r => (r.projectId as any)?._id?.toString() === pId || r.projectId?.toString() === pId);
      const pIssues = issues.filter(i => (i.projectId as any)?._id?.toString() === pId || i.projectId?.toString() === pId);
      
      const totalT = pTasks.length;
      const completedT = pTasks.filter(t => t.status === 'Done' || t.status === 'Completed').length;
      const progress = totalT > 0 ? Math.round((completedT / totalT) * 100) : 0;

      // Determine health
      let derivedHealth = proj.health || 'On Track';
      if (!proj.health) {
        if (proj.status === 'Delayed') derivedHealth = 'Delayed';
        else if (pRisks.some(r => r.severity === 'Critical') || pIssues.some(i => i.priority === 'Critical')) derivedHealth = 'At Risk';
      }

      if (derivedHealth === 'On Track') onTrackCount++;
      else if (derivedHealth === 'At Risk') atRiskCount++;
      else if (derivedHealth === 'Delayed') delayedCount++;

      return {
        _id: proj._id,
        name: proj.name,
        managerName: (proj.managerId as any)?.employeeName || 'Unknown',
        status: proj.status,
        health: derivedHealth,
        progress,
        budget: proj.budget || 0,
        actualCost: (proj as any).actualCost || 0,
        revenue: (proj as any).revenue || 0,
        openRisks: pRisks.length,
        openIssues: pIssues.length,
        criticalIssues: pIssues.filter(i => i.priority === 'Critical').length
      };
    });

    // Upcoming Milestones across portfolio (Next 30 days)
    const thirtyDays = new Date();
    thirtyDays.setDate(today.getDate() + 30);
    
    const upcomingMilestones = milestones.filter(m => {
      if (!m.dueDate || m.status === 'Completed') return false;
      const d = new Date(m.dueDate);
      return d >= today && d <= thirtyDays;
    }).map(m => {
      const p = projects.find(p => p._id.toString() === m.projectId.toString());
      return {
        _id: m._id,
        title: m.title,
        dueDate: m.dueDate,
        status: m.status,
        projectName: p ? p.name : 'Unknown'
      };
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 10);

    const fcf = realizedRevenue - actualCost;
    const margin = realizedRevenue > 0
      ? Math.round(((realizedRevenue - actualCost) / realizedRevenue) * 1000) / 10
      : (totalBudget > 0 ? Math.round(((totalBudget - actualCost) / totalBudget) * 1000) / 10 : 0);

    // Fetch department and vertical names from DB for overall comparison
    const db = (Project.db || (Transaction.db as any));
    let allDepts: any[] = [];
    let allVerts: any[] = [];
    try {
      if (db) {
        allDepts = await db.collection('departments').find({}).toArray();
        allVerts = await db.collection('verticals').find({}).toArray();
      }
    } catch (e) {
      console.error('Failed to fetch departments/verticals in portfolio controller', e);
    }

    const deptMap = new Map<string, string>();
    allDepts.forEach(d => {
      deptMap.set(d._id.toString(), d.departmentName || d.name || 'General');
    });

    const vertMap = new Map<string, string>();
    allVerts.forEach(v => {
      vertMap.set(v._id.toString(), v.name || 'General');
    });

    // Grouping by Department
    const deptGroup = new Map<string, any>();
    // Grouping by Vertical
    const vertGroup = new Map<string, any>();

    const ganttTimeline: any[] = [];

    projects.forEach(proj => {
      const pId = proj._id.toString();
      const pTasks = tasks.filter(t => (t.projectId as any)?._id?.toString() === pId || t.projectId?.toString() === pId);
      const pMilestones = milestones.filter(m => (m.projectId as any)?._id?.toString() === pId || m.projectId?.toString() === pId);
      const pRisks = risks.filter(r => (r.projectId as any)?._id?.toString() === pId || r.projectId?.toString() === pId);
      const pIssues = issues.filter(i => (i.projectId as any)?._id?.toString() === pId || i.projectId?.toString() === pId);
      
      const totalT = pTasks.length;
      const completedT = pTasks.filter(t => t.status === 'Done' || t.status === 'Completed').length;
      const progress = totalT > 0 ? Math.round((completedT / totalT) * 100) : 0;

      let derivedHealth = proj.health || 'On Track';
      if (!proj.health) {
        if (proj.status === 'Delayed') derivedHealth = 'Delayed';
        else if (pRisks.some(r => r.severity === 'Critical') || pIssues.some(i => i.priority === 'Critical')) derivedHealth = 'At Risk';
      }

      // Resolve Department Name
      let dName = 'General';
      if (proj.departmentIds && proj.departmentIds.length > 0) {
        const dIdStr = (proj.departmentIds[0] as any)?._id?.toString() || proj.departmentIds[0]?.toString();
        if (deptMap.has(dIdStr)) dName = deptMap.get(dIdStr)!;
      } else if (proj.departmentId) {
        const dIdStr = (proj.departmentId as any)?._id?.toString() || proj.departmentId?.toString();
        if (deptMap.has(dIdStr)) dName = deptMap.get(dIdStr)!;
      }

      // Resolve Vertical Name
      let vName = 'General';
      if (proj.verticalId) {
        const vIdStr = (proj.verticalId as any)?._id?.toString() || proj.verticalId?.toString();
        if (vertMap.has(vIdStr)) vName = vertMap.get(vIdStr)!;
        else if (typeof proj.verticalId === 'object' && (proj.verticalId as any).name) vName = (proj.verticalId as any).name;
        else if (typeof proj.verticalId === 'string' && proj.verticalId.length < 20) vName = proj.verticalId;
      }

      const pBudget = proj.budget || 0;
      const pActual = (proj as any).actualCost || 0;
      const pRevenue = (proj as any).revenue || 0;
      const pOpenTasks = pTasks.filter(t => t.status !== 'Done' && t.status !== 'Completed');
      const pOverdueTasks = pOpenTasks.filter(t => t.dueDate && new Date(t.dueDate) < today).length;
      const isRiskOrDelayed = derivedHealth === 'At Risk' || derivedHealth === 'Delayed' || proj.status === 'Delayed';

      // 1. Department Aggregation
      if (!deptGroup.has(dName)) {
        deptGroup.set(dName, {
          department: dName,
          projectCount: 0,
          totalProgress: 0,
          budget: 0,
          actual: 0,
          revenue: 0,
          atRiskOrDelayedCount: 0,
          openTasksCount: 0,
          overdueTasksCount: 0
        });
      }
      const dg = deptGroup.get(dName)!;
      dg.projectCount++;
      dg.totalProgress += progress;
      dg.budget += pBudget;
      dg.actual += pActual;
      dg.revenue += pRevenue;
      if (isRiskOrDelayed) dg.atRiskOrDelayedCount++;
      dg.openTasksCount += pOpenTasks.length;
      dg.overdueTasksCount += pOverdueTasks;

      // 2. Vertical Aggregation
      if (!vertGroup.has(vName)) {
        vertGroup.set(vName, {
          vertical: vName,
          projectCount: 0,
          budget: 0,
          actual: 0,
          revenue: 0
        });
      }
      const vg = vertGroup.get(vName)!;
      vg.projectCount++;
      vg.budget += pBudget;
      vg.actual += pActual;
      vg.revenue += pRevenue;

      // 3. Gantt Timeline entry
      ganttTimeline.push({
        _id: proj._id,
        name: proj.name,
        departmentName: dName,
        verticalName: vName,
        startDate: proj.startDate || proj.createdAt,
        expectedEndDate: proj.expectedEndDate || (proj.startDate ? new Date(new Date(proj.startDate).getTime() + 90*24*60*60*1000) : new Date(Date.now() + 90*24*60*60*1000)),
        progress,
        status: proj.status,
        health: derivedHealth,
        milestones: pMilestones.map(m => ({
          _id: m._id,
          title: m.title,
          dueDate: m.dueDate,
          status: m.status
        }))
      });
    });

    // Format Department Comparison Table
    const departmentComparison = Array.from(deptGroup.values()).map(d => {
      const avgProgress = d.projectCount > 0 ? Math.round(d.totalProgress / d.projectCount) : 0;
      const fcfVal = (d.revenue > 0 ? d.revenue : d.budget) - d.actual;
      const varPct = d.budget > 0 ? Math.round(((d.actual - d.budget) / d.budget) * 1000) / 10 : 0;
      const marginPct = d.revenue > 0 
        ? Math.round(((d.revenue - d.actual) / d.revenue) * 1000) / 10
        : (d.budget > 0 ? Math.round(((d.budget - d.actual) / d.budget) * 1000) / 10 : 0);

      return {
        department: d.department,
        projects: d.projectCount,
        avgProgress,
        budget: d.budget,
        actual: d.actual,
        variancePct: varPct,
        fcf: fcfVal,
        avgMarginPct: marginPct,
        atRiskOrDelayed: d.atRiskOrDelayedCount,
        openTasksCount: d.openTasksCount,
        overdueTasksCount: d.overdueTasksCount
      };
    });

    // Format Vertical Comparison Table
    const verticalComparison = Array.from(vertGroup.values()).map(v => {
      const fcfVal = (v.revenue > 0 ? v.revenue : v.budget) - v.actual;
      const pendingInflows = Math.max((v.revenue > 0 ? v.revenue : v.budget) - v.actual, 0);
      const marginPct = v.revenue > 0 
        ? Math.round(((v.revenue - v.actual) / v.revenue) * 1000) / 10
        : (v.budget > 0 ? Math.round(((v.budget - v.actual) / v.budget) * 1000) / 10 : 0);

      return {
        vertical: v.vertical,
        projects: v.projectCount,
        budget: v.budget,
        actual: v.actual,
        fcf: fcfVal,
        pendingInflows,
        avgMarginPct: marginPct
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalProjects,
          activeProjects,
          completedProjects,
          delayedProjects,
          onTrackCount,
          atRiskCount,
          delayedCount,
          totalBudget,
          actualCost,
          realizedRevenue,
          portfolioFCF: fcf,
          avgNetMargin: margin,
          openTasksCount: openTasks.length,
          overdueTasksCount,
          blockedTasksCount,
          totalBomsCount: totalBoms,
          deliveredBomsCount: deliveredBoms,
          pendingBomsCount: pendingBoms,
          overdueBomsCount: overdueBoms,
          totalOpenRisks: risks.length,
          totalOpenIssues: issues.length
        },
        projectMatrix,
        upcomingMilestones,
        ganttTimeline,
        departmentComparison,
        verticalComparison
      }
    });

  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};
