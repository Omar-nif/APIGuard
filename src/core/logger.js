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