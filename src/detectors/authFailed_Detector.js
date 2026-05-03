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
      if (!event || event.stage !== 'response') return;

      const { request, response } = event;
      if (!request || !response) return;

      if (!authPaths.includes(request.path)) return;
      //if (!methods.includes(request.method)) return;
      if (!failureStatusCodes.includes(response.statusCode)) return;

      // Extracción segura de datos
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

      bus.emit(authSignal);

    } catch (err) {
    }
  };
}