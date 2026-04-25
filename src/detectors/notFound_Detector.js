import { createSignal } from '../signals/createSignal.js';

export function createNotFoundDetector({ bus }) {
  if (!bus) {
    throw new Error('notFoundDetector requires a signal bus');
  }

  return function notFoundDetector(signal) {
    // Fail-Safe: try/catch para asegurar que un error de datos no tire la API
    try {
      if (!signal || signal.type !== 'request') return;

      const event = signal.event;
      // Si la ruta está en la lista de ignorados, no perdemos tiempo
      if (!event || event.meta?.ignored) return;

      const { response, request } = event;

      // Verificación segura del status code
      if (!response || response.statusCode !== 404) return;

      // Creamos la señal de sospecha
      const notFoundSignal = createSignal({
        type: 'endpoint.not_found',
        level: 'low', // Es una sospecha baja por sí sola
        source: 'notFoundDetector',
        event,
        data: {
          path: request.path,
          statusCode: response.statusCode
        }
      });

      // ⚡ Asincronía: Emitimos fuera del hilo principal
      setImmediate(() => {
        try {
          bus.emit(notFoundSignal);
        } catch (e) {
          // Error en el bus ignorado
        }
      });
    } catch (err) {
      // Fail-Open: Si el detector falla, el usuario sigue recibiendo su 404 normalmente
    }
  };
}