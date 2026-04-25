import { createSignal } from "../signals/createSignal.js";

export function createExpensiveEndpointAnalyzer({ bus, config }) {
  if (!bus) throw new Error('expensiveEndpointAnalyzer requires bus');

  const settings = config?.security?.detectors?.dos?.expensiveEndpoints;
  if (!settings?.enabled) return () => {};

  const {
    windowMs = 60_000,
    threshold = 5,
    cooldownMs = 5000,
    maxTrackedIps = 10000 // Límite de seguridad para la RAM
  } = settings;

  const state = new Map();
  const lastDetection = new Map();

  // LIMPIEZA DESACOPLADA 
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of state.entries()) {
      if (now - data.lastSeen > windowMs) {
        state.delete(ip);
        lastDetection.delete(ip);
      }
    }
  }, windowMs).unref();

  function getState(ip) {
    if (!state.has(ip)) {
      // CONTROL DE CAPACIDAD
      if (state.size >= maxTrackedIps) {
        const oldestIp = state.keys().next().value;
        state.delete(oldestIp);
        lastDetection.delete(oldestIp);
      }

      state.set(ip, {
        count: 0,
        lastSeen: Date.now()
      });
    }
    return state.get(ip);
  }

  return function expensiveEndpointAnalyzer(signal) {
    try {
      if (!signal || signal.type !== 'dos.expensive_access') return;

      const ip = signal.event.request.ip;
      const { path } = signal.data;

      const data = getState(ip);
      data.count++;
      data.lastSeen = Date.now();

      const now = Date.now();
      const lastTime = lastDetection.get(ip) || 0;

      // Evaluamos umbral y cooldown
      if (data.count >= threshold && (now - lastTime > cooldownMs)) {
        const threat = createSignal({
          type: 'threat.dos.expensive_endpoint',
          level: 'high',
          source: 'expensiveEndpointAnalyzer',
          event: signal.event,
          data: { ip, path, requests: data.count, windowMs, threshold }
        });

        lastDetection.set(ip, now);
        state.delete(ip); // Reiniciamos contador tras detectar

        setImmediate(() => {
          try {
            bus.emit(threat);
          } catch (e) {}
        });
      }
    } catch (err) {
      // Fail-Open
    }
  };
}