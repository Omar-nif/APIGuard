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
