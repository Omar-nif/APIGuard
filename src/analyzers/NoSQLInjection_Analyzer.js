import { createSignal } from "../signals/createSignal.js";

export function createNoSQLInjectionAnalyzer({ bus }) {
  if (!bus) throw new Error('noSqlInjectionAnalyzer requires bus');

  return function noSqlInjectionAnalyzer(signal) {
    // Fail-Safe: Envolvemos en try/catch para que un error aquí
    // no interrumpa el flujo principal de la aplicación del usuario.
    try {
      // 1. Filtrado rápido de señales
      if (!signal || signal.type !== 'nosql.suspicion') return;

      const { score, threshold } = signal.data;
      const ip = signal.event?.request?.ip || signal.data?.ip;
      const path = signal.event?.request?.path || signal.data?.path;

      // 2. Verificación del umbral
      if (score >= threshold) {
        
        const threatSignal = createSignal({
          type: 'threat.nosql_injection',
          level: 'high',
          source: 'noSqlInjectionAnalyzer',
          event: signal.event,
          data: {
            score,
            threshold,
            ip,
            path
          }
        });

        // Asincronía: Emitimos fuera del tick actual para 
        // asegurar que la respuesta de la API sea la prioridad.
        setImmediate(() => {
          try {
            bus.emit(threatSignal);
          } catch (e) {
            // Error en el bus ignorado para mantener estabilidad
          }
        });
      }
    } catch (err) {
      // Si el análisis falla, el "Fail-Open" permite que la API siga viva.
    }
  };
}