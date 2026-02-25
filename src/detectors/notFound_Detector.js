
import { createSignal } from '../signals/createSignal.js';


export function createNotFoundDetector({ bus }) {
  if (!bus) {
    throw new Error('notFoundDetector requires a signal bus');
  }

  return function notFoundDetector(signal) {
    if (!signal || signal.type !== 'request') return;
  
    const event = signal.event;
  
    if (event.meta?.ignored) return;
  
    const { response } = event;
  
    if (response.statusCode !== 404) return;
  
    bus.emit(
      createSignal({
        type: 'path.not_found',
        level: 'low',
        source: 'notFoundDetector',
        event,
        data: {
          path: event.request.path,
          statusCode: response.statusCode
        }
      })
    );
  };
}
