#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ====== Helpers ======

function log(msg) {
  console.log(`APIGuard: ${msg}`);
}

function error(msg) {
  console.error(`APIGuard: ${msg}`);
}

// ====== CLI ======

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'init':
    init();
    break;

  default:
    showHelp();
}

// ====== Commands ======

function init() {
  const targetPath = path.resolve(process.cwd(), 'apiguard.config.json');

  // 1. Verificar si ya existe
  if (fs.existsSync(targetPath)) {
    error('apiguard.config.json already exists.');
    log('Use --force to overwrite.');
    
    if (!args.includes('--force')) return;
  }

  // 2. Leer config default
  const defaultConfigPath = path.resolve(
    __dirname,
    '../src/config/defaultConfig.json'
  );

  if (!fs.existsSync(defaultConfigPath)) {
    error('Default config not found. Something is wrong.');
    process.exit(1);
  }

  const configContent = fs.readFileSync(defaultConfigPath, 'utf-8');

  // 3. Escribir archivo
  fs.writeFileSync(targetPath, configContent);

  log('apiguard.config.json created successfully');

  // 4. Extra UX
  console.log(`
Next steps:

1. Import APIGuard in your app:

   import apiguard from 'apiguard';

2. Use it as middleware:

   app.use(apiguard());

3. Customize your config in apiguard.config.json

Happy hacking
`);
}

function showHelp() {
  console.log(`
APIGuard CLI

Usage:
  apiguard init        Create default configuration file

Options:
  --force              Overwrite existing config file
`);
}