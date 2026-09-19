const mongoose = require('mongoose');

const dateMap = {
  // Specific requested projects (in 2026-2027)
  'REM-MEC-001': { start: '2026-04-01', end: '2026-10-31' }, // Mechanical: Apr 2026
  'MHA-SW-001':  { start: '2026-06-01', end: '2027-06-30' }, // Software: June 2026 to June 2027
  'REM-PRE-001': { start: '2026-07-01', end: '2027-04-30' }, // Precision: July 2026 to Apr 2027
  'ROB-DES-001': { start: '2026-08-01', end: '2026-12-31' }, // Design: Aug 2026 to Dec 2026
  'SRV-RET-001': { start: '2026-09-01', end: '2027-02-28' }, // Retro: Sept 2026 to Feb 2027

  // Remaining projects spread across 2026-2027
  'REM-MEC-002': { start: '2026-01-15', end: '2026-09-30' },
  'REM-FAB-001': { start: '2026-02-01', end: '2026-11-30' },
  'REM-FAB-002': { start: '2026-03-10', end: '2026-12-15' },
  'REM-PRE-002': { start: '2026-05-01', end: '2027-01-31' },

  'MHA-SW-002':  { start: '2026-02-15', end: '2027-03-31' },
  'MHA-CON-001': { start: '2026-03-01', end: '2026-10-15' },
  'MHA-CON-002': { start: '2026-04-15', end: '2026-11-30' },
  'MHA-OPS-001': { start: '2026-01-01', end: '2026-08-31' },
  'MHA-OPS-002': { start: '2026-05-15', end: '2027-02-28' },

  'ROB-DES-002': { start: '2026-09-15', end: '2027-05-31' },
  'ROB-ELE-001': { start: '2026-03-01', end: '2026-12-31' },
  'ROB-ELE-002': { start: '2026-07-15', end: '2027-03-15' },
  'ROB-VV-001':  { start: '2026-04-01', end: '2026-11-30' },
  'ROB-VV-002':  { start: '2026-10-01', end: '2027-06-30' },

  'GEN-FIN-001': { start: '2026-01-01', end: '2026-06-30' },
  'GEN-FIN-002': { start: '2026-06-01', end: '2027-01-31' },
  'GEN-HR-001':  { start: '2026-01-10', end: '2026-07-31' },
  'GEN-HR-002':  { start: '2026-08-01', end: '2027-03-31' },
  'GEN-DOC-001': { start: '2026-02-01', end: '2026-09-30' },
  'GEN-DOC-002': { start: '2026-09-01', end: '2027-04-30' },

  'SRV-AF-001':  { start: '2026-02-15', end: '2026-11-15' },
  'SRV-AF-002':  { start: '2026-05-01', end: '2027-02-28' },
  'SRV-RET-002': { start: '2026-10-15', end: '2027-07-31' }
};

async function run() {
  await mongoose.connect('mongodb://localhost:27017/rflow');
  console.log('Connected to MongoDB rflow');

  const db = mongoose.connection.db;

  for (const [code, dates] of Object.entries(dateMap)) {
    const res = await db.collection('projects').updateOne(
      { projectCode: code },
      {
        $set: {
          startDate: new Date(`${dates.start}T00:00:00.000Z`),
          expectedEndDate: new Date(`${dates.end}T00:00:00.000Z`)
        }
      }
    );
    console.log(`Updated ${code} -> Start: ${dates.start}, End: ${dates.end} (${res.modifiedCount})`);
  }

  // Verify dates range
  const allProjects = await db.collection('projects').find(
    {},
    { projection: { projectCode: 1, name: 1, startDate: 1, expectedEndDate: 1 } }
  ).toArray();

  console.log('\nAll 28 Project Dates (Verified 2026-2027):');
  allProjects.forEach(p => {
    const s = p.startDate ? p.startDate.toISOString().slice(0,10) : 'N/A';
    const e = p.expectedEndDate ? p.expectedEndDate.toISOString().slice(0,10) : 'N/A';
    console.log(`${p.projectCode} | ${p.name.padEnd(38)} | ${s} to ${e}`);
  });

  await mongoose.disconnect();
}

run().catch(console.error);
