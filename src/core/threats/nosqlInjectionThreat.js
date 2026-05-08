import { createNoSQLInjectionDetector } from "../../detectors/NoSQLInjection_Detector.js";
import { createNoSQLInjectionAnalyzer } from "../../analyzers/NoSQLInjection_Analyzer.js";

export function registerNoSQLInjectionThreat({ bus, config }){
    const noSqliConfig = config?.security?.detectors?.noSqlInjection;

    if (!noSqliConfig?.enabled) {
      return;
    }
    
    const detector = createNoSQLInjectionDetector ({ bus, config });
    const analyzer = createNoSQLInjectionAnalyzer ({ bus });
    
    bus.registerDetector(detector);
    bus.registerAnalyzer(analyzer);
}