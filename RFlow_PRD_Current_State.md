# Product Requirements Document (PRD) - RFlow Current State

## 1. Document Control
**Product Name:** RFlow (ROBIS Project Management System)
**Document Type:** Product Requirements Document (Current State)
**Scope:** Strictly reflects the *actual implemented state* of the RFlow application codebase.

## 2. Executive Summary
RFlow (ROBIS Project Management System) is an enterprise project and task management application designed to handle organizational hierarchies, project assignments, and granular task tracking. The current system employs a microservices backend architecture paired with an Angular frontend. It supports role-based access control, departmental structuring under verticals, and a comprehensive project-to-task lifecycle.

## 3. Product Overview
RFlow serves as an internal system for managing organizational units, projects, and employees.
**A. CURRENTLY IMPLEMENTED:**
- User authentication, JWT sessions, and role-based access.
- Hierarchical organizational management (Verticals → Departments).
- Project management including Module/Story creation and Task tracking.
- Role-specific access (Super Admin, Administrator, Manager, Team Lead, Employee).
- Basic Dashboard and reporting metrics computed on the frontend.

**B. PARTIALLY IMPLEMENTED / IN PROGRESS:**
- Notifications (Services exist, but comprehensive trigger logic across all modules is still maturing).
- Workflow management (`workflowStageId` exists in the Task schema, but the broader dynamic workflow stage builder seems deprecated/partially used in favor of strict Vertical→Department hierarchy).

**C. PLANNED / FUTURE REQUIREMENTS:**
- ERP/EMPRO integrations (BOM, Material tracking, Purchase Orders).
- Comprehensive dynamic reporting from the backend.

## 4. Organizational Structure
The current hierarchical model implemented in the database and UI is:

**UNIT HEAD / SUPER ADMIN** -> **ADMINISTRATOR** -> **VERTICAL** -> **DEPARTMENT** -> **MANAGER** -> **TEAM LEAD** -> **EMPLOYEE / USER** -> **PROJECT** -> **MODULE / STORY** -> **TASK**

* **Vertical:** The highest organizational group (e.g., Automation).
* **Department:** A subunit within a Vertical. Multiple Departments can exist under one Vertical. The same Department name can theoretically exist across different Verticals, as uniqueness is enforced via a compound index on `[verticalId, departmentCode]`.
* **Managers:** Assigned at the Department level (supports an array of `managerIds`).
* **Projects:** Associated with Verticals and Departments, assigned to a specific Manager and Lead, with a defined set of team members (Users).

## 5. User Roles and Access Control
Implemented Roles (from `userModel.ts`):
* `Super Admin` (Boolean flag, often acts as Unit Head)
* `Administrator`
* `Manager`
* `Lead` (Team Lead)
* `User` (Employee)

**Role-Permission Matrix (Current Implementation):**

| Feature | Super Admin / Admin | Manager | Lead | User / Employee |
|---------|---------------------|---------|------|-----------------|
| View Verticals | Yes | Yes (Assigned) | No | No |
| Manage Verticals/Depts | Yes | No | No | No |
| Manage Users | Yes | No | No | No |
| Create Project | Yes | Yes | No | No |
| View Assigned Projects | Yes | Yes | Yes | Yes |
| Manage Modules/Stories | Yes | Yes | Yes | No |
| Create/Manage Tasks | Yes | Yes | Yes | Yes (Own) |

## 6. Authentication
The application handles authentication via the `auth-service` and `gateway-service`.
* **Flow:** Registration -> Login -> JWT generation.
* **Storage:** JWT is utilized for securing API endpoints.
* **Password:** Password hashing is implemented.
* **Reset:** Forgot password functionality uses OTP (`resetOtp`, `resetOtpExpiry`, `otpAttempts` fields exist in the User model). 

## 7. Vertical Management
**Current Implementation:**
* **Create/Edit/Delete Vertical:** Administrators can manage Verticals.
* **Fields:** Name, Description, Status (Active/Inactive).
* **UI Flow:** Listed in a dedicated `/verticals` route. Clicking a Vertical reveals its associated Departments.

