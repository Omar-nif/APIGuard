import { createRequestRateDetector } from "../../detectors/requestRate_Detector.js";
import { createEndpointRateDetector } from "../../detectors/endpointRate_Detector.js";
import { createExpensiveEndpointDetector } from "../../detectors/expensiveEndpoint_Detector.js";

import { createDosAnalyzer } from "../../analyzers/dosAnalyzer.js";
import { createExpensiveEndpointAnalyzer } from "../../analyzers/expensiveEndpointAnalyzer.js";

export function registerDoSThreat({ bus, logger, config }) {
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
    bus.registerDetector(createExpensiveEndpointDetector({ bus, config, logger }));
  }

  // 2. Analizadores
  
  // Analizador para Request y Endpoint Flood (comparten lógica de volumen)
  bus.registerAnalyzer(createDosAnalyzer({ bus, logger, config }));

  // Analizador específico para Expensive Endpoints (lógica de lista/umbral estricto)
  //if (dosConfig.expensiveEndpoints?.enabled) {
    bus.registerAnalyzer(createExpensiveEndpointAnalyzer({ bus, logger, config }));
  //}
}