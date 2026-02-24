import { createAuthFailedDetector } from "../../detectors/authFailed_Detector.js";
import { createAuthBruteForceAnalyzer } from "../../analyzers/authBruteForceAnalyzer.js";

export function registerAuthBruteForceThreat({ bus, logger, config }) {
    const bruteForce = config?.security?.bruteForce;
  
    if (!bruteForce?.enabled) {
      return;
    }
  
    const detector = createAuthFailedDetector({
      bus,
      config
    });
  
    const analyzer = createAuthBruteForceAnalyzer({
      bus,
      logger,
      config
    });
  
    bus.registerAnalyzer(detector);
    bus.registerAnalyzer(analyzer);
  }