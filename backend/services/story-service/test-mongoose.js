const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true }
});

const UserSchema = new mongoose.Schema({
  employeeName: { type: String, required: true }
});

const Module = mongoose.models.Module || mongoose.model('Module', ModuleSchema);
const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function test() {
  await mongoose.connect('mongodb://localhost:27017/rflow');
  console.log('Connected');
  try {
    const modules = await Module.find({}).populate('projectId', 'name').populate('createdBy', 'employeeName').lean();
    console.log(JSON.stringify(modules, null, 2));
  } catch (err) {
    console.error('ERROR:', err);
  }
  process.exit(0);
}
test();
