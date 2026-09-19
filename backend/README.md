# RFlow Backend Microservices Architecture

ROBIS Project Management System (RFlow) backend refactored into a scalable, high-performance Microservices Architecture.

---

## 🏛️ Microservices Topology

| Service | Port | Description |
|---|---|---|
| **gateway-service** | 5000 | Single entry point reverse-proxy handling auth forwarding, CORS & routing |
| **auth-service** | 5001 | User authentication, registration, profiles, roles, and department logic |
| **project-service** | 5002 | Project lifecycle, team lead assignments, join requests & memberships |
| **story-service** | 5003 | Story / Module management, approval workflows & progress tracking |
| **task-service** | 5004 | Enterprise Task table logic, comments, attachments & activity tracking |
| **notification-service** | 5005 | In-App notifications, join request approvals & overdue alerts |
| **dashboard-service** | 5006 | Real-time analytics, workload aggregation & role-based statistics |
| **report-service** | 5007 | Report generation and data exports |
| **common** | Shared | Shared source-code library (types, middleware, auth & constants) |

---

## 🚀 Running with Docker Compose

Start the entire microservices cluster including MongoDB in a single command:

```bash
cd backend
docker-compose up --build
```

---

## 🛠️ Local Development (Running Individual Services)

Each microservice is fully independent with its own `package.json`, `.env`, and `tsconfig.json`.

```bash
# Start Gateway
cd gateway-service
npm run dev

# Start Auth Service
cd auth-service
npm run dev

# Start Project Service
cd project-service
npm run dev

# Start Story Service
cd story-service
npm run dev

# Start Task Service
cd task-service
npm run dev

# Start Notification Service
cd notification-service
npm run dev

# Start Dashboard Service
cd dashboard-service
npm run dev

# Start Report Service
cd report-service
npm run dev
```

---

## 🔒 API Endpoints Overview

All requests continue to use the primary gateway port `5000` (`http://localhost:5000`):

- **Auth**: `/api/auth/register`, `/api/auth/login`, `/api/auth/profile`, `/api/users`, `/api/departments`
- **Projects**: `/api/projects`, `/api/projects/:id`, `/api/projects/:id/accept`, `/api/projects/:id/request`
- **Stories**: `/api/projects/:projectId/modules`, `/api/modules`, `/api/modules/:id/approve`
- **Tasks**: `/api/tasks`, `/api/comments`, `/api/attachments`, `/api/activities`
- **Notifications**: `/api/notifications`, `/api/notifications/:id/approve`
- **Dashboard**: `/api/dashboard`
