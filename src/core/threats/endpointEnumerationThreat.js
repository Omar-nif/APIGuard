import { createNotFoundDetector } from '../../detectors/notFound_Detector.js';
import { createEndpointEntropyDetector } from '../../detectors/endpointEntropy_Detector.js';
import { createEndpointDiversityDetector } from '../../detectors/endpointDiversity_Detector.js';

import { createEndpointEnumerationAnalyzer } from '../../analyzers/endpointEnumerationAnalyzer.js';

export function registerEndpointEnumerationThreat({ bus, config }) {
  const threatConfig = config.security?.detectors?.endpointEnumeration || {};

  const { windowMs, minSignals } = threatConfig;

  // Detectores
  const notFoundDetector = createNotFoundDetector({ bus });
  const entropyDetector = createEndpointEntropyDetector({ bus });
  const diversityDetector = createEndpointDiversityDetector({ bus });

  bus.registerDetector(notFoundDetector);
  bus.registerDetector(entropyDetector);
  bus.registerDetector(diversityDetector);

  // Analyzer
  const analyzer = createEndpointEnumerationAnalyzer({
    bus,
    windowMs,
    minSignals
  });

  bus.registerAnalyzer(analyzer);

}