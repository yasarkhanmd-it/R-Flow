import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../models/userModel';


// Initial Database Seed (runs once on fresh DB)

export const seedDatabase = async () => {
  try {
    console.log('--- CHECKING DATABASE SEED STATUS ---');
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error('Database connection is not established.');
    }

    const existingSuperAdmin = await User.findOne({ email: 'Mohammed.yasarkhan@motherson.com' });
    if (existingSuperAdmin) {
      console.log('--- DEVELOPMENT DATABASE ALREADY SEEDED, SKIPPING RESET ---');
      return;
    }

    // 1. COMPLETE DATABASE CLEANUP
    console.log('Clearing all application collections...');
    const collections = await db.collections();
    for (const collection of collections) {
      if (collection.collectionName.startsWith('system.')) continue;
      await collection.deleteMany({});
      console.log(`- Cleared collection: ${collection.collectionName}`);
    }
    console.log('Database cleanup completed.');

    // 2. CREATE INITIAL SUPER ADMIN
    const hashedPassword = await bcrypt.hash('123', 10);

    const superAdmin = await User.create({
      employeeName: 'Mohammed Yasar Khan',
      employeeId: 'SA-001',
      email: 'Mohammed.yasarkhan@motherson.com',
      department: 'Super Admin / Organization Level',
      phone: '',
      password: hashedPassword,
      role: 'Manager',
      superAdmin: true,
      status: 'Approved'
    });
    console.log(`Seeded Super Admin: ${superAdmin.email}`);

    // 3. CREATE INITIAL MANAGER
    const manager = await User.create({
      employeeName: 'Bhuvnesh',
      employeeId: 'MGR-001',
      email: 'bhuvnesh@motherson.com',
      department: 'Unassigned',
      phone: '',
      password: hashedPassword,
      role: 'Manager',
      superAdmin: false,
      status: 'Approved'
    });
    console.log(`Seeded Manager: ${manager.email}`);

    // 4. CREATE INITIAL EMPLOYEE / USER
    const employee = await User.create({
      employeeName: 'Kaushik',
      employeeId: 'EMP-001',
      email: 'kaushik@motherson.com',
      department: 'Unassigned',
      phone: '',
      password: hashedPassword,
      role: 'User',
      superAdmin: false,
      status: 'Approved'
    });
    console.log(`Seeded Employee: ${employee.email}`);

    console.log('--- DEVELOPMENT DATABASE RESET COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Error during DB seeding:', err);
  }
};


// Ensure Administrator Account (runs every startup — idempotent)

export const ensureAdminAccount = async () => {
  try {
    const adminEmail = 'yasar@motherson.com';
    const existing = await User.findOne({ email: adminEmail });

    if (existing) {
      console.log(`Administrator account already exists: ${adminEmail}`);
      return;
    }

    const hashedPassword = await bcrypt.hash('123', 10);

    await User.create({
      employeeName: 'Yasar',
      employeeId: 'ADMIN-001',
      email: adminEmail,
      department: 'Administration',
      phone: '',
      password: hashedPassword,
      role: 'Administrator',
      superAdmin: false,
      status: 'Approved'
    });

    console.log(`Administrator account created: ${adminEmail}`);
  } catch (err) {
    console.error('Error ensuring Administrator account:', err);
  }
};
