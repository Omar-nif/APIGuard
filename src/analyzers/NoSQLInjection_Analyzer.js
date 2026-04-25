import { createSignal } from "../signals/createSignal.js";

export function createNoSQLInjectionAnalyzer({ bus }) {
  
  return function noSqlInjectionAnalyzer(signal) {
    // 1. Escuchamos únicamente sospechas del detector NoSQL
    if (!signal || signal.type !== 'nosql.suspicion') return;

    const { score, threshold } = signal.data;
    const ip = signal.event?.request?.ip;
    const path = signal.event?.request?.path;

    // 2. Verificación del umbral (Threshold)
    if (score >= threshold) {

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