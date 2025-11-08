#!/usr/bin/env node

/**
 * Build Script for Production Deployment
 * This script builds the frontend and prepares the app for deployment
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const log = (message, type = 'info') => {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m'
  };
  const reset = '\x1b[0m';
  console.log(`${colors[type]}${message}${reset}`);
};

const run = (command, cwd = __dirname) => {
  log(`Running: ${command}`, 'info');
  try {
    execSync(command, { cwd, stdio: 'inherit' });
    return true;
  } catch (error) {
    log(`Error executing command: ${command}`, 'error');
    return false;
  }
};

const main = async () => {
  log('='.repeat(60), 'info');
  log('🚀 BHAROSA KYC - Production Build Script', 'info');
  log('='.repeat(60), 'info');
  
  // Step 1: Install backend dependencies
  log('\n📦 Step 1: Installing backend dependencies...', 'info');
  if (!run('npm install', path.join(__dirname, 'backend'))) {
    log('❌ Failed to install backend dependencies', 'error');
    process.exit(1);
  }
  log('✅ Backend dependencies installed', 'success');
  
  // Step 2: Install frontend dependencies
  log('\n📦 Step 2: Installing frontend dependencies...', 'info');
  if (!run('npm install', path.join(__dirname, 'frontend'))) {
    log('❌ Failed to install frontend dependencies', 'error');
    process.exit(1);
  }
  log('✅ Frontend dependencies installed', 'success');
  
  // Step 3: Create production .env for frontend
  log('\n⚙️  Step 3: Setting up frontend environment...', 'info');
  const frontendEnvPath = path.join(__dirname, 'frontend', '.env.production');
  const frontendEnvExamplePath = path.join(__dirname, 'frontend', '.env.production.example');
  
  if (!fs.existsSync(frontendEnvPath) && fs.existsSync(frontendEnvExamplePath)) {
    fs.copyFileSync(frontendEnvExamplePath, frontendEnvPath);
    log('✅ Created .env.production for frontend', 'success');
  } else if (fs.existsSync(frontendEnvPath)) {
    log('⚠️  .env.production already exists, skipping', 'warning');
  }
  
  // Step 4: Build React frontend
  log('\n🔨 Step 4: Building React frontend...', 'info');
  log('This may take a few minutes...', 'info');
  if (!run('npm run build', path.join(__dirname, 'frontend'))) {
    log('❌ Failed to build frontend', 'error');
    process.exit(1);
  }
  log('✅ Frontend build completed', 'success');
  
  // Step 5: Verify build directory
  log('\n🔍 Step 5: Verifying build...', 'info');
  const buildPath = path.join(__dirname, 'frontend', 'build');
  if (fs.existsSync(buildPath)) {
    const buildFiles = fs.readdirSync(buildPath);
    log(`✅ Build directory exists with ${buildFiles.length} items`, 'success');
    
    const indexPath = path.join(buildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      log('✅ index.html found in build', 'success');
    } else {
      log('❌ index.html not found in build', 'error');
      process.exit(1);
    }
  } else {
    log('❌ Build directory not found', 'error');
    process.exit(1);
  }
  
  // Success
  log('\n' + '='.repeat(60), 'success');
  log('🎉 Production build completed successfully!', 'success');
  log('='.repeat(60), 'success');
  log('\n📝 Next steps:', 'info');
  log('1. Set up your MongoDB database (MongoDB Atlas recommended)', 'info');
  log('2. Configure environment variables on Render', 'info');
  log('3. Deploy using render.yaml or manual setup', 'info');
  log('4. Test your deployment at the Render URL\n', 'info');
};

main().catch(error => {
  log(`\n❌ Build failed: ${error.message}`, 'error');
  process.exit(1);
});
