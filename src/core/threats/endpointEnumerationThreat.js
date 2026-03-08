import { createNotFoundDetector } from '../../detectors/notFound_Detector.js';
import { createEndpointEntropyDetector } from '../../detectors/endpointEntropy_Detector.js';
import { createEndpointDiversityDetector } from '../../detectors/endpointDiversity_Detector.js';

import { createEndpointEnumerationAnalyzer } from '../../analyzers/endpointEnumerationAnalyzer.js';
import { createLogThreatAction } from '../../actions/logThreatAction.js';

export function registerEndpointEnumerationThreat({ bus, logger, config }) {
  const threatConfig = config.security?.detectors?.endpointEnumeration || {};

  const { windowMs, minSignals } = threatConfig;

  // Detectores
  const notFoundDetector = createNotFoundDetector({ bus, logger });
  const entropyDetector = createEndpointEntropyDetector({ bus, logger });
  const diversityDetector = createEndpointDiversityDetector({ bus, logger });

  bus.registerAnalyzer(notFoundDetector);
  bus.registerAnalyzer(entropyDetector);
  bus.registerAnalyzer(diversityDetector);

  // Analyzer
  const analyzer = createEndpointEnumerationAnalyzer({
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