const fs = require('fs');
const file = 'd:/rflow/frontend/src/app/features/projects/project-board/project-board.component.html';
let data = fs.readFileSync(file, 'utf8');
data = data.replace(/<app-project-procurement.*$/gm, '').trim();
data += '\n<app-project-procurement *ngIf="activeTab === \'Procurement\'" [projectId]="projectId"></app-project-procurement>\n';
fs.writeFileSync(file, data);
console.log('Fixed');
