const fs = require('fs');
const path = require('path');
const files = [
  'project-service/src/controllers/bom.controller.ts',
  'project-service/src/controllers/bomRevision.controller.ts',
  'project-service/src/controllers/changeRequest.controller.ts',
  'project-service/src/controllers/department.controller.ts',
  'project-service/src/controllers/issue.controller.ts',
  'project-service/src/controllers/milestone.controller.ts',
  'project-service/src/controllers/project.controller.ts',
  'project-service/src/controllers/resource.controller.ts',
  'project-service/src/controllers/risk.controller.ts',
  'project-service/src/controllers/transaction.controller.ts',
  'project-service/src/controllers/vertical.controller.ts',
  'task-service/src/controllers/task.controller.ts',
  'story-service/src/controllers/module.controller.ts'
];
files.forEach(f => {
  const fp = path.join('d:/rflow/backend/services', f);
  if (fs.existsSync(fp)) {
    let c = fs.readFileSync(fp, 'utf8');
    c = c.replace(/import \{ auditLogger \} from '..\/..\/..\/common\/utils\/audit.logger';/g, "import { auditLogger } from '../utils/audit.logger';");
    fs.writeFileSync(fp, c);
  }
});
