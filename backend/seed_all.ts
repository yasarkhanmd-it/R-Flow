import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcryptjs';

async function run() {
  console.log('Connecting to database...');
  await mongoose.connect('mongodb://localhost:27017/rflow');
  const db = mongoose.connection.db;
  
  if (!db) {
      throw new Error("Failed to get db instance");
  }

  console.log('Clearing old demo data...');
  await db.collection('users').deleteMany({ email: { $regex: '@motherson.com$' } });

  console.log('Seeding Demo Users...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123', salt);

  const users = [
    { _id: new Types.ObjectId(), name: 'Admin User', email: 'admin@motherson.com', password: passwordHash, role: 'admin' },
    { _id: new Types.ObjectId(), name: 'Manager User', email: 'manager@motherson.com', password: passwordHash, role: 'manager' },
    { _id: new Types.ObjectId(), name: 'Dev User', email: 'dev@motherson.com', password: passwordHash, role: 'developer' }
  ];

  await db.collection('users').insertMany(users);
  console.log(`Inserted ${users.length} users.`);

  // Create Demo Department
  const department = { _id: new Types.ObjectId(), name: 'Engineering Demo Dept', code: 'ENG-DEMO' };
  await db.collection('departments').insertOne(department);

  // Create Demo Project
  const project = { 
    _id: new Types.ObjectId(), 
    name: 'Demo Launch Project', 
    projectCode: 'DLP',
    managerId: users[1]._id,
    departmentIds: [department._id],
    startDate: new Date(),
    expectedEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  };
  await db.collection('projects').insertOne(project);

  // Create Tasks using the logic from seed_tasks.ts conceptually
  const tasks = [
    { _id: new Types.ObjectId(), projectId: project._id, taskId: 'DLP-T1', summary: 'Setup Auth', status: 'Done', assigneeId: users[2]._id },
    { _id: new Types.ObjectId(), projectId: project._id, taskId: 'DLP-T2', summary: 'Build Frontend UI', status: 'In Progress', assigneeId: users[2]._id },
    { _id: new Types.ObjectId(), projectId: project._id, taskId: 'DLP-T3', summary: 'Deploy to Cloud', status: 'To Do', assigneeId: users[2]._id }
  ];
  await db.collection('tasks').insertMany(tasks);
  
  console.log('Seeding complete! You can now log in with admin@motherson.com / Password123.');

  await mongoose.disconnect();
}

run().catch(console.error);
