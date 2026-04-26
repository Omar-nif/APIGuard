import { createSignal } from '../signals/createSignal.js';

export function createRequestRateDetector({ bus, config = {} }) {
  if (!bus) throw new Error('requestRateDetector requires a signal bus');

  const {
    enabled = true,
    windowMs = 10000,
    threshold = 80,
    cooldownMs = 5000,
    maxTrackedIps = 15000 // Límite de seguridad para evitar OOM (Out of Memory)
  } = config;

  if (!enabled) return () => {};

  const ipStats = new Map();
  const lastSignal = new Map();

  // LIMPIEZA DESACOPLADA: Fuera del flujo de la petición
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, stats] of ipStats.entries()) {
      if (now - stats.lastActivity > windowMs * 2) {
        ipStats.delete(ip);
        lastSignal.delete(ip);
      }
    }
  }, windowMs).unref();

  return function requestRateDetector(signal) {
    try {
      if (!signal || signal.type !== 'request') return;

      const event = signal.event;
      if (!event || event.meta?.ignored) return;

      const ip = event.request.ip;
      const now = Date.now();

      let stats = ipStats.get(ip);

      if (!stats) {
        // CONTROL DE CAPACIDAD:
        if (ipStats.size >= maxTrackedIps) {
          const oldestIp = ipStats.keys().next().value;
          ipStats.delete(oldestIp);
          lastSignal.delete(oldestIp);
        }

        stats = { count: 0, windowStart: now, lastActivity: now };
        ipStats.set(ip, stats);
      }

      stats.lastActivity = now;

      // Reiniciar ventana
      if (now - stats.windowStart > windowMs) {
        stats.count = 0;
        stats.windowStart = now;
      }

      stats.count++;

      if (stats.count >= threshold) {
        const last = lastSignal.get(ip) ?? 0;
        if (now - last < cooldownMs) return;

        lastSignal.set(ip, now);

        // Emitimos asíncronamente
        setImmediate(() => {
          try {
            bus.emit(createSignal({
              type: 'request.high_rate',
              level: 'medium',
              source: 'requestRateDetector',
              event,
              data: { ip, requests: stats.count, windowMs }
            }));
          } catch (e) {}
        });
      }
    } catch (err) {
      // Fail-Open
    }
  };
}