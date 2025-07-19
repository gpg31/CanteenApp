const { execSync } = require('child_process');
const path = require('path');

console.log('Starting frontend server...');
try {
  const frontendPath = path.join(__dirname);
  console.log(`Frontend path: ${frontendPath}`);
  execSync('npm run dev', { 
    cwd: frontendPath,
    stdio: 'inherit'
  });
} catch (error) {
  console.error('Error starting frontend server:', error);
}
