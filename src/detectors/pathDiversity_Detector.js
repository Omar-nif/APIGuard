import { createSignal } from '../signals/createSignal.js';

export function createPathDiversityDetector(options = {}) {
  const {
    bus,
    threshold = 8,
    windowMs = 10_000
  } = options;

  if (!bus) {
    throw new Error('pathDiversityDetector requires a signal bus');
  }

  const state = new Map();

  return function pathDiversityDetector(signal) {
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
    for (const [p, ts] of paths.entries()) {
      if (ts < cutoff) {
        paths.delete(p);
      }
    }

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

      state.delete(ip);
    }
  };
}