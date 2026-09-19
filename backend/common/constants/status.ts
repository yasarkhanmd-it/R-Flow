export enum ProjectStatus {
  ASSIGNED = 'Assigned',
  ACTIVE = 'Active',
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
  COMPLETED = 'Completed',
  ON_HOLD = 'On Hold'
}

export enum ModuleStatus {
  PENDING_APPROVAL = 'Pending Approval',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed'
}

export enum TaskStatus {
  TO_DO = 'To Do',
  IN_PROGRESS = 'In Progress',
  BLOCKED = 'Blocked',
  COMPLETED = 'Completed',
  PENDING_REVIEW = 'Pending Review',
  DONE = 'Done'
}

export enum UserStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}
