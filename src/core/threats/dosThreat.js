import { createRequestRateDetector } from "../../detectors/requestRate_Detector.js";
import { createEndpointRateDetector } from "../../detectors/endpointRate_Detector.js";
import { createExpensiveEndpointDetector } from "../../detectors/expensiveEndpoint_Detector.js";

import { createRequestFloodAnalyzer } from "../../analyzers/RequestFlood_Analyzer.js";
import { createEndpointFloodAnalyzer } from "../../analyzers/EndpointFlood_Analyzer.js";
import { createExpensiveEndpointAnalyzer } from "../../analyzers/expensiveEndpointAnalyzer.js";

export function registerDoSThreat({ bus, config }) {
  const dosConfig = config?.security?.detectors?.dos;
  if (!dosConfig) return;

  // 1. Detectores
  if (dosConfig.requestFlood?.enabled) {
    bus.registerDetector(createRequestRateDetector({ bus, config: dosConfig.requestFlood }));
  }

  if (dosConfig.endpointFlood?.enabled) {
    bus.registerDetector(createEndpointRateDetector({ bus, config: dosConfig.endpointFlood }));
  }

  if (dosConfig.expensiveEndpoints?.enabled) {
    bus.registerDetector(createExpensiveEndpointDetector({ bus, config }));
  }

  // 2. Analizadores
  bus.registerAnalyzer(createEndpointFloodAnalyzer({ bus, config }));
  bus.registerAnalyzer(createRequestFloodAnalyzer({ bus, config }));
  bus.registerAnalyzer(createExpensiveEndpointAnalyzer({ bus, config }));
  //}
}