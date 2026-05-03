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
      const event = signal.event;
      // 1. Solo actuamos en la fase de respuesta
      if (!event || event.stage !== 'response') return;

      const { request, response } = event;
      if (!request || !response) return;

      // 2. Verificaciones de corto circuito síncronas
      if (!authPaths.some(p => request.path === p)) return;
      if (methods.length > 0 && !methods.includes(request.method)) return;
      if (!failureStatusCodes.includes(response.statusCode)) return;

      // 3. Extracción de identidad 
      const username = request.body && typeof request.body === 'object' 
        ? (request.body.username || request.body.email || 'unknown') 
        : 'unknown';

      // 4. EMISIÓN SÍNCRONA
      // Como el bus es síncrono, para cuando esta línea termine, 
      // la decisión de bloqueo ya estará en el Store.
      bus.emit(createSignal({
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
      }));

    } catch (err) {
    }
  };
}