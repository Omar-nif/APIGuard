import createApiguardMiddleware from './middleware.js';
import { createApiguardCore } from './core/apiguardCore.js';
import { loadConfig } from './config/loadConfig.js';

export default function apiguard(userConfig = {}) {
  // 1. Resolver config
  const config = loadConfig(userConfig);

  // 2. Crear core
  const core = createApiguardCore(config);

  // 3. Crear middleware
  return createApiguardMiddleware({
    config,
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