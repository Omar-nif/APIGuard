/*
Si hay muchas requests a una misma IP a un mismo endpoint
-> emitir signal: endpoint.high_rate
*/

import { createSignal } from '../signals/createSignal.js';

export function createEndpointRateDetector({ bus, config = {} }) {
  if (!bus) throw new Error('endpointRateDetector requires a signal bus');
    
  const {
    enabled = true,
    windowMs = 10000,
    threshold = 40,
    cooldownMs = 5000
  } = config;
  
  if (!enabled) return () => {};

  const endpointStats = new Map();
  const lastSignal = new Map();

  // Función de limpieza para mantener el mapa bajo control
  function cleanup(key, stats, now) {
    // Si la ventana ya pasó y no ha habido actividad reciente, borramos
    if (now - stats.windowStart > windowMs * 1.5) {
      endpointStats.delete(key);
      lastSignal.delete(key);
    }
  }

  return function endpointRateDetector(signal) {
    if (!signal || signal.type !== 'request') return;

    const event = signal.event;
    if (!event || event.meta?.ignored) return;

    const ip = event.request.ip;
    const path = event.request.path;

    // Clave compuesta: IP + Path
    const key = `${ip}:${path}`;
    const now = Date.now();

    let stats = endpointStats.get(key);

    if (!stats) {
      stats = { count: 0, windowStart: now };
      endpointStats.set(key, stats);
    }

    // Reiniciar ventana
    if (now - stats.windowStart > windowMs) {
      stats.count = 0;
      stats.windowStart = now;
    }

    stats.count++;

    // Lógica de detección
    if (stats.count >= threshold) {
      const last = lastSignal.get(key) ?? 0;
      if (now - last < cooldownMs) return;

      lastSignal.set(key, now);

      bus.emit(
        createSignal({
          type: 'endpoint.high_rate',
          level: 'medium',
          source: 'endpointRateDetector',
          event,
          data: {
            ip,
            path,
            requests: stats.count,
            windowMs
          }
        })
      );
    }

    // Limpieza esporádica basada en probabilidad para no afectar el performance en cada request
    if (Math.random() < 0.1) { // 10% de las veces intenta limpiar la entrada actual
       cleanup(key, stats, now);
    }
  };
}