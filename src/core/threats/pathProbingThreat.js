import { createNotFoundDetector } from '../../detectors/notFound_Detector.js';
import { createPathEntropyDetector } from '../../detectors/pathEntropy_Detector.js';
import { createPathDiversityDetector } from '../../detectors/createPathDiversity_Detector.js';

import { createPathProbingAnalyzer } from '../../analyzers/pathProbingAnalyzer.js';
import { createLogThreatAction } from '../../actions/logThreatAction.js';

export function registerPathProbingThreat({ bus, logger, config }) {
  const threatConfig = config.security.pathProbing || {};

  const { windowMs, minSignals } = threatConfig;

  // Detectores
  const notFoundDetector = createNotFoundDetector({ bus, logger });
  const entropyDetector = createPathEntropyDetector({ bus, logger });
  const diversityDetector = createPathDiversityDetector({ bus, logger });

  bus.registerAnalyzer(notFoundDetector);
  bus.registerAnalyzer(entropyDetector);
  bus.registerAnalyzer(diversityDetector);

  // Analyzer
  const analyzer = createPathProbingAnalyzer({
    bus,
    logger,
    windowMs,
    minSignals
  });

  bus.registerAnalyzer(analyzer);

  // Acción
  const logAction = createLogThreatAction({ bus, logger });

  bus.registerAction(logAction);
}