export function createLogThreatAction({ bus, level = 'warn' }) {
    if (!bus) {
        throw new Error('logThreatAction requires a signal bus');
    }

    bus.on('signal', signal => {
        if (signal.type !== 'path-probing') return;

        const {
            source,
            severity,
            meta
        } = signal;

        const message = '[SECURITY} Path probing detected';

        const payload = {
            severity,
            source,
            reason: meta.reason,
            notFoundCount: meta.notFoundCount,
            repeatedPaths: meta.repeatedPaths,
            windowMs: meta.windowMs
        };

        if (typeof console[level] === 'function') {
            console[level](message,payload);
        } else {
            console.warn(message, payload);
        }
    });
}