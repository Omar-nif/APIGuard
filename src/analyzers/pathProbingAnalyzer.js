import { createSignal } from '../signals/createSignal.js';

export function createPathProbingAnalyzer(options = {}) {
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
        frequency: 0,
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
      (data.frequency > 0) +
      (data.entropy > 0);

    if (hits >= minSignals) {
      const threatSignal = createSignal({
        type: 'threat.path_probing',
        level: 'high',
        source: 'pathProbingAnalyzer',
        event: signal.event,
        data: {
          ip,
          signals: {
            notFound: data.notFound,
            frequency: data.frequency,
            entropy: data.entropy
          }
        }
      });

      logger.threat(
        '[PATH PROBING]',
        ip,
        threatSignal.data.signals
      );

      bus.emit(threatSignal);

      // Reset para evitar spam
      state.delete(ip);
    }
  }

  return function pathProbingAnalyzer(signal) {
    if (!signal || !signal.event) return;

    const ip = signal.event.request.ip;

    logger.debug(
      '[ANALYZER IN]',
      signal.type,
      ip
    );

    const data = getState(ip);
    data.lastSeen = Date.now();

    switch (signal.type) {
      case 'path.not_found':
        data.notFound++;
        break;
      case 'path.frequency':
        data.frequency++;
        break;
      case 'path.entropy':
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


/*import { createSignal } from '../signals/createSignal.js';

export function createPathProbingAnalyzer(options = {}) {
  const {
    bus,
    windowMs = 30_000,
    minSignals = 1
  } = options;
  //console.log('[ANALYZER RECEIVED]', signal.type, signal.event?.request?.ip);
  const state = new Map();

  function getState(ip) {
    if (!state.has(ip)) {
      state.set(ip, {
        notFound: 0,
        frequency: 0,
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
      (data.frequency > 0) +
      (data.entropy > 0);

    if (hits >= minSignals) {
      bus.emit(
        createSignal({
          type: 'threat.path_probing',
          level: 'high',
          source: 'pathProbingAnalyzer',
          event: signal.event,
          data: {
            ip,
            signals: {
              notFound: data.notFound,
              frequency: data.frequency,
              entropy: data.entropy
            }
          }
        })
      );

      // Reset para evitar spam
      state.delete(ip);
    }
  }

  return function pathProbingAnalyzer(signal) {
    console.log('[ANALYZER IN]', signal.type, signal.event?.request?.ip);
    if (!signal || !signal.event) return;

    const ip = signal.event.request.ip;
    const data = getState(ip);

    data.lastSeen = Date.now();

    switch (signal.type) {
      case 'path.not_found':
        data.notFound++;
        break;
      case 'path.frequency':
        data.frequency++;
        break;
      case 'path.entropy':
        data.entropy++;
        break;
      default:
        return;
    }
    console.log('[ANALYZER]', signal.type, signal.event.request.path);

    evaluate(ip, data, signal);
    cleanup(ip);
  };
}
*/