import { createAuthFailedDetector } from "../../detectors/authFailed_Detector.js";
import { createAuthBruteForceAnalyzer } from "../../analyzers/authBruteForceAnalyzer.js";

export function registerAuthBruteForceThreat({ bus, config }) {
    const bruteForce = config?.security?.detectors?.bruteForce;
  
    if (!bruteForce?.enabled) {
      return;
    }
  
    const detector = createAuthFailedDetector({
      bus,
      config
    });
  
    const analyzer = createAuthBruteForceAnalyzer({
      bus,
      config
    });
  
    bus.registerDetector(detector);
    bus.registerAnalyzer(analyzer);
  }