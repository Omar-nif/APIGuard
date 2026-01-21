/*
Del RequestEvent solo trabajaremos con:

event.response.statusCode
event.meta.ignored
event.request.path

*/

import { createSignal } from '../signals/createSignal.js';

export function createNotFoundDetector({ bus }) {
  if (!bus) {
    throw new Error('notFoundDetector requires a signal bus');
  }

  return function notFoundDetector(event) {
    if (!event || event.meta.ignored) return;

    const { response, request } = event;

    if (response.statusCode !== 404) return;

    bus.emit(
      'signal',
      createSignal({
        type: 'not-found',
        source: 'notFoundDetector',
        context: {
          ip: request.ip,
          path: request.path,
          method: request.method
        }
      })
    );
    console.log(
      '[NOT FOUND CHECK]',
      event.response.statusCode,
      event.request.path
    );
    
  };
}
