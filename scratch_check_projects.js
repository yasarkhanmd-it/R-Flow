const mongoose = require('mongoose');

async function checkProjects() {
  await mongoose.connect('mongodb://localhost:27017/rflow_projects');
  
  const ProjectSchema = new mongoose.Schema({
    name: String,
    startDate: Date,
    expectedEndDate: Date,
    departmentIds: [mongoose.Schema.Types.ObjectId],
    verticalId: mongoose.Schema.Types.ObjectId,
    health: String,
    status: String
  }, { strict: false });

  const Project = mongoose.model('Project', ProjectSchema);
  const projects = await Project.find().lean();
  
  console.log(`Found ${projects.length} projects`);
  projects.forEach(p => {
    console.log(`- ${p.name}: start=${p.startDate}, end=${p.expectedEndDate}, health=${p.health}, status=${p.status}, verticalId=${p.verticalId}, depts=${JSON.stringify(p.departmentIds)}`);
  });

  await mongoose.disconnect();
}

checkProjects().catch(console.error);
