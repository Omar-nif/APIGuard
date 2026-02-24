import { createSignalBus } from './signalBus.js';
import { createLogger } from './logger.js';

// Threats
import { registerPathProbingThreat } from './threats/pathProbingThreat.js';
import { registerAuthBruteForceThreat } from './threats/authBruteForceThreat.js';

export function createApiguardCore(config) {
  const logger = createLogger({
    mode: config.logger.mode
  });

  const bus = createSignalBus({ logger });

  // Threat Registry (explícito por ahora)
  if (config.security?.pathProbing?.enabled) {
    registerPathProbingThreat({ bus, logger, config });
  }

  if (config.security?.bruteForce?.enabled) {
    registerAuthBruteForceThreat({ bus, logger, config });
  }

  return {
    process(event) {
      bus.emit({
        type: 'request',
        event,
        source: 'apiguardCore'
      });
    }
  };
}

/* ---------------------------- V1 ----------------------------------
export function createApiguardCore() {
  const bus = createSignalBus();

  // Analyzer escucha TODAS las señales
  bus.registerAnalyzer(
    createPathProbingAnalyzer({ bus })
  );

  // Action escucha señales de amenaza
  bus.registerAnalyzer(
    createLogThreatAction()
  );

  // Detectores (se ejecutan manualmente)
  const detectors = [
    createNotFoundDetector({ bus }),
    createPathFrequencyDetector({ bus }),
    createPathEntropyDetector({ bus })
  ];

  return {
    process(event) {
      detectors.forEach(detector => detector(event));
    }
  };
}
/*
------------------------- V2 -------------------------------
/*
import { createBus } from '../bus.js';

// Detectores
import { createNotFoundDetector } from '../detectors/notFoundDetector.js';
import { createPathFrequencyDetector } from '../detectors/pathFrequencyDetector.js';
import { createPathEntropyDetector } from '../detectors/pathEntropyDetector.js';

// Analyzer
import { createPathProbingAnalyzer } from '../analyzers/pathProbingAnalyzer.js';

// Action
import { createLogThreatAction } from '../actions/logThreatAction.js';

export function createApiguardCore() {
  const bus = createBus();

  // Detectores
  const notFoundDetector = createNotFoundDetector({ bus });
  const pathFrequencyDetector = createPathFrequencyDetector({ bus });
  const pathEntropyDetector = createPathEntropyDetector({ bus });

  // Analyzer
  const pathProbingAnalyzer = createPathProbingAnalyzer({ bus });

  // Action
  const logThreatAction = createLogThreatAction();

  // Conexiones
  bus.on('event', notFoundDetector);
  bus.on('event', pathFrequencyDetector);
  bus.on('event', pathEntropyDetector);

  bus.on('signal', pathProbingAnalyzer);
  bus.on('signal', logThreatAction);

  return {
    process(event) {
      bus.emit('event', event);
    }
  };
}
*/