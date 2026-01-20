import { createSignal } from "../signals/createSignal";

export function createPathFrequencyDetector({
    bus,
    threshold = 10,
    windowMs = 60_000 // 1 minuto
  }) {
    if (!bus) {
      throw new Error('pathFrequencyDetector requires a signal bus');
    }

    const paths = new Map();

    return function pathFrecuencyDetector(event) {
        if (!event || event.meta.ignored) return;

        const { path } = event.request;
        const now = Date.now();

        const record = paths.get(path);

        if (!record) {
            paths.set(path, {
                count: 1,
                firstSeen: now
            });
            return;
        }

        //si se sale de la ventana, reiniciamos
        if (now - record.firstSeen > windowMs) {
            path.set(path, {
                count: 1,
                firstSeen: now
            });
            return;
        }

        record.count += 1;

        if (record.count === threshold) {
            const signal = createSignal({
                type: 'path-frequency',
                category: 'path-probing',
                severity: 'medium',
                event,
                meta: {
                    path,
                    count: record.count,
                    windowMs
                }
            });
            bus.emit(signal);
        }
    };
}