## 8. Department Management
**Current Implementation:**
* **Create/Edit/Delete Department:** Departments are created within the context of a Vertical.
* **Fields:** Department Name, Department Code (unique per vertical), Description, Status.
* **Manager Assignment:** Managers are selected via a multi-select dropdown (array of `managerIds`). This is fully functional and replaces an older, buggy checkbox implementation.
* **Visibility:** Tied to the selected Vertical in the UI.

## 9. User Management
**Current Implementation:**
* **Fields:** Employee Name, ID, Email, Phone, Role, Status, `verticalId`, `departmentId`.
* **Assignment Flow:** Users are assigned to a Vertical, which filters the available Departments for that user. 
* **UI:** A dedicated `/users` route allows Administrators to manage registrations, approve/suspend users, and update their role/departmental mapping.

## 10. Project Management
**Current Implementation:**
* **Create/Edit/Delete Project:** Projects belong to Verticals/Departments.
* **Fields:** Name, Description, `managerId`, `leadId`, `members` array, Status, Dates.
* **Assignment:** Managers are required. Leads and specific Employees (members) are assigned to the project to grant them access.
* **Status:** Assigned, Pending Acceptance, Accepted, Rejected, Active, Completed, On Hold, Cancelled.
* **Hierarchy:** Project -> Module (Epic) -> Task.

## 11. Module / Story Management
**Current Implementation:**
* **Terminology:** The codebase refers to this layer primarily as `Module` (via `moduleModel.ts` and `ModuleDetailsComponent`), though the UI routes handle `/stories/:moduleId`.
* **Fields:** Name, Description, Status, `projectId`.
* **Purpose:** Acts as a grouping mechanism (Epic/Story) for individual tasks.

## 12. Task Management
**Current Implementation:**
* **Create/Edit/Delete Task:** Fully implemented within the `task-service`.
* **Fields:** Summary, Description, Type (Story, Task, Bug, Epic, Sub-task), Priority (Critical, High, Medium, Low), Status (To Do, In Progress, Blocked, Completed, Pending Review, Done), Estimated Hours, Assignee, Reporter, Due Dates.
* **Relationships:** Bound to a `projectId` and optionally a `moduleId` and `departmentId`.

## 13. Workflow / Process Management
**Current State:**
* The codebase contains a `workflowStageId` reference in the `Task` model.
* However, the overarching custom Workflow builder (Department -> Workflow -> Stages) appears to be largely deprecated or incomplete in favor of the rigid Vertical -> Department structure. Task statuses (To Do, In Progress, etc.) currently drive the primary lifecycle.

## 14. Dashboards and Status
**Current Implementation:**
* The Dashboard (`/dashboard`) aggregates data based on the logged-in user's role.
* Frontend calculates statistics (Total projects, tasks, status distribution, overdue tasks) by fetching the user's accessible projects and tasks.

## 15. Notifications
**Current Implementation:**
* A standalone `notification-service` exists with a `notificationModel.ts`.
* Used to alert users of task assignments, project access requests, and status changes.

## 16. Profile and Settings
**Current Implementation:**
* Managed via the Auth Service. Users can view their profile and perform password resets. Broad "Application Settings" are minimal and mostly UI-driven.

## 17. Reports
**Current Implementation:**
* A Reports module exists (`/reports`), but it currently aggregates data *on the frontend* by fetching all accessible projects/tasks and calculating arrays (Status distribution, Priority, Project Progress, Employee stats).
* **Limitations:** Not a heavy backend-driven reporting engine. Export functionality is limited/UI-only.

