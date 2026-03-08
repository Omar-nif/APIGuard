import { createSignal } from '../signals/createSignal.js';

export function createEndpointEnumerationAnalyzer(options = {}) {
  const {
    bus,
    logger,
    windowMs = 30_000,
    minSignals = 2
  } = options;

  const state = new Map();

  function getState(ip) {
    if (!state.has(ip)) {
      state.set(ip, {
        signals: new Set(),
        firstSeen: Date.now(),
        lastSeen: Date.now()
      });
    }
    return state.get(ip);
  }

  function cleanup(ip, data) {
    const now = Date.now();
  
    if (now - data.lastSeen > windowMs) {
      state.delete(ip);
    }
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

      logger?.threat?.(
        '[ENDPOINT ENUMERATION]',
        ip,
        [...data.signals]
      );

      bus.emit(threatSignal);

      state.delete(ip);
    }
  }

  return function endpointEnumerationAnalyzer(signal) {
    if (!signal || !signal.type?.startsWith('endpoint.')) return;

    const ip = signal.event?.request?.ip;
    if (!ip) return;

    const data = getState(ip);
    data.lastSeen = Date.now();

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

    logger?.debug?.(
      '[ENUM SIGNAL]',
      signal.type,
      signal.event?.request?.path
    );

    evaluate(ip, data, signal);
    cleanup(ip, data);
  };
}

/*

import { createSignal } from '../signals/createSignal.js';

export function createEndpointEnumerationAnalyzer(options = {}) {
  const {
    bus,
    logger,
    windowMs = 30_000,
    minSignals = 2
  } = options;

  const state = new Map();

  function getState(ip) {
    if (!state.has(ip)) {
      state.set(ip, {
        notFound: 0,
        diversity: 0,
        entropy: 0,
        lastSeen: Date.now()
      });
    }
    return state.get(ip);
  }

  function cleanup(ip) {
    const data = state.get(ip);
    if (!data) return;

    if (Date.now() - data.lastSeen > windowMs) {
      state.delete(ip);
    }
  }

  function evaluate(ip, data, signal) {
    const hits =
      (data.notFound > 0) +
      (data.diversity > 0) +
      (data.entropy > 0);

    if (hits >= minSignals) {
      const threatSignal = createSignal({
        type: 'threat.endpoint_enumeration',
        level: 'high',
        source: 'endpointEnumerationAnalyzer',
        event: signal.event,
        data: {
          ip,
          signals: {
            notFound: data.notFound,
            diversity: data.diversity,
            entropy: data.entropy
          }
        }
      });

      logger.threat(
        '[ENDPOINT ENUMERATION]',
        ip,
        threatSignal.data.signals
      );

      bus.emit(threatSignal);

      // Reset para evitar spam
      state.delete(ip);
    }
  }

  return function endpointEnumerationAnalyzer(signal) {
    if (!signal || !signal.type?.startsWith('endpoint.')) return;

    // ESTA LÍNEA TE DIRÁ QUÉ ESTÁ LLEGANDO REALMENTE
  console.log('--- ANALIZADOR RECIBIÓ:', signal.type);

    const ip = signal.event.request.ip;

    logger.debug(
      '[ANALYZER IN]',
      signal.type,
      ip
    );

    const data = getState(ip);
    data.lastSeen = Date.now();

    switch (signal.type) {
      case 'endpoint.not_found':
        data.notFound++;
        break;
      case 'endpoint.high_diversity':
        data.diversity++;
        break;
      case 'endpoint.high_entropy':
        data.entropy++;
        break;
      default:
        return;
    }

    logger.debug(
      '[PATH SIGNAL]',
      signal.type,
      signal.event.request.path
    );

    evaluate(ip, data, signal);
    cleanup(ip);
  };
}
*/