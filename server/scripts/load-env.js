#!/usr/bin/env node

/**
 * Load environment variables from .env, environment-specific files, and .env.secrets
 * This script is used to ensure all environment variables are loaded before operations
 */

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Determine the environment (default to development)
const NODE_ENV = process.env.NODE_ENV || 'development';

// Load base .env file first
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✅ Loaded .env');
}

// Load environment-specific file based on NODE_ENV
let envSpecificFile;
if (NODE_ENV === 'production') {
  envSpecificFile = '.env.production';
} else if (NODE_ENV === 'development' || NODE_ENV === 'local') {
  envSpecificFile = '.env.local';
} else if (NODE_ENV === 'test') {
  envSpecificFile = '.env.test';
}

if (envSpecificFile) {
  const envSpecificPath = path.resolve(process.cwd(), envSpecificFile);
  if (fs.existsSync(envSpecificPath)) {
    dotenv.config({ path: envSpecificPath });
    console.log(`✅ Loaded ${envSpecificFile}`);
  } else {
    console.warn(`⚠️  ${envSpecificFile} not found`);
  }
}

// Environment-specific files now contain all configuration including secrets
// No separate .env.secrets file needed

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