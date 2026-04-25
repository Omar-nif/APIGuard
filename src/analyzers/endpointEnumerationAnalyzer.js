import { createSignal } from '../signals/createSignal.js';

export function createEndpointEnumerationAnalyzer(options = {}) {
  const {
    bus,
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

    evaluate(ip, data, signal);
    cleanup(ip, data);
  };
}
