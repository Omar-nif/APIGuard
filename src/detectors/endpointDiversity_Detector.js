import { createSignal } from '../signals/createSignal.js';

export function createEndpointDiversityDetector(options = {}) {
  const { bus, threshold = 8, windowMs = 10_000 } = options;

  if (!bus) {
    throw new Error('createEndpointDiversityDetector requires a signal bus');
  }

  const state = new Map();

  return function endpointDiversityDetector(signal) {
    if (signal.type !== 'request') return;

    const event = signal.event;
    if (event.meta?.ignored) return;

    const ip = event.request?.ip;
    const path = event.request?.path;
    if (!ip || !path) return;

    const now = Date.now();
    if (!state.has(ip)) {
      state.set(ip, new Map());
    }

    const paths = state.get(ip);
    paths.set(path, now);

    const cutoff = now - windowMs;

    // Limpieza de paths obsoletos
    for (const [p, ts] of paths.entries()) {
      if (ts < cutoff) paths.delete(p);
    }

    // SI LA IP YA NO TIENE PATHS ACTIVOS, BORRAMOS LA IP PARA LIBERAR MEMORIA
    if (paths.size === 0) {
      state.delete(ip);
      return;
    }

    if (paths.size >= threshold) {
      bus.emit(
        createSignal({
          type: 'endpoint.high_diversity',
          level: 'medium',
          source: 'endpointDiversityDetector',
          event,
          data: { ip, pathsTried: paths.size, windowMs }
        })
      );
      state.delete(ip);
    }
  };
}
