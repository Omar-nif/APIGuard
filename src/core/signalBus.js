export function createSignalBus({ logger } = {}) {

  const detectors = new Set();
  const analyzers = new Set();
  const actions = new Set();

  const log = logger || { debug: () => {} };

  function registerDetector(detector) {
    if (typeof detector !== 'function') {
      throw new Error('Detector must be a function');
    }
    detectors.add(detector);
  }

  function registerAnalyzer(analyzer) {
    if (typeof analyzer !== 'function') {
      throw new Error('Analyzer must be a function');
    }
    analyzers.add(analyzer);
  }

  function registerAction(action) {
    if (typeof action !== 'function') {
      throw new Error('Action must be a function');
    }
    actions.add(action);
  }

  function emit(signal) {
    if (!signal || typeof signal.type !== 'string') return;

    log.debug?.('Signal emitted', { type: signal.type });

    // Detectores escuchan eventos base
    if (signal.type === 'request' || signal.type === 'response') {
      for (const detector of detectors) {
        try {
          detector(signal);
        } catch (_) {}
      }
    }

    // Analizadores escuchan TODAS las señales
    for (const analyzer of analyzers) {
      try {
        analyzer(signal);
      } catch (_) {}
    }

    // Acciones solo escuchan amenazas
    if (signal.type.startsWith('threat.')) {
      for (const action of actions) {
        try {
          action(signal);
        } catch (_) {}
      }
    }
  }

  return {
    registerDetector,
    registerAnalyzer,
    registerAction,
    emit
  };
}
