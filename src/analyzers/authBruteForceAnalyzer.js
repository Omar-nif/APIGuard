import { createSignal } from "../signals/createSignal.js";

export function createAuthBruteForceAnalyzer({ bus, logger, config }) {
  if (!bus) throw new Error('authBruteForceAnalyzer requires bus');

  const bruteForce = config?.security?.detectors?.bruteForce;

  if (!bruteForce?.enabled) {
    return () => {};
  }

  const {
    windowMS = 60_000,
    threshold = 5
  } = bruteForce;

  const state = new Map();

  function getState(ip) {
    if (!state.has(ip)) {
      state.set(ip, {
        attempts: 0,
        firstSeen: Date.now(),
        lastSeen: Date.now()
      });
    }
    return state.get(ip);
  }

  function cleanup(ip, data) {
    if (Date.now() - data.lastSeen > windowMS) {
      state.delete(ip);
    }
  }

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

      logger?.threat?.(
        '[AUTH BRUTE FORCE]',
        ip,
        `attempts=${data.attempts}`,
        `window=${windowMS}ms`
      );

      bus.emit(threatSignal);

      state.delete(ip);
    }
  }

  return function authBruteForceAnalyzer(signal) {
    if (!signal || signal.type !== 'auth.failed') return;

    const ip = signal.event.request.ip;
    const data = getState(ip);

    data.attempts++;
    data.lastSeen = Date.now();

    logger?.debug?.(
      '[AUTH FAILED]',
      ip,
      `attempts=${data.attempts}`
    );

    evaluate(ip, data, signal);
    cleanup(ip, data);
  };
}