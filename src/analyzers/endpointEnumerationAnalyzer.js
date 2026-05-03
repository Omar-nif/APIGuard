import { createSignal } from '../signals/createSignal.js';

export function createEndpointEnumerationAnalyzer(options = {}) {
  const {
    bus,
    windowMs = 30_000,
    minSignals = 2,
    maxTrackedIps = 10000 // Límite de seguridad para la RAM
  } = options;

  if (!bus) throw new Error('endpointEnumerationAnalyzer requires bus');

  const state = new Map();

  // LIMPIEZA DESACOPLADA (Conserje)
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of state.entries()) {
      if (now - data.lastSeen > windowMs) {
        state.delete(ip);
      }
    }
  }, windowMs).unref();

  function getState(ip) {
    if (!state.has(ip)) {
      // CONTROL DE CAPACIDAD
      if (state.size >= maxTrackedIps) {
        const oldestIp = state.keys().next().value;
        state.delete(oldestIp);
      }

      state.set(ip, {
        signals: new Set(),
        firstSeen: Date.now(),
        lastSeen: Date.now()
      });
    }
    return state.get(ip);
  }

  function evaluate(ip, data, signal) {
    if (data.signals.size >= minSignals) {
      const threatSignal = createSignal({
        type: 'threat.endpoint_enumeration',
        level: 'high',
        source: 'endpointEnumerationAnalyzer',
        event: signal.event,
        data: {
          ip,
          signals: [...data.signals]
        }
      });

        try {
          bus.emit(threatSignal);
        } catch (e) {}

      state.delete(ip); // Limpiamos tras la detección
    }
  }

  return function endpointEnumerationAnalyzer(signal) {
    try {
      // 1. Filtrado rápido
      if (!signal || !signal.type?.startsWith('endpoint.')) return;

      const ip = signal.event?.request?.ip || signal.data?.ip;
      if (!ip) return;

      const data = getState(ip);
      data.lastSeen = Date.now();

      // 2. Mapeo de sospechas
      switch (signal.type) {
        case 'endpoint.not_found':
          data.signals.add('not_found');
          break;
        case 'endpoint.high_diversity':
          data.signals.add('diversity');
          break;
        case 'endpoint.high_entropy':
          data.signals.add('entropy');
          break;
        default:
          return;
      }

      // 3. Evaluación
      evaluate(ip, data, signal);
      
    } catch (err) {
      // Fail-Open: Si falla el análisis, la app sigue viva.
    }
  };
}