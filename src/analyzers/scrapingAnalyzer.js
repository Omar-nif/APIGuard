import { createSignal } from "../signals/createSignal.js";

export function createScrapingAnalyzer({ bus, logger }) {
  
  return function scrapingAnalyzer(signal) {
    // 1. Escuchamos únicamente señales de sospecha de scraping
    if (!signal || signal.type !== 'scraping.suspicion') return;

    const { score, threshold, detections } = signal.data;
    const ip = signal.event?.request?.ip;
    const path = signal.event?.request?.path;

    logger?.debug?.(`[SCRAPING ANALYZER] Evaluando IP ${ip}: Score ${score} vs Threshold ${threshold}`);

    // 2. Verificación del umbral (Threshold definido en el Config)
    if (score >= threshold) {
      logger?.warn?.(`[SCRAPING ANALYZER] ¡Confirmado! Comportamiento de bot en ${path}. Detecciones: ${detections.join(', ')}`);

      // 3. Emitimos la señal de amenaza definitiva (la que el Engine bloquea)
      bus.emit(createSignal({
        type: 'threat.scraping', // Debe coincidir con el nombre en config.security.policies
        level: 'high',
        source: 'scrapingAnalyzer',
        event: signal.event,
        data: {
          score,
          threshold,
          detections,
          ip,
          path
        }
      }));
    }
  };
}