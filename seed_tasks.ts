import mongoose, { Types } from 'mongoose';

async function run() {
  await mongoose.connect('mongodb://localhost:27017/rflow');
  const db = mongoose.connection.db;

  const projects = await db.collection('projects').find().toArray();
  console.log(`Found ${projects.length} projects.`);

  let totalTasksInserted = 0;

  for (const project of projects) {
    // Check if tasks already exist for this project
    const existingTasksCount = await db.collection('tasks').countDocuments({ projectId: project._id });
    if (existingTasksCount > 0) {
      console.log(`Project ${project.projectCode} already has ${existingTasksCount} tasks. Skipping.`);
      continue;
    }

    const tasksToInsert = [];
    let pStart = new Date(project.startDate).getTime();
    let pEnd = new Date(project.expectedEndDate).getTime();
    
    // Safety check if dates are invalid
    if (isNaN(pStart) || isNaN(pEnd)) {
      console.log(`Project ${project.projectCode} has invalid dates. Skipping.`);
      continue;
    }
    
    // Ensure end date is after start date
    if (pEnd < pStart) {
      pEnd = pStart + (1000 * 60 * 60 * 24 * 30); // Add 30 days if invalid
    }
    if (pStart === pEnd) {
      pEnd = pStart + (1000 * 60 * 60 * 24 * 7); // Add 7 days if they are same
    }

    const duration = pEnd - pStart;
    const taskCount = 4;
    const taskDuration = Math.floor(duration / taskCount);

    const taskSummaries = [
      'Requirement Analysis & Planning',
      'Design & Architecture',
      'Implementation & Development',
      'Testing & QA'
    ];

    for (let i = 0; i < taskCount; i++) {
      const taskStart = new Date(pStart + (i * taskDuration));
      const taskEnd = new Date(pStart + ((i + 1) * taskDuration) - (1000 * 60 * 60 * 24)); // minus 1 day to not overlap
      
      const departmentId = project.departmentIds && project.departmentIds.length > 0 ? project.departmentIds[0] : null;

      let status = 'To Do';
      const now = new Date().getTime();
      
      if (now > taskEnd.getTime()) {
        status = 'Done';
      } else if (now >= taskStart.getTime() && now <= taskEnd.getTime()) {
        status = 'In Progress';
      }
      
      // Give some variation to priority
      const priorities = ['Low', 'Medium', 'High', 'Critical'];
      const priority = priorities[i % priorities.length];

      tasksToInsert.push({
        _id: new Types.ObjectId(),
        projectId: project._id,
        departmentId: departmentId,
        taskId: `${project.projectCode}-T${i + 1}`,
        summary: `${taskSummaries[i]} for ${project.name}`,
        description: `Execute ${taskSummaries[i].toLowerCase()} phase for project ${project.projectCode}.`,
        type: 'Task',
        priority: priority,
        status: status,
        estimatedHours: 40,
        actualHours: status === 'Done' ? 40 : (status === 'In Progress' ? 20 : 0),
        reporterId: project.managerId || new Types.ObjectId(),
        assigneeId: project.managerId || new Types.ObjectId(),
        startDate: taskStart,
        dueDate: taskEnd,
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      });
    }

    if (tasksToInsert.length > 0) {
      await db.collection('tasks').insertMany(tasksToInsert);
      console.log(`Inserted ${tasksToInsert.length} tasks for project ${project.projectCode}.`);
      totalTasksInserted += tasksToInsert.length;
    }
  }

  console.log(`Total tasks inserted: ${totalTasksInserted}`);
  await mongoose.disconnect();
}

run().catch(console.error);
