const mongoose = require('mongoose');

const updates = [
  { projectCode: 'REM-MEC-001', health: 'Completed', status: 'Completed', progress: 100 },
  { projectCode: 'REM-MEC-002', health: 'On Track', status: 'Active', progress: 65 },
  { projectCode: 'REM-FAB-001', health: 'At Risk', status: 'Active', progress: 45 },
  { projectCode: 'REM-FAB-002', health: 'On Track', status: 'Active', progress: 30 },
  { projectCode: 'REM-PRE-001', health: 'Delayed', status: 'Delayed', progress: 25 },
  { projectCode: 'REM-PRE-002', health: 'Completed', status: 'Completed', progress: 100 },
  
  { projectCode: 'MHA-SW-001', health: 'At Risk', status: 'Active', progress: 55 },
  { projectCode: 'MHA-SW-002', health: 'On Track', status: 'Active', progress: 70 },
  { projectCode: 'MHA-CON-001', health: 'Delayed', status: 'Delayed', progress: 35 },
  { projectCode: 'MHA-CON-002', health: 'On Track', status: 'Active', progress: 80 },
  { projectCode: 'MHA-OPS-001', health: 'Completed', status: 'Completed', progress: 100 },
  { projectCode: 'MHA-OPS-002', health: 'On Track', status: 'Active', progress: 40 },

  { projectCode: 'ROB-DES-001', health: 'Completed', status: 'Completed', progress: 100 },
  { projectCode: 'ROB-DES-002', health: 'At Risk', status: 'Active', progress: 60 },
  { projectCode: 'ROB-ELE-001', health: 'On Track', status: 'Active', progress: 50 },
  { projectCode: 'ROB-ELE-002', health: 'Delayed', status: 'Delayed', progress: 20 },
  { projectCode: 'ROB-VV-001', health: 'On Track', status: 'Active', progress: 75 },
  { projectCode: 'ROB-VV-002', health: 'At Risk', status: 'Active', progress: 35 },

  { projectCode: 'GEN-FIN-001', health: 'Completed', status: 'Completed', progress: 100 },
  { projectCode: 'GEN-FIN-002', health: 'On Track', status: 'Active', progress: 85 },
  { projectCode: 'GEN-HR-001', health: 'On Track', status: 'Active', progress: 90 },
  { projectCode: 'GEN-HR-002', health: 'At Risk', status: 'Active', progress: 40 },
  { projectCode: 'GEN-DOC-001', health: 'On Track', status: 'Active', progress: 60 },
  { projectCode: 'GEN-DOC-002', health: 'Delayed', status: 'Delayed', progress: 15 },

  { projectCode: 'SRV-AF-001', health: 'On Track', status: 'Active', progress: 70 },
  { projectCode: 'SRV-AF-002', health: 'On Track', status: 'Active', progress: 50 },
  { projectCode: 'SRV-RET-001', health: 'At Risk', status: 'Active', progress: 45 },
  { projectCode: 'SRV-RET-002', health: 'On Track', status: 'Active', progress: 30 }
];

async function run() {
  await mongoose.connect('mongodb://localhost:27017/rflow');
  console.log('Connected to MongoDB rflow');

  const db = mongoose.connection.db;

  for (const item of updates) {
    const res = await db.collection('projects').updateOne(
      { projectCode: item.projectCode },
      {
        $set: {
          health: item.health,
          status: item.status,
          progress: item.progress
        }
      }
    );
    console.log(`Updated ${item.projectCode} -> Health: ${item.health}, Status: ${item.status}, Progress: ${item.progress}% (${res.modifiedCount})`);
  }

  // Verify counts
  const allProjects = await db.collection('projects').find({}, { projection: { health: 1, status: 1 } }).toArray();
  const healthCounts = {};
  allProjects.forEach(p => {
    const h = p.health || 'On Track';
    healthCounts[h] = (healthCounts[h] || 0) + 1;
  });

  console.log('\nHealth Summary Across 28 Projects:');
  console.log(healthCounts);

  await mongoose.disconnect();
}

run().catch(console.error);
