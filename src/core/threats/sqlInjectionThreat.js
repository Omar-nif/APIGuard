import { createSQLInjectionDetector } from "../../detectors/SQLInjection_Detector.js";
import { createSQLInjectionAnalyzer } from "../../analyzers/SQLInjection_Analyzer.js";
import { createLogThreatAction } from '../../actions/logThreatAction.js';

export function registerSQLInjectionThreat({ bus, logger, config }) {
    const sqliConfig = config?.security?.detectors?.sqlInjection;

    if (!sqliConfig?.enabled) {
      return;
    }

    const detector = createSQLInjectionDetector({ bus, logger, config });
    const analyzer = createSQLInjectionAnalyzer({ bus, logger });
    const logAction = createLogThreatAction({ bus, logger });

    bus.registerDetector(detector);
    bus.registerAnalyzer(analyzer);
    bus.registerAction(logAction);

}