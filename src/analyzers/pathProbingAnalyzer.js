import { createSignal } from "../signals/createSignal";

export function createPathProbingAnalyzer({
    bus,
    windowMs = 60_000,
    minNotFound = 5
}) {
    if (!bus) {
        throw new Error('pathProbingAnalyzer requieres a signal bus');
    }

    const source = new Map();

    bus.on('signal', signal => {
        if (
            signal.type !== 'not-found' &&
            signal.type !== 'path-frequency'
        ) {
            return;
        }

        const source = signal.source?.ip || 'unknown';
        const now = Date.now();

        let record = source.get(source);

        if (!record) {
            record = {
                notFoundCount: 0,
                repeatedPaths: new Set(),
                firstSeen: now,
                alerted: false
            };
            source.set(source, record);
        }

        // Reset ventana
        if (now - record.firstSeen > windowMs) {
            record.notFoundCount = 0;
            record.repeatedPaths.clear();
            record.firstSeen = now;
            record.alerted = false;
        }

        if (signal.type === 'not-found') {
            record.notFoundCount += 1;
        }

        if (signal.type === 'path-frequency') {
            record.repeatedPaths.add(signal.meta.path);
        }

        // Regla de decision

        if (
            !record.alerted &&
            record.notFoundCount >= minNotFound &&
            record.repeatedPaths.size >= 1
        ) {
            record.alerted = true;

            const threat = createSignal({
                type: 'path-probing',
                category: 'threat',
                severity: 'high',
                source: signal.source,
                meta: {
                    reason: 'Multiple 404s with repeated path acces',
                    notFoundCount: record.notFoundCount,
                    repeatedPaths: Array.from(record.repeatedPaths),
                    windowMs
                }
            });
            bus.emit(threat);
        }
    });
}