import { createSignal } from '../signals/createSignal.js';

export function createEndpointDiversityDetector(options = {}) {
  const { 
    bus, 
    threshold = 8, 
    windowMs = 10_000,
    maxTrackedIps = 5000 // Límite de IPs para no saturar la RAM
  } = options;

  if (!bus) {
    throw new Error('createEndpointDiversityDetector requires a signal bus');
  }

  const state = new Map();

  // Limpieza activa cada ventana de tiempo
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    const cutoff = now - windowMs;
    
    for (const [ip, paths] of state.entries()) {
      // Limpiar paths viejos dentro de cada IP
      for (const [p, ts] of paths.entries()) {
        if (ts < cutoff) paths.delete(p);
      }
      // Si la IP ya no tiene actividad, borrarla del mapa principal
      if (paths.size === 0) state.delete(ip);
    }
  }, windowMs).unref();

  return function endpointDiversityDetector(signal) {
    try {
      if (!signal || signal.type !== 'request') return;

      const event = signal.event;
      if (!event || event.meta?.ignored) return;

      const ip = event.request?.ip;
      const path = event.request?.path;
      if (!ip || !path) return;

      const now = Date.now();

      // 1. Obtener o crear el mapa de paths para esta IP
      let paths = state.get(ip);
      if (!paths) {
        // VÁLVULA DE SEGURIDAD: Evitar crecimiento infinito del Map principal
        if (state.size >= maxTrackedIps) {
          const oldestIp = state.keys().next().value;
          state.delete(oldestIp);
        }
        paths = new Map();
        state.set(ip, paths);
      }

      // 2. Registrar el path actual
      paths.set(path, now);

      // 3. Evaluación
      if (paths.size >= threshold) {
        const diversitySignal = createSignal({
          type: 'endpoint.high_diversity',
          level: 'medium',
          source: 'endpointDiversityDetector',
          event,
          data: { ip, pathsTried: paths.size, windowMs }
        });

        // Asincronía para no penalizar el request
        setImmediate(() => {
          try {
            bus.emit(diversitySignal);
          } catch (e) {}
        });

        // Limpiamos la IP tras detectar para liberar memoria inmediatamente
        state.delete(ip);
      }
    } catch (err) {
      // Fail-Open
    }
  };
}