import { createSignal } from '../signals/createSignal.js';

export function createAuthFailedDetector({ bus, config }) {
  if (!bus) throw new Error('authFailedDetector requires bus');

  const bruteForce = config.security?.detectors?.bruteForce;
  if (!bruteForce?.enabled) return () => {};

  const {
    authPaths = [],
    methods = ['POST'],
    failureStatusCodes = [401, 403]
  } = bruteForce;

  return function authFailedDetector(signal) {
    try {
      // 1. Filtrado rápido y eficiente
      if (!signal || signal.type !== 'request') return;

      const event = signal.event;
      if (!event || event.meta?.ignored) return;

      const { request, response } = event;
      if (!request || !response) return;

      // Verificaciones de corto circuito
      if (!authPaths.includes(request.path)) return;
      if (!methods.includes(request.method)) return;
      if (!failureStatusCodes.includes(response.statusCode)) return;

      // Extracción segura de datos del cuerpo (evitar errores si body es null/string)
      const username = request.body && typeof request.body === 'object' 
        ? (request.body.username || request.body.email || 'unknown') 
        : 'unknown';

      const authSignal = createSignal({
        type: 'auth.failed',
        level: 'low',
        source: 'authFailedDetector',
        event,
        data: {
          ip: request.ip,
          path: request.path,
          username,
          statusCode: response.statusCode
        }
      });

      // Asincronía: No retrasamos el flujo de la respuesta
      setImmediate(() => {
        try {
          bus.emit(authSignal);
        } catch (e) {
          // Error en el bus silenciado
        }
      });
    } catch (err) {
      // Fail-Open: Si el detector falla, la API sigue funcionando normalmente
    }
  };
}