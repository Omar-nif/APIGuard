import { createSignal } from '../signals/createSignal.js';

export function createEndpointRateDetector({ bus, config = {} }) {
  if (!bus) throw new Error('endpointRateDetector requires a signal bus');
    
  const {
    enabled = true,
    windowMs = 10000,
    threshold = 40,
    cooldownMs = 5000,
    maxTrackedKeys = 20000 
  } = config;
  
  if (!enabled) return () => {};

  const endpointStats = new Map();
  const lastSignal = new Map();

  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, stats] of endpointStats.entries()) {
      if (now - stats.windowStart > windowMs * 2) {
        endpointStats.delete(key);
        lastSignal.delete(key);
      }
    }
  }, windowMs).unref();

  return function endpointRateDetector(signal) {
    try {
      if (!signal || signal.type !== 'request') return;

      const event = signal.event;
      if (!event || event.meta?.ignored) return;

      const ip = event.request.ip;
      const path = event.request.path;
      const key = `${ip}:${path}`;
      const now = Date.now();

      let stats = endpointStats.get(key);

      if (!stats) {
        // CONTROL DE CAPACIDAD (Válvula de seguridad)
        if (endpointStats.size >= maxTrackedKeys) {
          const oldestKey = endpointStats.keys().next().value;
          endpointStats.delete(oldestKey);
          lastSignal.delete(oldestKey);
        }

        stats = { count: 0, windowStart: now };
        endpointStats.set(key, stats);
      }

      // Reiniciar ventana si expiró
      if (now - stats.windowStart > windowMs) {
        stats.count = 0;
        stats.windowStart = now;
      }

      stats.count++;

      // Detección
      if (stats.count >= threshold) {
        const last = lastSignal.get(key) ?? 0;
        if (now - last < cooldownMs) return;

        lastSignal.set(key, now);

          try {
            bus.emit(createSignal({
              type: 'endpoint.high_rate',
              level: 'medium',
              source: 'endpointRateDetector',
              event,
              data: { ip, path, requests: stats.count, windowMs }
            }));
          } catch (e) {}
      }
    } catch (err) {
      // Fail-Open
    }
  };
}