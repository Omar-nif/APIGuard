import { LOG_LEVELS } from '../core/logger.js';

export const defaultConfig = {
  logger: {
    // Nivel por defecto: solo amenazas
    mode: 'threat',

    // Mapeo interno (el usuario NO ve esto)
    _levelMap: {
      silent: LOG_LEVELS.SILENT,
      threat: LOG_LEVELS.THREAT,
      debug: LOG_LEVELS.DEBUG
    }
  },

  detectors: {
    pathProbing: {
      enabled: true,
      windowMs: 30_000,
      minSignals: 2
    }
  },

  security: {
    sensitivePaths: []
  }
};
