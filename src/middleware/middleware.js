import { createRequestEvent } from '../events/requestEvent.js';
import  generateRequestId  from '../utils/generateRequestId.js';
import { applyDecision } from '../core/decision/applyDecision.js';

export default function createApiguardMiddleware({ 
  onRequest, 
  config,
  decisionStore
}) {
  if (typeof onRequest !== 'function') {
    throw new Error('[APIGuard] onRequest callback is required');
  }

  if (!decisionStore) {
    throw new Error('[APIGuard] decisionStore is required');
  }

  const {
    ignorePaths = [],
    slowThreshold = null
  } = config.http || {};

  return function apiGuardMiddleware(req, res, next) {
    const startTime = Date.now();
    const id = generateRequestId();
    const ignored = ignorePaths.includes(req.path);

    //  PRE-CHECK (antes de continuar)
    const decision = decisionStore.match({
      ip: req.ip,
      path: req.path
    });

    if (decision) {
      return applyDecision({
        decision, 
        req, 
        res, 
        next
      });
    }

    // POST ANALYSIS 
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

      onRequest(requestEvent);
    });

    next();
  };
}