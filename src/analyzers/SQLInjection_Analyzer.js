import { createSignal } from "../signals/createSignal.js";

export function createSQLInjectionAnalyzer({ bus, logger }) {
  
  return function sqlInjectionAnalyzer(signal) {
    // Escuchamos únicamente las sospechas del detector de SQLi
    if (!signal || signal.type !== 'sqli.suspicion') return;

    const { score, threshold } = signal.data;
    const ip = signal.event?.request?.ip;

    logger?.debug?.(`[SQLi ANALYZER] Evaluando sospecha: Score ${score} / Threshold ${threshold}`);

    // Si el puntaje acumulado en esta petición supera el límite configurado
    if (score >= threshold) {
      logger?.warn?.(`[SQLi ANALYZER] ¡Amenaza detectada! IP: ${ip} alcanzó un score de ${score}`);

      // Emitimos la señal de amenaza definitiva que el Engine capturará
      bus.emit(createSignal({
        type: 'threat.sql_injection',
        level: 'high', // Prioridad alta para bloqueo inmediato
        source: 'sqlInjectionAnalyzer',
        event: signal.event,
        data: {
          score,
          threshold,
          ip
        }
      }));
    }
  };
}