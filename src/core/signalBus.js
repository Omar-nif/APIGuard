export function createSignalBus() {
  const detectors = new Set();
  const analyzers = new Set();
  const actions = new Set();

  return {
    registerDetector(detector) {
      if (typeof detector !== 'function') throw new Error('Detector must be a function');
      detectors.add(detector);
    },

    registerAnalyzer(analyzer) {
      if (typeof analyzer !== 'function') throw new Error('Analyzer must be a function');
      analyzers.add(analyzer);
    },

    registerAction(action) {
      if (typeof action !== 'function') throw new Error('Action must be a function');
      actions.add(action);
    },

    emit(signal) {
      if (!signal || typeof signal.type !== 'string') return;

        // 1. Detectores: Procesan eventos base (entrada/salida)
        if (signal.type === 'request' || signal.type === 'response') {
          for (const detector of detectors) {
            try { detector(signal); } catch (e) { /* Error silencioso en producción */ }
          }
        }

        // 2. Analizadores: El cerebro del sistema
        for (const analyzer of analyzers) {
          try { analyzer(signal); } catch (e) { }
        }

        // 3. Acciones: Solo se disparan ante amenazas confirmadas
        if (signal.type.startsWith('threat.')) {
          for (const action of actions) {
            try { action(signal); } catch (e) { }
          }
        }
    }
  };
}