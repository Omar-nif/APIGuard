import createApiguardMiddleware from './middleware.js';
import { createApiguardCore } from './core/apiguardCore.js';

export default function apiguard(options = {}) {
  const core = createApiguardCore(options);

  return createApiguardMiddleware({
    ...options,
    onRequest(event) {
      core.process(event);
    }
  });
}

/* --------------- V1 ---------------------------------------
import createApiguardMiddleware from './middleware.js';
import { createApiguardCore } from './core/apiguardCore.js';

export default function createApiguard(options = {}) {
  const core = createApiguardCore();

  return createApiguardMiddleware({
    ...options,
    onRequest: event => {
      core.process(event);
    }
  });
}
*/