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

    /**
     * EMIT Síncrono: El corazón de la reactividad en tiempo real.
     * Garantiza que la cadena Detector -> Analizador -> Acción se complete
     * antes de devolver el control al middleware.
     */
    emit(signal) {
      if (!signal || typeof signal.type !== 'string') return;

      // 1. Fase de Detección: Traduce eventos HTTP a señales lógicas (ej: auth.failed)
      if (signal.type === 'request' || signal.type === 'response') {
        for (const detector of detectors) {
          try { 
            detector(signal); 
          } catch (e) {
            // Fail-open: Un detector roto no detiene el bus
          }
        }
      }

      // 2. Fase de Análisis: Procesa señales lógicas para encontrar patrones (amenazas)
      // Si un analizador llama a bus.emit('threat.*'), se activará la fase 3 inmediatamente.
      for (const analyzer of analyzers) {
        try { 
          analyzer(signal); 
        } catch (e) {
          // Fail-open
        }
      }

      // 3. Fase de Acción: El DecisionEngine registra el castigo en el Store
      if (signal.type.startsWith('threat.')) {
        for (const action of actions) {
          try { 
            action(signal); 
          } catch (e) {
            // Fail-open
          }
        }
      }
    }
  };
}