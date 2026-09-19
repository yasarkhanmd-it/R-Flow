const fs = require('fs');
const path = require('path');
const files = [
  'project-service/src/utils/audit.logger.ts',
  'task-service/src/utils/audit.logger.ts',
  'story-service/src/utils/audit.logger.ts',
  '../common/utils/audit.logger.ts'
];
files.forEach(f => {
  const fp = path.join('d:/rflow/backend/services', f);
  if (fs.existsSync(fp)) {
    let c = fs.readFileSync(fp, 'utf8');
    c = c.replace(/entityId: string;/g, 'entityId: string | any;');
    c = c.replace(/import axios from 'axios';/g, "import * as http from 'http';");
    fs.writeFileSync(fp, c);
  }
});
