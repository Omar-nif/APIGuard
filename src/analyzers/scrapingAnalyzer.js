import { createSignal } from "../signals/createSignal.js";

export function createScrapingAnalyzer({ bus }) {
  if (!bus) throw new Error('scrapingAnalyzer requires bus');

  return function scrapingAnalyzer(signal) {
    // Fail-Safe: Evitamos que un error de datos tumbe el servidor
    try {
      // 1. Filtrado de señales
      if (!signal || signal.type !== 'scraping.suspicion') return;

      // Extraemos con seguridad (destructuring)
      const { score, threshold, detections } = signal.data || {};
      const ip = signal.event?.request?.ip || signal.data?.ip;
      const path = signal.event?.request?.path || signal.data?.path;

      // 2. Verificación del umbral
      if (score !== undefined && score >= threshold) {

        const threatSignal = createSignal({
          type: 'threat.scraping',
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
        });

        // Asincronía para no penalizar el tiempo de respuesta del usuario legítimo
        setImmediate(() => {
          try {
            bus.emit(threatSignal);
          } catch (e) {
            // Silencio en caso de error en suscriptores del bus
          }
        });
      }
    } catch (err) {
      // Fail-Open: Si el análisis falla, el servidor sigue funcionando
    }
  };
}