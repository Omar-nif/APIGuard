import { createSignal } from "../signals/createSignal.js";

export function createExpensiveEndpointDetector({ bus, config, logger }) {
  
  const settings = config?.security?.detectors?.dos?.expensiveEndpoints;
  
  if (!settings?.enabled || !settings?.endpoints?.length) {
    return () => {};
  }

  const { endpoints } = settings;

  return function expensiveEndpointDetector(signal) {
    // Solo nos interesan las peticiones HTTP iniciales
    console.log("DETECTOR RECIBIÓ SEÑAL:", signal.type);
    if (!signal || signal.type !== 'request') return;

    const { path, method } = signal.event.request;

    // Verificamos si el path actual es uno de los marcados como "costosos"
    if (endpoints.includes(path)) {
      
      logger?.debug?.(`[EXPENSIVE DETECTOR] Match found for ${path}`);

      // Emitimos una señal de "acceso a recurso costoso" 
      // Esta es la señal que el Analizador estará esperando.
      bus.emit(createSignal({
        type: 'dos.expensive_access',
        source: 'expensiveEndpointDetector',
        event: signal.event, // Pasamos el evento original (IP, headers, etc.)
        data: {
          path,
          method
        }
      }));
    }
  };
}