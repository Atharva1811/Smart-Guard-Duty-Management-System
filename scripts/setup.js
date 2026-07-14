// scripts/setup.js
// Automated configuration helper for setting up wrangler.toml and environment variables

import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const envExamplePath = path.join(projectRoot, '.env.example');
const envPath = path.join(projectRoot, '.env');
const wranglerPath = path.join(projectRoot, 'wrangler.toml');

console.log('🤖 Starting Smart Guard Duty System automated setup...\n');

// 1. Copy .env.example to .env if not existing
if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env configuration file from .env.example template.');
  } else {
    console.error('❌ Error: .env.example not found in root directory.');
    process.exit(1);
  }
} else {
  console.log('ℹ️ Existing .env file detected.');
}

// 2. Parse .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let val = match[2] || '';
    // Remove wrapping quotes if any
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    envVars[key] = val.trim();
  }
});

// 3. Update wrangler.toml with .env parameters if populated
if (fs.existsSync(wranglerPath)) {
  let wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
  
  const dbName = envVars.D1_DATABASE_NAME || 'sgds';
  const dbId = envVars.D1_DATABASE_ID || 'PASTE_YOUR_DATABASE_ID';
  const workerName = envVars.WORKER_NAME || 'smart-guard-duty-system-api';

  // Replace wrangler settings dynamically
  wranglerContent = wranglerContent
    .replace(/^name\s*=\s*".*"/m, `name = "${workerName}"`)
    .replace(/database_name\s*=\s*".*"/m, `database_name = "${dbName}"`)
    .replace(/database_id\s*=\s*".*"/m, `database_id = "${dbId}"`);

  fs.writeFileSync(wranglerPath, wranglerContent, 'utf8');
  console.log('✅ Synchronized wrangler.toml configurations with .env parameters.');
}

console.log('\n--- Setup Phase Completed ---');
console.log('Checklist for manual cloud values to populate inside .env:');
console.log(`[${envVars.CLOUDFLARE_ACCOUNT_ID ? '✅' : '❌'}] CLOUDFLARE_ACCOUNT_ID`);
console.log(`[${envVars.CLOUDFLARE_API_TOKEN ? '✅' : '❌'}] CLOUDFLARE_API_TOKEN`);
console.log(`[${envVars.D1_DATABASE_ID ? '✅' : '❌'}] D1_DATABASE_ID`);
console.log(`[${envVars.GITHUB_REPOSITORY ? '✅' : '❌'}] GITHUB_REPOSITORY`);
console.log(`[${envVars.PAGES_PROJECT_NAME ? '✅' : '❌'}] PAGES_PROJECT_NAME`);
console.log('\nDeploy by running: npm run deploy\n');
