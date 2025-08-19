#!/usr/bin/env node

/**
 * Load environment variables from .env and .env.secrets
 * This script is used to ensure secrets are loaded before Prisma operations
 */

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load .env file
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✅ Loaded .env');
}

// Load .env.secrets file
const secretsPath = path.resolve(process.cwd(), '.env.secrets');
if (fs.existsSync(secretsPath)) {
  dotenv.config({ path: secretsPath });
  console.log('✅ Loaded .env.secrets');
} else {
  console.warn('⚠️  .env.secrets not found');
}

// Execute the command passed as argument
const { spawn } = require('child_process');
const args = process.argv.slice(2);

if (args.length > 0) {
  const child = spawn(args[0], args.slice(1), {
    stdio: 'inherit',
    shell: true,
    env: process.env
  });

  child.on('exit', (code) => {
    process.exit(code);
  });
}