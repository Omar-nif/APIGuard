import { createSignal } from "../signals/createSignal.js";

export function createAuthBruteForceAnalyzer({ bus, config }) {
  if (!bus) throw new Error('authBruteForceAnalyzer requires bus');

  const bruteForce = config?.security?.detectors?.bruteForce;
  if (!bruteForce?.enabled) return () => {};

  const {
    windowMS = 60_000,
    threshold = 5,
    maxTrackedIps = 10000 // Límite de seguridad: no rastrear más de 10k IPs simultáneas
  } = bruteForce;

  const state = new Map();

  function getState(ip) {
    if (!state.has(ip)) {
      // PROTECCIÓN: Si superamos el límite, borramos la IP más antigua antes de añadir una nueva
      if (state.size >= maxTrackedIps) {
        const oldestIp = state.keys().next().value;
        state.delete(oldestIp);
      }

      state.set(ip, {
        attempts: 0,
        firstSeen: Date.now(),
        lastSeen: Date.now()
      });
    }
    return state.get(ip);
  }

  // LIMPIEZA ACTIVA: Periódicamente borramos IPs que dejaron de atacar
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of state.entries()) {
      if (now - data.lastSeen > windowMS) {
        state.delete(ip);
      }
    }
  }, windowMS).unref(); // .unref() para no bloquear el cierre de Node.js

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
      // Una vez detectado y mandado a bloquear, ya no necesitamos rastrearlo aquí
      state.delete(ip); 
    }
  }

  return function authBruteForceAnalyzer(signal) {
    if (!signal || signal.type !== 'auth.failed') return;

    const ip = signal.event.request.ip || signal.data?.ip;
    if (!ip) return;

    const data = getState(ip);
    data.attempts++;
    data.lastSeen = Date.now();

    evaluate(ip, data, signal);
  };
}