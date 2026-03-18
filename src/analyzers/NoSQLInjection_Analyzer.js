import { createSignal } from "../signals/createSignal.js";

export function createNoSQLInjectionAnalyzer({ bus, logger }) {
  
  return function noSqlInjectionAnalyzer(signal) {
    // 1. Escuchamos únicamente sospechas del detector NoSQL
    if (!signal || signal.type !== 'nosql.suspicion') return;

    const { score, threshold } = signal.data;
    const ip = signal.event?.request?.ip;
    const path = signal.event?.request?.path;

    logger?.debug?.(`[NoSQL ANALYZER] Evaluación: Score ${score} / Threshold ${threshold} en ${path}`);

    // 2. Verificación del umbral (Threshold)
    if (score >= threshold) {
      logger?.warn?.(`[NoSQL ANALYZER] ¡Amenaza NoSQL confirmada! IP: ${ip} | Score: ${score}`);

      // 3. Emitimos la señal de amenaza definitiva
      bus.emit(createSignal({
        type: 'threat.nosql_injection', // Esta es la señal que busca la política en el config
        level: 'high',
        source: 'noSqlInjectionAnalyzer',
        event: signal.event,
        data: {
          score,
          threshold,
          ip,
          path
        }
      }));
    }
  };
}