## 18. API Architecture
**Microservices Backend (Node.js/Express):**
* `gateway-service`: API Gateway routing requests to underlying services.
* `auth-service`: User identity, authentication, OTP, JWT.
* `project-service`: Manages Verticals, Departments, Projects, Modules.
* `task-service`: Manages Tasks, activity logs, comments, attachments.
* `story-service`: Contains redundant/overlapping models with `project-service` for Modules.
* `dashboard-service` & `report-service`: Aggregate metrics.
* `notification-service`: System alerts.

## 19. Database Architecture (MongoDB)
**Core Collections & Relationships:**
* `Users` (Refs: Vertical, Department)
* `Verticals` (Has many Departments)
* `Departments` (Ref: Vertical, Refs: Users as managers)
* `Projects` (Refs: Vertical, Department, User as Manager/Lead/Members)
* `Modules` (Ref: Project)
* `Tasks` (Refs: Project, Module, Department, User as Assignee/Reporter)

## 20. Current Business Flow (Actual Implementation)
1. **Admin** logs in -> Creates a **Vertical**.
2. **Admin** creates a **Department** under that Vertical -> Assigns a **Manager** from a multi-select dropdown.
3. **Admin** assigns **Users (Employees/Leads)** to the Vertical & Department.
4. **Manager (or Admin)** creates a **Project** -> Assigns a **Lead** and **Members**.
5. **Manager/Lead** creates a **Module (Story)** within the Project.
6. **Users/Leads** create **Tasks** under the Module, assign them to members, and move them across statuses (To Do -> In Progress -> Done).

## 21. Production / ROBIS Future Flow (Future / Proposed Business Scope)
* **Future Scope:** Expanding RFlow to handle physical production lifecycles.
* **Proposed Flow:** Business Requirement -> Design -> BOM -> Purchase -> RFQ -> Quotation -> PO -> Supplier -> Stores -> Material Inspection -> Material Issue -> Shopfloor/Project -> Production.
* **Note:** This is *not* currently implemented in the codebase.

## 22. EMPRO / ERP Integration
**EMPRO integration is currently not implemented.**
* **Future Scope:** Connecting RFlow to existing EMPRO/ERP systems to fetch BOMs, Material Data, Supplier catalogs, RFQs, Purchase Orders, and live Inventory tracking.

## 23. Non-Functional Requirements
* **Architecture:** Microservices pattern requires Docker/orchestration for deployment.
* **Security:** JWT-based authentication is implemented.
* **Maintainability:** Angular frontend uses modular feature/core/shared directories. Backend separates concerns per service.

## 24. Current Limitations & Known Gaps
* **Reports:** The reporting engine is heavily frontend-dependent, pulling raw data to calculate metrics. This will not scale well with massive datasets.
* **Workflows:** Remnants of a dynamic workflow engine (`workflowStageId`) exist alongside hardcoded statuses, causing potential structural ambiguity.
* **Service Overlap:** Both `project-service` and `story-service` contain `moduleModel.ts`, indicating a potential architectural overlap or incomplete migration.

## 25. Current Development Status

| Module | Status | Notes |
|--------|--------|-------|
| Authentication | Completed | JWT, OTP implemented |
| Vertical & Depts | Completed | Fully functional hierarchical setup |
| Projects & Modules | Completed | Full CRUD and assignments |
| Tasks | Completed | Lifecycle, comments, assignments working |
| Notifications | In Progress | Service exists, triggers maturing |
| Dashboards | Partially Implemented | Frontend calculations |
| Reports | Partially Implemented | Lacks backend aggregation/export |
| Workflows | Partially Implemented | Hardcoded statuses favored over dynamic |
| EMPRO/ERP | Not Implemented | Future scope |

## 26. Requirements Traceability
* **Hierarchical Organization** -> `Verticals/Departments` Frontend -> `project-service` -> `Vertical/Department` Collections.
* **Granular Tracking** -> `Tasks/Projects` Frontend -> `task-service`/`project-service` -> `Tasks/Projects` Collections.
* **Role Security** -> `Auth Guards` Frontend -> `auth-service` / `gateway-service` -> `Users` Collection (Roles).
