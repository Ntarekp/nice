const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const services = [
  'api-gateway',
  'services/user-service',
  'services/equipment-service',
  'services/inspection-service',
  'services/report-service',
  'services/notification-service',
  'frontend'
];

console.log('\n\x1b[35m══ Installing dependencies for all services ══\x1b[0m\n');
services.forEach(svc => {
  const svcPath = path.join(__dirname, '..', svc);
  if (fs.existsSync(path.join(svcPath, 'package.json'))) {
    console.log('\x1b[36m  ► ' + svc + '\x1b[0m');
    execSync('npm install', { cwd: svcPath, stdio: 'inherit' });
    console.log('\x1b[32m  ✔ Done\x1b[0m\n');
  }
});
console.log('\x1b[32m\n✔ All dependencies installed!\x1b[0m\n');