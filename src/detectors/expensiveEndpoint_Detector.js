import { createSignal } from "../signals/createSignal.js";

export function createExpensiveEndpointDetector({ bus, config }) {
  const settings = config?.security?.detectors?.dos?.expensiveEndpoints;
  
  if (!settings?.enabled || !settings?.endpoints?.length) {
    return () => {};
  }

  const { endpoints } = settings;

  return function expensiveEndpointDetector(signal) {
    try {
      if (!signal || signal.type !== 'request') return;

      const { path, method } = signal.event.request;

      // Verificamos si el path actual es uno de los marcados como "costosos"
      if (endpoints.includes(path)) {
        // Emitimos asíncronamente para no retrasar el inicio del procesamiento del request
          try {
            bus.emit(createSignal({
              type: 'dos.expensive_access',
              source: 'expensiveEndpointDetector',
              event: signal.event,
              data: { path, method }
            }));
          } catch (e) {}
      }
    } catch (err) {
      // Fail-Open
    }
  };
}