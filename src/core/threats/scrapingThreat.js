import { createScrapingDetector } from "../../detectors/scraping_Detector.js";
import { createScrapingAnalyzer } from "../../analyzers/scrapingAnalyzer.js";
import { createLogThreatAction } from "../../actions/logThreatAction.js";

export function registerScrapingThreat({ bus, logger, config }) {
    const detector = createScrapingDetector({ bus, logger, config });
    const analyzer = createScrapingAnalyzer({ bus, logger });

    bus.registerDetector(detector);
    bus.registerAnalyzer(analyzer);
    bus.registerAction(createLogThreatAction);
}