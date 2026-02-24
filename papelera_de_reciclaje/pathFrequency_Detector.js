import { createSignal } from '../signals/createSignal.js';

export function createPathFrequencyDetector(options = {}) {
  const {
    bus,
    threshold = 1,      // cuántas veces
    windowMs = 10_000    // en cuánto tiempo
  } = options;

  // Estado interno
  const hits = new Map();

  return function pathFrequencyDetector(event) {
    if (!event || event.meta.ignored) return;

    const { path, ip } = event.request;
    const now = Date.now();

    const key = `${ip}:${path}`;

    if (!hits.has(key)) {
      hits.set(key, []);
    }

    const timestamps = hits.get(key);

    // Agregamos el hit actual
    timestamps.push(now);

    // Limpiamos hits fuera de la ventana
    const cutoff = now - windowMs;
    while (timestamps.length && timestamps[0] < cutoff) {
      timestamps.shift();
    }

    // ¿Superó el umbral?
    if (timestamps.length >= threshold) {
      bus.emit(
        createSignal({
          type: 'path.frequency',
          level: 'medium',
          source: 'pathFrequencyDetector',
          event, // obligatorio
          data: {
            path,
            ip,
            count: timestamps.length,
            windowMs
          }
        })
      );
      
    }
  };
}
