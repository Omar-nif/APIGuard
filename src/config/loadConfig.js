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
    const configCandidates = [
      path.resolve(process.cwd(), 'apiguard.config.json'),
      path.resolve(process.cwd(), 'examples', 'apiguard.config.json')
    ];

    for (const configPath of configCandidates) {
      if (!fs.existsSync(configPath)) continue;

      const raw = fs.readFileSync(configPath, 'utf-8');
      fileConfig = JSON.parse(raw);
      break;
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