const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb://127.0.0.1:27017/rflow';

const collectionsToClear = [
  'users',
  'verticals',
  'departments',
  'projects',
  'projectdepartments',
  'modules',
  'tasks',
  'workflows',
  'workflowstages',
  'comments',
  'attachments',
  'notifications',
  'activitylogs',
  'auditlogs'
];

async function runSeed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    const db = mongoose.connection.db;

    // 1. Clear Collections
    for (const name of collectionsToClear) {
      try {
        await db.collection(name).deleteMany({});
        console.log(`Cleared ${name}`);
      } catch (err) {
        // collection might not exist
      }
    }
    console.log('--- DATABASE CLEARED ---');

    // 2. Hash password
    const hashedPassword = await bcrypt.hash('123', 10);

    // 3. Create Users
    const usersCollection = db.collection('users');
    const now = new Date();

    const unitHead = {
      _id: new mongoose.Types.ObjectId(),
      employeeName: 'Mohammed Yasar Khan',
      employeeId: 'EMP-001',
      email: 'mohammed.yasarkhan@motherson.com',
      department: 'Unit Head',
      password: hashedPassword,
      role: 'Administrator',
      superAdmin: true,
      status: 'Approved',
      createdAt: now,
      updatedAt: now
    };

    const manager = {
      _id: new mongoose.Types.ObjectId(),
      employeeName: 'Manager',
      employeeId: 'EMP-002',
      email: 'manager@motherson.com',
      department: 'Management',
      password: hashedPassword,
      role: 'Manager',
      superAdmin: false,
      status: 'Approved',
      createdAt: now,
      updatedAt: now
    };

    const teamLead = {
      _id: new mongoose.Types.ObjectId(),
      employeeName: 'Team Lead',
      employeeId: 'EMP-003',
      email: 'teamlead@motherson.com',
      department: 'Unassigned',
      password: hashedPassword,
      role: 'Lead',
      superAdmin: false,
      status: 'Approved',
      createdAt: now,
      updatedAt: now
    };

    const user = {
      _id: new mongoose.Types.ObjectId(),
      employeeName: 'User',
      employeeId: 'EMP-004',
      email: 'user@motherson.com',
      department: 'Unassigned',
      password: hashedPassword,
      role: 'User',
      superAdmin: false,
      status: 'Approved',
      createdAt: now,
      updatedAt: now
    };

    await usersCollection.insertMany([unitHead, manager, teamLead, user]);
    console.log('Created 4 users.');

    // 4. Create Verticals
    const verticalsCollection = db.collection('verticals');
    const designVerticalId = new mongoose.Types.ObjectId();
    const remanVerticalId = new mongoose.Types.ObjectId();

    await verticalsCollection.insertMany([
      {
        _id: designVerticalId,
        name: 'Design Engineering',
        description: 'Design Engineering Vertical',
        status: 'Active',
        createdAt: now,
        updatedAt: now
      },
      {
        _id: remanVerticalId,
        name: 'Remanufacturing',
        description: 'Remanufacturing Vertical',
        status: 'Active',
        createdAt: now,
        updatedAt: now
      }
    ]);
    console.log('Created 2 verticals.');

    // 5. Create Departments
    const departmentsCollection = db.collection('departments');
    
    const designDepts = ['Design', 'Software', 'Controls', 'Mechanical', 'Stores', 'SCM (Supply Chain Management)', 'Purchase'];
    const remanDepts = ['Retro', 'IOT'];

    const deptsToInsert = [];

    designDepts.forEach((name, i) => {
      deptsToInsert.push({
        _id: new mongoose.Types.ObjectId(),
        departmentName: name,
        departmentCode: `DE-${i+1}`,
        description: `${name} department`,
        verticalId: designVerticalId,
        managerIds: [manager._id], // Assign manager
        status: 'Active',
        createdAt: now,
        updatedAt: now
      });
    });

    remanDepts.forEach((name, i) => {
      deptsToInsert.push({
        _id: new mongoose.Types.ObjectId(),
        departmentName: name,
        departmentCode: `RE-${i+1}`,
        description: `${name} department`,
        verticalId: remanVerticalId,
        managerIds: [manager._id], // Assign manager
        status: 'Active',
        createdAt: now,
        updatedAt: now
      });
    });

    await departmentsCollection.insertMany(deptsToInsert);
    console.log(`Created ${deptsToInsert.length} departments.`);

    console.log('--- SEEDING COMPLETE ---');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
    await mongoose.disconnect();
  }
}

runSeed();
