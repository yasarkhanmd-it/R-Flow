import { HttpInterceptorFn, HttpResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, mergeMap, materialize, dematerialize } from 'rxjs/operators';

// Helper function to generate a random ID
function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

// Ensure local storage is initialized with base data
function initLocalStorage() {
  if (!localStorage.getItem('mock_users')) {
    const users = [
      { id: '1', employeeName: 'Admin User', employeeId: 'ADM-001', email: 'admin@motherson.com', role: 'Admin', department: 'IT', status: 'Approved' },
      { id: '2', employeeName: 'Demo User', employeeId: 'EMP-001', email: 'demo@motherson.com', role: 'User', department: 'Software', status: 'Approved' }
    ];
    localStorage.setItem('mock_users', JSON.stringify(users));
  }
  
  if (!localStorage.getItem('mock_projects')) {
    const projects = [
      { _id: 'p1', name: 'ERP Migration', projectCode: 'ERP01', status: 'In Progress', departmentIds: ['d1'] }
    ];
    localStorage.setItem('mock_projects', JSON.stringify(projects));
  }

  if (!localStorage.getItem('mock_tasks')) {
    localStorage.setItem('mock_tasks', JSON.stringify([]));
  }

  if (!localStorage.getItem('mock_departments')) {
    const depts = [
      { _id: 'd1', name: 'Software', code: 'SW' },
      { _id: 'd2', name: 'HR', code: 'HR' },
      { _id: 'd3', name: 'IT', code: 'IT' }
    ];
    localStorage.setItem('mock_departments', JSON.stringify(depts));
  }
}

initLocalStorage();

export const mockBackendInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  
  return of(null).pipe(
    mergeMap(() => {
      
      const url = req.url;
      const method = req.method;
      
      const success = (body: any) => {
        return of(new HttpResponse({ status: 200, body: body }));
      };
      const error = (message: string, status = 400) => {
        return throwError(() => ({ status, error: { message } }));
      };

      // AUTH - LOGIN
      if (url.endsWith('/api/auth/login') && method === 'POST') {
        const { email, password } = req.body;
        if (email === 'admin@motherson.com' && password === 'Password123') {
          return success({
            success: true,
            data: {
              token: 'mock-jwt-token-admin',
              user: JSON.parse(localStorage.getItem('mock_users')!)[0]
            }
          });
        }
        return error('Invalid email or password', 401);
      }

      // PROJECTS - GET ALL
      if (url.includes('/api/projects') && method === 'GET' && !url.includes('/api/projects/')) {
        const projects = JSON.parse(localStorage.getItem('mock_projects') || '[]');
        return success({ success: true, data: { projects } });
      }

      // PROJECTS - CREATE
      if (url.includes('/api/projects') && method === 'POST') {
        const projects = JSON.parse(localStorage.getItem('mock_projects') || '[]');
        const newProject = { _id: generateId(), ...req.body, status: req.body.status || 'To Do' };
        projects.push(newProject);
        localStorage.setItem('mock_projects', JSON.stringify(projects));
        return success({ success: true, data: { project: newProject } });
      }
      
      // PROJECTS - UPDATE
      if (url.match(/\/api\/projects\/[a-zA-Z0-9]+$/) && method === 'PUT') {
        const id = url.split('/').pop();
        const projects = JSON.parse(localStorage.getItem('mock_projects') || '[]');
        const index = projects.findIndex((p: any) => p._id === id);
        if (index > -1) {
          projects[index] = { ...projects[index], ...req.body };
          localStorage.setItem('mock_projects', JSON.stringify(projects));
          return success({ success: true, data: { project: projects[index] } });
        }
        return error('Project not found', 404);
      }

      // PROJECTS - DELETE
      if (url.match(/\/api\/projects\/[a-zA-Z0-9]+$/) && method === 'DELETE') {
        const id = url.split('/').pop();
        let projects = JSON.parse(localStorage.getItem('mock_projects') || '[]');
        projects = projects.filter((p: any) => p._id !== id);
        localStorage.setItem('mock_projects', JSON.stringify(projects));
        return success({ success: true, message: 'Deleted' });
      }

      // TASKS - GET ALL
      if (url.includes('/api/tasks') && method === 'GET' && !url.includes('/api/tasks/')) {
        const tasks = JSON.parse(localStorage.getItem('mock_tasks') || '[]');
        return success({ success: true, data: { tasks } });
      }

      // TASKS - CREATE
      if (url.includes('/api/tasks') && method === 'POST') {
        const tasks = JSON.parse(localStorage.getItem('mock_tasks') || '[]');
        const newTask = { _id: generateId(), ...req.body, status: req.body.status || 'To Do' };
        tasks.push(newTask);
        localStorage.setItem('mock_tasks', JSON.stringify(tasks));
        return success({ success: true, data: { task: newTask } });
      }

      // TASKS - UPDATE
      if (url.match(/\/api\/tasks\/[a-zA-Z0-9]+$/) && method === 'PUT') {
        const id = url.split('/').pop();
        const tasks = JSON.parse(localStorage.getItem('mock_tasks') || '[]');
        const index = tasks.findIndex((t: any) => t._id === id);
        if (index > -1) {
          tasks[index] = { ...tasks[index], ...req.body };
          localStorage.setItem('mock_tasks', JSON.stringify(tasks));
          return success({ success: true, data: { task: tasks[index] } });
        }
        return error('Task not found', 404);
      }

      // TASKS - DELETE
      if (url.match(/\/api\/tasks\/[a-zA-Z0-9]+$/) && method === 'DELETE') {
        const id = url.split('/').pop();
        let tasks = JSON.parse(localStorage.getItem('mock_tasks') || '[]');
        tasks = tasks.filter((t: any) => t._id !== id);
        localStorage.setItem('mock_tasks', JSON.stringify(tasks));
        return success({ success: true, message: 'Deleted' });
      }

      // DEPARTMENTS - GET ALL
      if (url.includes('/api/departments') && method === 'GET') {
        const departments = JSON.parse(localStorage.getItem('mock_departments') || '[]');
        return success({ success: true, data: { departments } });
      }

      // USERS - GET ALL
      if (url.includes('/api/users') && method === 'GET') {
        const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
        return success({ success: true, data: users });
      }

      // FALLBACK FOR OTHER ROUTES to prevent app from breaking
      if (url.includes('/api/')) {
        console.warn('Mock Backend Interceptor: Unhandled route ' + method + ' ' + url);
        return success({ success: true, data: [], message: 'Mock fallback' });
      }

      // Pass through all non-API requests (like loading HTML/CSS/JS)
      return next(req);
    }),
    materialize(),
    delay(500),
    dematerialize()
  );
};
