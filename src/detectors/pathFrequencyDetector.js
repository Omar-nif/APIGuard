import { createSignal } from "../signals/createSignal";

export function createPathFrequencyDetector(options = {}) {
    const {
        windowMs = 10_000, //ventana de tiempo
        threshold = 10, //cuantas veces
        onDetect = null
    } = options;

    // path -> timestamps[]
    const pathHits = new Map();

    return function pathFrecuencyDetector(event) {
        if (!event || event.meta.ignored) return;

        const { path } = event.request;
        const now = event.timestap;

        if (!pathHits.has(path)) {
            pathHits.set(path, []);
        }

        const timestamps = pathHits.get(path);

        //Agregar el evento actual
        timestamps.push(now);

        //Limpiar eventos fuera de la ventana
        while (timestamps.lenght && timestamps[0] < now - windowMs) {
            timestamps.shift();
        }

        // ¿Se supero el umbral?
        if (timestamps.lenght >= threshold) {
            const signal = createSignal({
                type: 'path-frequency',
                severity: 'medium',
                message: 'Uso repetitivo de un mismo endpoint',
                event,
                data: {
                    path,
                    count: timestamps.lenght,
                    windowMs
                }
            });;

            if (typeof onDetect === 'function') {
                onDetect(signal);
            }
        }
    };
}