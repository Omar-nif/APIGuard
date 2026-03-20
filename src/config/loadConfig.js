import fs from 'fs';
import path from 'path';
import { defaultConfig } from './defaultConfig.js';

function deepMerge(target, source) {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === 'object' &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else {
      result[key] = sourceValue;
    }
  }

  return result;
}

export function loadConfig(userConfig = {}) {
  let fileConfig = {};

  try {
    const configPath = path.resolve(process.cwd(), 'apiguard.config.json');

    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      fileConfig = JSON.parse(raw);

      console.log('APIGuard: Config loaded from apiguard.config.json');
    }
  } catch (err) {
    console.warn('APIGuard: Failed to load config file, using defaults');
  }

  // Orden de prioridad:
  // defaultConfig < fileConfig < userConfig
  const mergedWithFile = deepMerge(defaultConfig, fileConfig);
  const finalConfig = deepMerge(mergedWithFile, userConfig);

  return finalConfig;
}