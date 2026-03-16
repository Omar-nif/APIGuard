import { createRequestRateDetector } from "../../detectors/requestRate_Detector.js";
import { createEndpointRateDetector } from "../../detectors/endpointRate_Detector.js";

import { createDosAnalyzer } from "../../analyzers/dosAnalyzer.js";

export function registerDoSThreat({ bus, logger, config }) {
  const dosConfig = config?.security?.detectors?.dos;

  if (!dosConfig) return;

  // 1. Registro del Detector de Request Flood
  if (dosConfig.requestFlood?.enabled) {
    const requestRateDetector = createRequestRateDetector({
      bus,
      config: dosConfig.requestFlood 
    });
    bus.registerDetector(requestRateDetector);
  }

  // 2. Registro del Detector de Endpoint Flood
  if (dosConfig.endpointFlood?.enabled) {
    const endpointRateDetector = createEndpointRateDetector({
      bus,
      config: dosConfig.endpointFlood
    });
    bus.registerDetector(endpointRateDetector);
  }

  // 3. Registro del Analizador (Siempre se registra si el módulo DoS está activo)
  const dosAnalyzer = createDosAnalyzer({
    bus,
    logger,
    config
  });
  
  bus.registerAnalyzer(dosAnalyzer);
  
}