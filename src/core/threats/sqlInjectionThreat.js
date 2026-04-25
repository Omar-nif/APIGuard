import { createSQLInjectionDetector } from "../../detectors/SQLInjection_Detector.js";
import { createSQLInjectionAnalyzer } from "../../analyzers/SQLInjection_Analyzer.js";

export function registerSQLInjectionThreat({ bus, config }) {
    const sqliConfig = config?.security?.detectors?.sqlInjection;

    if (!sqliConfig?.enabled) {
      return;
    }

    const detector = createSQLInjectionDetector({ bus, config });
    const analyzer = createSQLInjectionAnalyzer({ bus });

    bus.registerDetector(detector);
    bus.registerAnalyzer(analyzer);

}