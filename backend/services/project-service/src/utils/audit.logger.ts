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
  log: (token: string, options: AuditLogOptions) => {
    try {
      const data = JSON.stringify(options);
      
      const req = http.request({
        hostname: 'localhost',
        port: 5005,
        path: '/api/notifications/audit',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'Authorization': token
        }
      });

      req.on('error', (e) => {
        console.error(`Audit log failed: ${e.message}`);
      });

      req.write(data);
      req.end();
    } catch (error) {
      console.error('Audit Logger setup failed:', error);
    }
  }
};
