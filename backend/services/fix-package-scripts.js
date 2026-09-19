const fs = require('fs');
const path = require('path');
const dirs = fs.readdirSync('d:/rflow/backend/services');
dirs.forEach(dir => {
  const pjsonPath = path.join('d:/rflow/backend/services', dir, 'package.json');
  if (fs.existsSync(pjsonPath)) {
    const pjson = JSON.parse(fs.readFileSync(pjsonPath));
    pjson.scripts.start = `node dist/services/${dir}/src/server.js`;
    pjson.main = `dist/services/${dir}/src/server.js`;
    fs.writeFileSync(pjsonPath, JSON.stringify(pjson, null, 2));
    console.log('Updated ' + dir);
  }
});
