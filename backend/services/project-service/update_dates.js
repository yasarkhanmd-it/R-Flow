const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/rflow');
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;

  // 1. Mechanical project start date as Apr
  // REM-MEC-001 "AMR Mechanical Assembly"
  const mecRes = await db.collection('projects').updateOne(
    { projectCode: 'REM-MEC-001' },
    {
      $set: {
        startDate: new Date('2025-04-01T00:00:00.000Z'),
        expectedEndDate: new Date('2025-10-31T00:00:00.000Z')
      }
    }
  );
  console.log('Updated REM-MEC-001 (Mechanical) -> Start: Apr 2025:', mecRes.modifiedCount);

  // 2. Software project as June to June
  // MHA-SW-001 "Fleet Management System"
  const swRes = await db.collection('projects').updateOne(
    { projectCode: 'MHA-SW-001' },
    {
      $set: {
        startDate: new Date('2025-06-01T00:00:00.000Z'),
        expectedEndDate: new Date('2026-06-30T00:00:00.000Z')
      }
    }
  );
  console.log('Updated MHA-SW-001 (Software) -> June 2025 to June 2026:', swRes.modifiedCount);

  // 3. Precision project as July to Apr
  // REM-PRE-001 "Precision Component Manufacturing"
  const preRes = await db.collection('projects').updateOne(
    { projectCode: 'REM-PRE-001' },
    {
      $set: {
        startDate: new Date('2025-07-01T00:00:00.000Z'),
        expectedEndDate: new Date('2026-04-30T00:00:00.000Z')
      }
    }
  );
  console.log('Updated REM-PRE-001 (Precision) -> July 2025 to Apr 2026:', preRes.modifiedCount);

  // 4. Design project as Aug to Dec
  // ROB-DES-001 "AMR Chassis Design"
  const desRes = await db.collection('projects').updateOne(
    { projectCode: 'ROB-DES-001' },
    {
      $set: {
        startDate: new Date('2025-08-01T00:00:00.000Z'),
        expectedEndDate: new Date('2025-12-31T00:00:00.000Z')
      }
    }
  );
  console.log('Updated ROB-DES-001 (Design) -> Aug 2025 to Dec 2025:', desRes.modifiedCount);

  // 5. Retro project as Sept to Feb
  // SRV-RET-001 "Robot Retrofit Program"
  const retRes = await db.collection('projects').updateOne(
    { projectCode: 'SRV-RET-001' },
    {
      $set: {
        startDate: new Date('2025-09-01T00:00:00.000Z'),
        expectedEndDate: new Date('2026-02-28T00:00:00.000Z')
      }
    }
  );
  console.log('Updated SRV-RET-001 (Retro) -> Sept 2025 to Feb 2026:', retRes.modifiedCount);

  // Verify all 5 projects
  const updatedProjects = await db.collection('projects').find(
    { projectCode: { $in: ['REM-MEC-001', 'MHA-SW-001', 'REM-PRE-001', 'ROB-DES-001', 'SRV-RET-001'] } },
    { projection: { projectCode: 1, name: 1, departmentName: 1, startDate: 1, expectedEndDate: 1 } }
  ).toArray();

  console.log('\nVerified Updates:');
  updatedProjects.forEach(p => {
    console.log(`${p.projectCode} | ${p.name} | Dept: ${p.departmentName} | Start: ${p.startDate.toISOString()} | End: ${p.expectedEndDate.toISOString()}`);
  });

  await mongoose.disconnect();
}

run().catch(console.error);
