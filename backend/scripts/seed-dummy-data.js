const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rflow';

async function seed() {
  console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB successfully.');

  const db = mongoose.connection.db;

  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);
  
  console.log('Clearing existing collections...');
  for (const name of collectionNames) {
    if (!name.startsWith('system.')) {
      await db.collection(name).deleteMany({});
    }
  }

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Verticals
  console.log('Seeding Verticals...');
  const verticalCols = db.collection('verticals');
  const v1 = new mongoose.Types.ObjectId();
  const v2 = new mongoose.Types.ObjectId();
  await verticalCols.insertMany([
    { _id: v1, name: 'Automotive Vision Systems', description: 'Advanced driver assistance and camera vision solutions', status: 'Active', createdAt: new Date(), updatedAt: new Date() },
    { _id: v2, name: 'Industrial Robotics', description: 'Robotic automation and shop-floor assembly systems', status: 'Active', createdAt: new Date(), updatedAt: new Date() }
  ]);

  // 2. Departments
  console.log('Seeding Departments...');
  const deptCols = db.collection('departments');
  const d1 = new mongoose.Types.ObjectId();
  const d2 = new mongoose.Types.ObjectId();
  const d3 = new mongoose.Types.ObjectId();
  const d4 = new mongoose.Types.ObjectId();
  await deptCols.insertMany([
    { _id: d1, departmentName: 'Software & AI', departmentCode: 'SAI', description: 'Embedded software, firmware & deep learning models', verticalId: v1, status: 'Active', createdAt: new Date(), updatedAt: new Date() },
    { _id: d2, departmentName: 'Mechanical Engineering', departmentCode: 'ME', description: 'CAD, structural simulation & thermal design', verticalId: v1, status: 'Active', createdAt: new Date(), updatedAt: new Date() },
    { _id: d3, departmentName: 'Quality Assurance', departmentCode: 'QA', description: 'Environmental, vibration & reliability testing', verticalId: v1, status: 'Active', createdAt: new Date(), updatedAt: new Date() },
    { _id: d4, departmentName: 'Supply Chain & Logistics', departmentCode: 'SCL', description: 'Component procurement & vendor operations', verticalId: v2, status: 'Active', createdAt: new Date(), updatedAt: new Date() }
  ]);

  // 3. Users
  console.log('Seeding Users...');
  const userCols = db.collection('users');
  const uAdmin = new mongoose.Types.ObjectId();
  const uManager1 = new mongoose.Types.ObjectId();
  const uManager2 = new mongoose.Types.ObjectId();
  const uLead1 = new mongoose.Types.ObjectId();
  const uUser1 = new mongoose.Types.ObjectId();
  const uUser2 = new mongoose.Types.ObjectId();

  await userCols.insertMany([
    { _id: uAdmin, employeeName: 'System Admin', employeeId: 'EMP001', email: 'admin@motherson.com', department: 'Software & AI', departmentId: d1, verticalId: v1, phone: '+91 9876543210', password: hashedPassword, role: 'Administrator', superAdmin: true, status: 'Approved', createdAt: new Date(), updatedAt: new Date() },
    { _id: uManager1, employeeName: 'Rahul Sharma', employeeId: 'EMP002', email: 'rahul.sharma@motherson.com', department: 'Software & AI', departmentId: d1, verticalId: v1, phone: '+91 9876543211', password: hashedPassword, role: 'Manager', superAdmin: false, status: 'Approved', createdAt: new Date(), updatedAt: new Date() },
    { _id: uManager2, employeeName: 'Priya Patel', employeeId: 'EMP003', email: 'priya.patel@motherson.com', department: 'Mechanical Engineering', departmentId: d2, verticalId: v1, phone: '+91 9876543212', password: hashedPassword, role: 'Manager', superAdmin: false, status: 'Approved', createdAt: new Date(), updatedAt: new Date() },
    { _id: uLead1, employeeName: 'Amit Verma', employeeId: 'EMP004', email: 'amit.verma@motherson.com', department: 'Software & AI', departmentId: d1, verticalId: v1, phone: '+91 9876543213', password: hashedPassword, role: 'Lead', superAdmin: false, status: 'Approved', createdAt: new Date(), updatedAt: new Date() },
    { _id: uUser1, employeeName: 'Neha Singh', employeeId: 'EMP005', email: 'neha.singh@motherson.com', department: 'Quality Assurance', departmentId: d3, verticalId: v1, phone: '+91 9876543214', password: hashedPassword, role: 'User', superAdmin: false, status: 'Approved', createdAt: new Date(), updatedAt: new Date() },
    { _id: uUser2, employeeName: 'Vikram Das', employeeId: 'EMP006', email: 'vikram.das@motherson.com', department: 'Supply Chain & Logistics', departmentId: d4, verticalId: v2, phone: '+91 9876543215', password: hashedPassword, role: 'User', superAdmin: false, status: 'Approved', createdAt: new Date(), updatedAt: new Date() }
  ]);

  // 4. Projects
  console.log('Seeding Projects...');
  const projCols = db.collection('projects');
  const p1 = new mongoose.Types.ObjectId();
  const p2 = new mongoose.Types.ObjectId();
  const p3 = new mongoose.Types.ObjectId();

  const now = new Date();
  const daysAgo = (d) => new Date(now.getTime() - d * 86400000);
  const daysAhead = (d) => new Date(now.getTime() + d * 86400000);

  await projCols.insertMany([
    {
      _id: p1,
      name: 'Smart Vision System Gen-3',
      description: 'Next-gen automotive stereoscopic camera unit with embedded edge AI',
      projectCode: 'PRJ-SVS-001',
      verticalId: v1,
      departmentIds: [d1, d2, d3],
      departmentId: d1,
      managerId: uManager1,
      leadId: uLead1,
      members: [uLead1, uUser1, uUser2],
      status: 'Active',
      health: 'On Track',
      startDate: daysAgo(60),
      assignedDate: daysAgo(65),
      expectedEndDate: daysAhead(120),
      budget: 1500000,
      createdAt: daysAgo(65),
      updatedAt: now
    },
    {
      _id: p2,
      name: 'Automated Robotic Arm v2',
      description: 'High-speed 6-axis precision assembly robotic manipulator',
      projectCode: 'PRJ-ARA-002',
      verticalId: v2,
      departmentIds: [d2, d4],
      departmentId: d2,
      managerId: uManager2,
      leadId: uLead1,
      members: [uManager1, uUser1],
      status: 'Active',
      health: 'At Risk',
      startDate: daysAgo(90),
      assignedDate: daysAgo(95),
      expectedEndDate: daysAhead(90),
      budget: 2800000,
      createdAt: daysAgo(95),
      updatedAt: now
    },
    {
      _id: p3,
      name: 'EV Battery Pack Assembly Line',
      description: 'Automated thermal management & testing rig for electric vehicle battery modules',
      projectCode: 'PRJ-EVP-003',
      verticalId: v1,
      departmentIds: [d1, d3, d4],
      departmentId: d3,
      managerId: uManager1,
      leadId: uManager2,
      members: [uUser1, uUser2],
      status: 'Completed',
      health: 'Completed',
      startDate: daysAgo(180),
      assignedDate: daysAgo(185),
      expectedEndDate: daysAgo(30),
      budget: 4200000,
      createdAt: daysAgo(185),
      updatedAt: daysAgo(30)
    }
  ]);

  // 5. Modules
  console.log('Seeding Modules...');
  const modCols = db.collection('modules');
  const m1 = new mongoose.Types.ObjectId();
  const m2 = new mongoose.Types.ObjectId();
  const m3 = new mongoose.Types.ObjectId();

  await modCols.insertMany([
    { _id: m1, projectId: p1, name: 'Hardware Design & Schematics', description: 'Dual-camera PCB layout, optics lens mount and CNC enclosure', status: 'Approved', createdBy: uLead1, createdAt: daysAgo(55), updatedAt: daysAgo(20) },
    { _id: m2, projectId: p1, name: 'AI Camera Firmware', description: 'TensorRT edge inference engine and video stream pipeline', status: 'In Progress', createdBy: uLead1, createdAt: daysAgo(50), updatedAt: now },
    { _id: m3, projectId: p1, name: 'Quality & Stress Testing', description: 'Thermal chamber testing, vibration analysis and IP67 rating', status: 'Pending Approval', createdBy: uUser1, createdAt: daysAgo(30), updatedAt: now }
  ]);

  // 6. Milestones
  console.log('Seeding Milestones...');
  const msCols = db.collection('milestones');
  await msCols.insertMany([
    { projectId: p1, name: 'Architecture & Requirements Review', description: 'Sign-off on optics hardware and compute specs', plannedStart: daysAgo(60), plannedEnd: daysAgo(45), actualEnd: daysAgo(42), ownerId: uLead1, status: 'Completed', progress: 100, createdBy: uManager1, createdAt: daysAgo(60), updatedAt: daysAgo(42) },
    { projectId: p1, name: 'Prototype Board Fabrication', description: 'First batch PCB assembly and power-on test', plannedStart: daysAgo(40), plannedEnd: daysAgo(10), actualEnd: daysAgo(8), ownerId: uLead1, status: 'Completed', progress: 100, createdBy: uManager1, createdAt: daysAgo(40), updatedAt: daysAgo(8) },
    { projectId: p1, name: 'AI Inference & Optics Calibration', description: 'Stereo depth camera algorithm optimization', plannedStart: daysAgo(15), plannedEnd: daysAhead(45), ownerId: uUser1, status: 'In Progress', progress: 55, createdBy: uManager1, createdAt: daysAgo(15), updatedAt: now },
    { projectId: p1, name: 'Final Production Validation', description: 'Full thermal, vibration and customer acceptance test', plannedStart: daysAhead(50), plannedEnd: daysAhead(110), ownerId: uUser2, status: 'Not Started', progress: 0, createdBy: uManager1, createdAt: now, updatedAt: now }
  ]);

  // 7. Tasks
  console.log('Seeding Tasks...');
  const taskCols = db.collection('tasks');
  await taskCols.insertMany([
    {
      projectId: p1,
      moduleId: m1,
      departmentId: d1,
      taskId: 'TSK-SVS-101',
      summary: 'Design high-resolution Dual-Camera PCB schematics',
      description: '6-layer rigid-flex PCB design supporting dual Sony 4K CMOS image sensors',
      type: 'Story',
      priority: 'Critical',
      status: 'Done',
      estimatedHours: 80,
      actualHours: 76,
      assigneeId: uLead1,
      reporterId: uManager1,
      startDate: daysAgo(55),
      dueDate: daysAgo(25),
      createdAt: daysAgo(55),
      updatedAt: daysAgo(25)
    },
    {
      projectId: p1,
      moduleId: m1,
      departmentId: d2,
      taskId: 'TSK-SVS-104',
      summary: 'Conduct IP67 enclosure water ingress test',
      description: 'Submerge sealed aluminum housing under 1m water for 30 minutes',
      type: 'Task',
      priority: 'Medium',
      status: 'To Do',
      estimatedHours: 24,
      actualHours: 0,
      assigneeId: uUser2,
      reporterId: uLead1,
      startDate: daysAhead(5),
      dueDate: daysAhead(25),
      createdAt: daysAgo(5),
      updatedAt: now
    },
    {
      projectId: p1,
      moduleId: m2,
      departmentId: d1,
      taskId: 'TSK-SVS-102',
      summary: 'Optimize edge AI model for low-latency detection',
      description: 'Quantize YOLOv8 model to FP16 format for 60FPS real-time processing',
      type: 'Task',
      priority: 'High',
      status: 'In Progress',
      estimatedHours: 60,
      actualHours: 35,
      assigneeId: uUser1,
      reporterId: uLead1,
      startDate: daysAgo(20),
      dueDate: daysAhead(15),
      createdAt: daysAgo(20),
      updatedAt: now
    },
    {
      projectId: p1,
      moduleId: m2,
      departmentId: d1,
      taskId: 'TSK-SVS-105',
      summary: 'Automated CI/CD build pipeline for firmware releases',
      description: 'Setup GitHub/Jenkins workflow for automated unit test & artifact storage',
      type: 'Task',
      priority: 'Low',
      status: 'Pending Review',
      estimatedHours: 30,
      actualHours: 28,
      assigneeId: uUser1,
      reporterId: uManager1,
      startDate: daysAgo(15),
      dueDate: daysAgo(2),
      createdAt: daysAgo(15),
      updatedAt: now
    },
    {
      projectId: p1,
      moduleId: m3,
      departmentId: d3,
      taskId: 'TSK-SVS-103',
      summary: 'Thermal stress testing harness setup',
      description: 'Instrument chamber sensors for continuous -40C to +85C cycling',
      type: 'Bug',
      priority: 'High',
      status: 'Blocked',
      estimatedHours: 40,
      actualHours: 12,
      assigneeId: uUser2,
      reporterId: uManager2,
      startDate: daysAgo(10),
      dueDate: daysAhead(10),
      createdAt: daysAgo(10),
      updatedAt: now
    }
  ]);

  // 8. Risks
  console.log('Seeding Risks...');
  const riskCols = db.collection('risks');
  await riskCols.insertMany([
    {
      projectId: p1,
      title: 'Sensor Chipset Lead Time Delay',
      description: 'Sony CMOS image sensor delivery lead time extended from 4 to 12 weeks',
      probability: 'High',
      impact: 'Critical',
      severity: 'Critical',
      status: 'Open',
      mitigationPlan: 'Secure backup supply allocation from distributor pre-stock',
      ownerId: uUser2,
      createdBy: uManager1,
      createdAt: daysAgo(40),
      updatedAt: now
    },
    {
      projectId: p1,
      title: 'Thermal Throttling under Max AI Workload',
      description: 'Enclosure temperature exceeding 75C during dual 4K inference',
      probability: 'Medium',
      impact: 'High',
      severity: 'High',
      status: 'Mitigated',
      mitigationPlan: 'Added internal thermal pad bridge directly to outer aluminum shell',
      ownerId: uLead1,
      createdBy: uLead1,
      createdAt: daysAgo(30),
      updatedAt: daysAgo(5)
    }
  ]);

  // 9. Issues
  console.log('Seeding Issues...');
  const issueCols = db.collection('issues');
  await issueCols.insertMany([
    {
      projectId: p1,
      issueId: 'ISS-1001',
      title: 'Firmware crash during cold boot at -20°C',
      description: 'Voltage regulator brownout on startup under low ambient temperature',
      priority: 'Critical',
      ownerId: uLead1,
      reportedById: uUser1,
      dueDate: daysAhead(5),
      status: 'In Progress',
      resolution: '',
      createdBy: uUser1,
      createdAt: daysAgo(8),
      updatedAt: now
    },
    {
      projectId: p1,
      issueId: 'ISS-1002',
      title: 'Lens holder screw loosening under 10G vibration',
      description: 'Fasteners backed out during 2-hour sinusoidal vibration sweep',
      priority: 'High',
      ownerId: uUser2,
      reportedById: uLead1,
      dueDate: daysAgo(1),
      status: 'Resolved',
      resolution: 'Applied Loctite 243 threadlocker to all M2 assembly screws',
      resolvedDate: daysAgo(2),
      createdBy: uLead1,
      createdAt: daysAgo(15),
      updatedAt: daysAgo(2)
    }
  ]);

  // 10. Resource Allocations
  console.log('Seeding Resource Allocations...');
  const resCols = db.collection('resourceallocations');
  await resCols.insertMany([
    { projectId: p1, userId: uLead1, departmentId: d1, projectRole: 'Lead Architect', allocationPercentage: 100, startDate: daysAgo(60), endDate: daysAhead(120), status: 'Active', createdAt: daysAgo(60), updatedAt: now },
    { projectId: p1, userId: uUser1, departmentId: d3, projectRole: 'AI & QA Engineer', allocationPercentage: 80, startDate: daysAgo(50), endDate: daysAhead(100), status: 'Active', createdAt: daysAgo(50), updatedAt: now },
    { projectId: p1, userId: uUser2, departmentId: d4, projectRole: 'Supply & Test Lead', allocationPercentage: 50, startDate: daysAgo(40), endDate: daysAhead(60), status: 'Active', createdAt: daysAgo(40), updatedAt: now }
  ]);

  // 11. Transactions
  console.log('Seeding Transactions...');
  const txCols = db.collection('transactions');
  await txCols.insertMany([
    { projectId: p1, description: 'Client Phase-1 Advance Funding', amount: 500000, type: 'Inflow', category: 'Client Billing', date: daysAgo(60), status: 'Completed', createdBy: uManager1, createdAt: daysAgo(60), updatedAt: daysAgo(60) },
    { projectId: p1, description: 'PCB Prototype Fabrication & Fast Sourcing', amount: 185000, type: 'Outflow', category: 'Procurement', date: daysAgo(45), status: 'Completed', createdBy: uManager1, createdAt: daysAgo(45), updatedAt: daysAgo(45) },
    { projectId: p1, description: 'Environmental Testing Chamber Rental', amount: 45000, type: 'Outflow', category: 'Testing', date: daysAgo(20), status: 'Completed', createdBy: uUser1, createdAt: daysAgo(20), updatedAt: daysAgo(20) },
    { projectId: p1, description: 'Phase-2 Milestone Completion Invoice', amount: 400000, type: 'Inflow', category: 'Milestone Billing', date: daysAhead(15), status: 'Planned', createdBy: uManager1, createdAt: now, updatedAt: now }
  ]);

  // 12. BOM, BOM Revisions & Items
  console.log('Seeding BOMs, Revisions & Items...');
  const bomCols = db.collection('boms');
  const revCols = db.collection('bomrevisions');
  const itemCols = db.collection('bomitems');

  const b1 = new mongoose.Types.ObjectId();
  const r1 = new mongoose.Types.ObjectId();

  await bomCols.insertOne({
    _id: b1,
    projectId: p1,
    bomNumber: 'BOM-SVS-001',
    name: 'Smart Vision Gen-3 Master Assembly',
    description: 'Complete bill of materials for dual-camera main board and enclosure',
    status: 'Released',
    currentRevisionId: r1,
    ownerId: uLead1,
    createdBy: uLead1,
    createdAt: daysAgo(50),
    updatedAt: daysAgo(10)
  });

  await revCols.insertOne({
    _id: r1,
    bomId: b1,
    revisionNumber: 'Rev A.1',
    description: 'Initial release with upgraded image sensor and thermal housing',
    changeReason: 'ECN-2026-08: Switched sensor vendor to reduce power consumption',
    status: 'Released',
    createdBy: uLead1,
    createdAt: daysAgo(50),
    updatedAt: daysAgo(10)
  });

  await itemCols.insertMany([
    { revisionId: r1, partNumber: 'SVS-CAM-01', description: '4K CMOS Image Sensor Module 60fps', quantity: 2, unit: 'pcs', category: 'Electronics', make: 'Sony', vendor: 'OptoTech Inc', unitCost: 125, totalCost: 250, deliveryStatus: 'Delivered', inspectionStatus: 'Passed', remarks: 'Passed high temp test', createdAt: daysAgo(45), updatedAt: daysAgo(10) },
    { revisionId: r1, partNumber: 'SVS-MCU-02', description: 'Dual-Core ARM Cortex-M7 Microcontroller', quantity: 1, unit: 'pcs', category: 'Semiconductors', make: 'STMicroelectronics', vendor: 'Arrow Electronics', unitCost: 45, totalCost: 45, deliveryStatus: 'Partially Delivered', inspectionStatus: 'Not Inspected', remarks: 'Batch 1 received', createdAt: daysAgo(45), updatedAt: daysAgo(5) },
    { revisionId: r1, partNumber: 'SVS-ENC-03', description: 'CNC Machined Anodized Aluminum Housing', quantity: 1, unit: 'pcs', category: 'Mechanical', make: 'Custom', vendor: 'Precision Metalworks', unitCost: 85, totalCost: 85, deliveryStatus: 'Ordered', inspectionStatus: 'Not Inspected', remarks: 'Delivery expected in 5 days', createdAt: daysAgo(40), updatedAt: daysAgo(2) }
  ]);

  // 13. Suppliers, Purchase Orders & Goods Receipts
  console.log('Seeding Suppliers & Procurement...');
  const suppCols = db.collection('suppliers');
  const poCols = db.collection('purchaseorders');
  const grnCols = db.collection('goodsreceipts');

  const s1 = new mongoose.Types.ObjectId();
  const s2 = new mongoose.Types.ObjectId();
  const po1 = new mongoose.Types.ObjectId();

  await suppCols.insertMany([
    { _id: s1, name: 'OptoTech Optics Inc', contactEmail: 'sales@optotech.com', contactPhone: '+1-555-0192', address: 'San Jose, CA, USA', status: 'Active', createdBy: uUser2, createdAt: daysAgo(60), updatedAt: daysAgo(60) },
    { _id: s2, name: 'Arrow Electronics Global', contactEmail: 'orders@arrow.com', contactPhone: '+1-555-0144', address: 'Denver, CO, USA', status: 'Active', createdBy: uUser2, createdAt: daysAgo(60), updatedAt: daysAgo(60) }
  ]);

  await poCols.insertOne({
    _id: po1,
    projectId: p1,
    poNumber: 'PO-2026-001',
    supplierId: s1,
    status: 'Issued',
    totalAmount: 295,
    issueDate: daysAgo(20),
    expectedDeliveryDate: daysAhead(10),
    items: [
      { partName: '4K CMOS Image Sensor Module', quantityOrdered: 2, unitPrice: 125 }
    ],
    createdBy: uUser2,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(20)
  });

  await grnCols.insertOne({
    projectId: p1,
    poId: po1,
    receiptNumber: 'GRN-2026-001',
    receiptDate: daysAgo(5),
    status: 'Confirmed',
    items: [
      { poItemId: po1, quantityReceived: 2, condition: 'Passed QA Inspection' }
    ],
    receivedBy: uUser2,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5)
  });

  console.log('\n========================================');
  console.log('SUCCESS: MongoDB Dummy Data Seeded Successfully!');
  console.log('========================================');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
