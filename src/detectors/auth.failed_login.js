import { createSignal } from '../signals/createSignal.js';

export function createFailedLoginDetector({ bus }) {
  if (!bus) throw new Error('failedLoginDetector requires bus');

  return function failedLoginDetector(event) {
    if (!event || event.meta.ignored) return;

    const { request, response } = event;

    if (request.path !== '/login') return;
    if (request.method !== 'POST') return;
    if (response.statusCode !== 401) return;

    bus.emit(
      createSignal({
        type: 'auth.failed_login',
        level: 'low',
        source: 'failedLoginDetector',
        event,
        data: {
          ip: request.ip,
          path: request.path
        }
      })
    );

    console.log('[FAILED LOGIN]', request.ip);
  };
}
