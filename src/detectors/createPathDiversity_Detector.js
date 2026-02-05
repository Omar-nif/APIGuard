import { createSignal } from '../signals/createSignal.js';

export function createPathDiversityDetector(options = {}) {
  const {
    bus,
    threshold = 8,        // rutas distintas
    windowMs = 10_000     // ventana de tiempo
  } = options;

  if (!bus) {
    throw new Error('pathDiversityDetector requires a signal bus');
  }

  // Map<ip, Map<path, timestamp>>
  const state = new Map();

  return function pathDiversityDetector(event) {
    if (!event || event.meta.ignored) return;

    const { ip, path } = event.request;
    const now = Date.now();

    if (!state.has(ip)) {
      state.set(ip, new Map());
    }

    const paths = state.get(ip);

    // Registrar path con timestamp
    paths.set(path, now);

    // Limpiar paths fuera de la ventana
    const cutoff = now - windowMs;
    for (const [p, ts] of paths.entries()) {
      if (ts < cutoff) {
        paths.delete(p);
      }
    }

    // ¿Superó el umbral?
    if (paths.size >= threshold) {
      bus.emit(
        createSignal({
          type: 'path.diversity',
          level: 'medium',
          source: 'pathDiversityDetector',
          event,
          data: {
            ip,
            pathsTried: paths.size,
            windowMs
          }
        })
      );

      // Reset para evitar spam
      state.delete(ip);
    }
  };
}
