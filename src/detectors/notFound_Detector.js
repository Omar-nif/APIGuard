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
      createSignal({
        type: 'path.not_found',
        level: 'low',
        source: 'notFoundDetector',
        event,
        data: {
          path: event.request.path,
          statusCode: event.response.statusCode
        }
      })
    );
    
    /*console.log(
      '[NOT FOUND CHECK]',
      event.response.statusCode,
      event.request.path
    );*/
    
  };
}
