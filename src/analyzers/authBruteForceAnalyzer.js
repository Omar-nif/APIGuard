import { createSignal } from "../signals/createSignal.js";

export function createAuthBruteForceAnalyzer({ bus, config }) {
  if (!bus) throw new Error('authBruteForceAnalyzer requires bus');

  const bruteForce = config?.security?.detectors?.bruteForce;
  if (!bruteForce?.enabled) return () => {};

  const {
    windowMS = 60_000,
    threshold = 5,
    maxTrackedIps = 10000 
  } = bruteForce;

  const state = new Map();

  function getState(ip) {
    const now = Date.now();
    let data = state.get(ip);

    // Si la IP existe pero el último intento fue hace mucho, reseteamos su ventana
    if (data && (now - data.lastSeen > windowMS)) {
      state.delete(ip);
      data = null;
    }

    if (!data) {
      if (state.size >= maxTrackedIps) {
        const oldestIp = state.keys().next().value;
        state.delete(oldestIp);
      }

      data = {
        attempts: 0,
        firstSeen: now,
        lastSeen: now
      };
      state.set(ip, data);
    }
    return data;
  }

  // Limpieza pasiva para evitar fugas de memoria de IPs que nunca volvieron
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of state.entries()) {
      if (now - data.lastSeen > windowMS) {
        state.delete(ip);
      }
    }
  }, windowMS * 2).unref();

  function evaluate(ip, data, signal) {
    if (data.attempts >= threshold) {
      const threatSignal = createSignal({
        type: 'threat.auth_bruteforce',
        level: 'high', 
        source: 'authBruteForceAnalyzer',
        event: signal.event,
        data: {
          ip,
          attempts: data.attempts,
          windowMS
        }
      });

      bus.emit(threatSignal);
      
      state.delete(ip); 
    }
  }

  return function authBruteForceAnalyzer(signal) {
    // Escuchamos la señal que emite nuestro detector corregido
    if (!signal || signal.type !== 'auth.failed') return;

    const ip = signal.event?.request?.ip || signal.data?.ip;
    if (!ip) return;

    const data = getState(ip);
    data.attempts++;
    data.lastSeen = Date.now();

    evaluate(ip, data, signal);
  };
}