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
    if (!signal || signal.type !== 'request') return;

    const event = signal.event;
    if (!event || event.meta?.ignored) return;

    const { request, response } = event;

    if (!authPaths.includes(request.path)) return;
    if (!methods.includes(request.method)) return;
    if (!failureStatusCodes.includes(response.statusCode)) return;

    bus.emit(
      createSignal({
        type: 'auth.failed',
        level: 'low',
        source: 'authFailedDetector',
        event,
        data: {
          ip: request.ip,
          path: request.path,
          username: request.body?.username,
          statusCode: response.statusCode
        }
      })
    );
  };
}