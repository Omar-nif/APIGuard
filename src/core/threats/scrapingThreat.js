import { createScrapingDetector } from "../../detectors/scraping_Detector.js";
import { createScrapingAnalyzer } from "../../analyzers/scrapingAnalyzer.js";

export function registerScrapingThreat({ bus, config }) {
    const detector = createScrapingDetector({ bus, config });
    const analyzer = createScrapingAnalyzer({ bus });

    bus.registerDetector(detector);
    bus.registerAnalyzer(analyzer);
}