/*
si una IP hace demasiadas requests en una ventana de tiempo
-> emitir signal: request.high_rate
*/

import { createSignal } from '../signals/createSignal.js';

export function createRequestRateDetector({ bus, config = {} }) {
  if (!bus) throw new Error('requestRateDetector requires a signal bus');

  const {
    enabled = true,
    windowMs = 10000,
    threshold = 80,
    cooldownMs = 5000
  } = config;

  if (!enabled) return () => {};

  const ipStats = new Map();
  const lastSignal = new Map();

  // Función de limpieza para evitar fugas de memoria
  function cleanup(ip, stats, now) {
    if (now - stats.windowStart > windowMs * 2) { // Si ha pasado el doble de la ventana sin actividad
      ipStats.delete(ip);
      lastSignal.delete(ip);
    }
  }

  return function requestRateDetector(signal) {
    if (!signal || signal.type !== 'request') return;

    const event = signal.event;
    if (!event || event.meta?.ignored) return;

    const ip = event.request.ip;
    const now = Date.now();

    let stats = ipStats.get(ip);

    if (!stats) {
      stats = { count: 0, windowStart: now };
      ipStats.set(ip, stats);
    }

    // Reiniciar ventana si expiró
    if (now - stats.windowStart > windowMs) {
      stats.count = 0;
      stats.windowStart = now;
    }

    stats.count++;

    if (stats.count >= threshold) {
      const last = lastSignal.get(ip) ?? 0;
      if (now - last < cooldownMs) return;

      lastSignal.set(ip, now);

      bus.emit(
        createSignal({
          type: 'request.high_rate',
          level: 'medium',
          source: 'requestRateDetector',
          event,
          data: {
            ip,
            requests: stats.count,
            windowMs
          }
        })
      );
    }

    // Ejecutar limpieza esporádica
    cleanup(ip, stats, now);
  };
}