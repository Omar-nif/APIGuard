import { createSignal } from "../signals/createSignal.js";
import { SCRAPING_PATTERNS } from "../utils/scrapingPatterns.js";

export function createScrapingDetector({ bus, config }) {
  const settings = config?.security?.detectors?.scraping;
  if (!settings?.enabled) return () => {};

  return function scrapingDetector(signal) {
    if (!signal || signal.type !== 'request') return;

    const headers = signal.event.request.headers || {};
    const userAgent = headers['user-agent'] || '';
    let totalScore = 0;
    let detections = [];

    // --- ANALISIS 1: User-Agent ---
    // Buscamos en nuestra lista de librerías y herramientas
    const allPatterns = [...SCRAPING_PATTERNS.BOT_AGENTS, ...SCRAPING_PATTERNS.AUTOMATION_TOOLS];
    
    allPatterns.forEach(pattern => {
      if (pattern.regex.test(userAgent)) {
        totalScore += pattern.score;
        detections.push(pattern.name);
      }
    });

    // --- ANALISIS 2: Anomalía de Headers (Fingerprinting básico) ---
    // Si no tiene User-Agent, es sospechoso de inmediato
    if (!userAgent) {
      totalScore += 15;
      detections.push('Missing User-Agent');
    }

    // Si faltan cabeceras que un navegador real SIEMPRE envía
    SCRAPING_PATTERNS.HUMAN_INDICATORS.forEach(header => {
      if (!headers[header]) {
        totalScore += 3; // Puntos acumulativos por cada cabecera faltante
      }
    });

    // --- EMISIÓN DE SEÑAL ---
    if (totalScore > 0) {
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
    }
  };
}