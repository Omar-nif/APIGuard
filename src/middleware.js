import { createRequestEvent } from './events/requestEvent.js';
import generateRequestId from './utils/generateRequestId.js';

export default function createApiguard(options = {}) {
  const {
    log = true,
    slowThreshold = null,
    ignorePaths = [],
    onRequest = null,
    core = null
  } = options;

  return function apiGuardMiddleware(req, res, next) {
    const startTime = Date.now();
    const id = generateRequestId();
    const ignored = ignorePaths.includes(req.path);

    try {
      res.on('finish', () => {
        const duration = Date.now() - startTime;

        const requestEvent = createRequestEvent({
          id,
          startTime,
          duration,
          req,
          res,
          slowThreshold,
          ignored
        });

        if (core && typeof core.process === 'function') {
          core.process(requestEvent);
        }

        // Hook público
        if (typeof onRequest === 'function') {
          onRequest(requestEvent);
        }
        /*
        if (log && !ignored) {
          console.log('[APIGUARD]', requestEvent);
        }*/
      });

      next();
    } catch (error) {
      next();
    }
  };
}
