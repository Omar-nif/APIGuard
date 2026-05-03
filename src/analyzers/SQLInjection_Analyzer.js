import { createSignal } from "../signals/createSignal.js";

export function createSQLInjectionAnalyzer({ bus }) {
  if (!bus) throw new Error('sqlInjectionAnalyzer requires bus');

  return function sqlInjectionAnalyzer(signal) {
    try {
      // 1. Filtrado rápido
      if (!signal || signal.type !== 'sqli.suspicion') return;

      const { score, threshold } = signal.data;
      const ip = signal.event?.request?.ip || signal.data?.ip;

      // 2. Evaluación lógica
      // Si el puntaje de la petición actual es suficiente para considerarla amenaza
      if (score >= threshold) {
        
        const threatSignal = createSignal({
          type: 'threat.sql_injection',
          level: 'high', 
          source: 'sqlInjectionAnalyzer',
          event: signal.event,
          data: {
            score,
            threshold,
            ip
          }
        });


          try {
            bus.emit(threatSignal);
          } catch (e) { /* Error silencioso en el bus */ }
      }
    } catch (err) {
      // Fail-Safe: Si el analizador explota, no hacemos nada y dejamos que la petición siga.
      // Es mejor dejar pasar un ataque que tumbar el servidor por un error de código.
    }
  };
}