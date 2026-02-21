export const LOG_LEVELS = {
  SILENT: 0,
  THREAT: 1,
  DEBUG: 2
};

const DEFAULT_LEVEL_MAP = {
  silent: LOG_LEVELS.SILENT,
  threat: LOG_LEVELS.THREAT,
  debug: LOG_LEVELS.DEBUG
};

export function createLogger({ mode = 'threat' } = {}) {
  const level = DEFAULT_LEVEL_MAP[mode] ?? LOG_LEVELS.THREAT;

  return {
    debug(...args) {
      if (level >= LOG_LEVELS.DEBUG) {
        console.log(...args);
      }
    },

    threat(...args) {
      if (level >= LOG_LEVELS.THREAT) {
        console.log(...args);
      }
    }
  };
}

/* -------------------------- v1 ----------------------------
export const LOG_LEVELS = {
    SILENT: 0,
    THREAT: 1,
    DEBUG: 2
};

export function createLogger(level = LOG_LEVELS.THREAT) {
    return {
        debug(...args) {
            if (level >= LOG_LEVELS.DEBUG) {
                console.log(...args);
            }
        },

        threat(...args) {
            if (level >= LOG_LEVELS.THREAT) {
                console.log(...args);
            }
        }
    };
}

*-------------------------- v2 ---------------------------- */