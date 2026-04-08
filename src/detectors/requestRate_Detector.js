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
  const CLEANUP_INTERVAL = Math.max(windowMs, 5000); // Limpiar cada windowMs o 5s (lo que sea mayor)
  let lastCleanupTime = Date.now();

  // Función de limpieza para evitar fugas de memoria
  function cleanup(ip, stats, now) {
    if (now - stats.lastActivity > windowMs * 3) { // Limpiar IPs inactivas por 3x windowMs
      ipStats.delete(ip);
      lastSignal.delete(ip);
    }
  }

  // Limpieza global periódica de todas las IPs
  function globalCleanup(now) {
    if (now - lastCleanupTime < CLEANUP_INTERVAL) return;
    lastCleanupTime = now;

    for (const [ip, stats] of ipStats.entries()) {
      if (now - stats.lastActivity > windowMs * 3) {
        ipStats.delete(ip);
        lastSignal.delete(ip);
      }
    }
  }

  return function requestRateDetector(signal) {
    if (!signal || signal.type !== 'request') return;

    const event = signal.event;
    if (!event || event.meta?.ignored) return;

    const ip = event.request.ip;
    const now = Date.now();

    // Ejecutar limpieza global periódicamente
    globalCleanup(now);

    let stats = ipStats.get(ip);

    if (!stats) {
      stats = { count: 0, windowStart: now, lastActivity: now };
      ipStats.set(ip, stats);
    }

    // Actualizar tiempo de última actividad
    stats.lastActivity = now;

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

    // Ejecutar limpieza individual
    cleanup(ip, stats, now);
  };
}