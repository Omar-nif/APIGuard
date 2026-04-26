#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ====== Helpers ======
const log = (msg) => console.log(`\x1b[32m[APIGuard]\x1b[0m ${msg}`); 
const error = (msg) => console.error(`\x1b[31m[APIGuard Error]\x1b[0m ${msg}`);

// ====== CLI ======
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'init':
    init();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    if (command) error(`Unknown command: ${command}`);
    showHelp();
}

function init() {
  const targetPath = path.resolve(process.cwd(), 'apiguard.config.json');
  const isForce = args.includes('--force');

  if (fs.existsSync(targetPath) && !isForce) {
    error('apiguard.config.json already exists.');
    console.log('   Use \x1b[33m--force\x1b[0m to overwrite the existing configuration.');
    return;
  }

  const defaultConfigPath = path.resolve(__dirname, '../src/config/defaultConfig.json');

  if (!fs.existsSync(defaultConfigPath)) {
    error('Internal Error: default configuration template not found.');
    process.exit(1);
  }

  try {
    const rawConfig = fs.readFileSync(defaultConfigPath, 'utf-8');
    
    const configObj = JSON.parse(rawConfig);
    const formattedConfig = JSON.stringify(configObj, null, 2);

    fs.writeFileSync(targetPath, formattedConfig);

    log('apiguard.config.json created successfully!');
    
    console.log(`
\x1b[1mNext steps:\x1b[0m

1. Import APIGuard in your app:
   \x1b[36mimport { apiguard } from 'apiguard';\x1b[0m

2. Initialize and use as middleware:
   \x1b[36mconst guard = apiguard();\x1b[0m
   \x1b[36mapp.use(guard);\x1b[0m

3. Customize your settings in \x1b[33mapiguard.config.json\x1b[0m

Happy hacking!
`);
  } catch (err) {
    error(`Failed to create configuration: ${err.message}`);
  }
}

function showHelp() {
  console.log(`
\x1b[1mAPIGuard CLI\x1b[0m

Usage:
  apiguard <command> [options]

Commands:
  \x1b[32minit\x1b[0m         Create a default apiguard.config.json in the current directory

Options:
  \x1b[33m--force\x1b[0m      Overwrite existing configuration file
  \x1b[33m--help\x1b[0m       Show this help message
`);
}