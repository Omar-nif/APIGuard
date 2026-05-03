import { createSignal } from "../signals/createSignal.js";
import { SCRAPING_PATTERNS } from "../utils/scrapingPatterns.js";

export function createScrapingDetector({ bus, config }) {
  const settings = config?.security?.detectors?.scraping;
  if (!settings?.enabled) return () => {};

  return function scrapingDetector(signal) {
    try {
      if (!signal || signal.type !== 'request') return;

      const headers = signal.event.request.headers || {};
      const userAgent = headers['user-agent'] || '';
      let totalScore = 0;
      let detections = [];

      // --- ANALISIS 1: User-Agent (Identidad) ---
      const allPatterns = [...SCRAPING_PATTERNS.BOT_AGENTS, ...SCRAPING_PATTERNS.AUTOMATION_TOOLS];
      
      for (const pattern of allPatterns) {
        if (pattern.regex.test(userAgent)) {
          totalScore += pattern.score;
          detections.push(pattern.name);
        }
      }

      // --- ANALISIS 2: Anomalía de Headers (Comportamiento Amable) ---
      
      // 2.1 Si no hay User-Agent, sospechamos pero no bloqueamos de inmediato (10 pts)
      if (!userAgent || userAgent.trim() === '') {
        totalScore += 10; 
        detections.push('Missing User-Agent');
      }

      // 2.2 Indicadores humanos: muy bajo peso para evitar falsos positivos
      SCRAPING_PATTERNS.HUMAN_INDICATORS.forEach(header => {
        // Node.js entrega req.headers en minúsculas siempre
        if (!headers[header.toLowerCase()]) {
          totalScore += 1; 
        }
      });

      // --- EMISIÓN DE SEÑAL ---
      if (totalScore > 0) {
          try {
            bus.emit(createSignal({
              type: 'scraping.suspicion',
              source: 'scrapingDetector',
              event: signal.event,
              data: {
                score: totalScore,
                threshold: settings.threshold || 15,
                detections
              }
            }));
          } catch (e) {}
      }
    } catch (err) {
      // Fail-Open: Si algo falla aquí, la petición sigue su curso normal.
    }
  };
}