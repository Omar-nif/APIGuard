import { createNoSQLInjectionDetector } from "../../detectors/NoSQLInjection_Detector.js";
import { createNoSQLInjectionAnalyzer } from "../../analyzers/NoSQLInjection_Analyzer.js";
import { createLogThreatAction } from '../../actions/logThreatAction.js';

export function registerNoSQLInjectionThreat({ bus, logger, config }){
    
    const detector = createNoSQLInjectionDetector ({ bus, logger, config });
    const analyzer = createNoSQLInjectionAnalyzer ({ bus, logger });
    const logAction = createLogThreatAction ({ bus, logger });
    
    bus.registerDetector(detector);
    bus.registerAnalyzer(analyzer);
    bus.registerAction(logAction);
}