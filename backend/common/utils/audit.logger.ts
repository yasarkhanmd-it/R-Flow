import * as http from 'http';

export interface AuditLogOptions {
  actorUserId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string | any;
  entityName: string;
  description: string;
  metadata?: any;
}

export const auditLogger = {
  log: async (token: string, options: AuditLogOptions) => {
    try {
      const auditApiUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5005/api/notifications';
      
      fetch(`${auditApiUrl}/audit`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(options)
      }).catch((err: any) => {
        console.error('Failed to log audit event async:', err.message);
      });
      
    } catch (error) {
      console.error('Audit Logger setup failed:', error);
    }
  }
};
