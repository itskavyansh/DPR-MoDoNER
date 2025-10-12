#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting DPR Quality Assessment System in Development Mode...\n');

// Start backend server
console.log('📡 Starting Backend API Server...');
const backend = spawn('npm', ['run', 'start:simple', '--workspace=@dpr-system/backend'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

// Wait a moment for backend to start, then start frontend
setTimeout(() => {
  console.log('🌐 Starting Frontend Development Server...');
  const frontend = spawn('npm', ['run', 'dev', '--workspace=@dpr-system/frontend'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down all services...');
    backend.kill();
    frontend.kill();
    process.exit(0);
  });
}, 2000);

console.log(`
🎯 Development servers starting...

Services will be available at:
- Frontend (Development): http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

Demo Credentials:
- Email: admin@mdoner.gov.in
- Password: admin123

Press Ctrl+C to stop all services.
`);