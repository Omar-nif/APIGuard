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

    // 1. PRE-CHECK
    const decision = decisionStore.match({ ip: req.ip, path: req.path });
    if (decision) return applyDecision({ decision, req, res, next });

    /* ---------------------------------------------------------
       2. ANALISIS DE INTRUSIÓN (Fase: 'request')
       --------------------------------------------------------- */
    const immediateEvent = createRequestEvent({
      id,
      startTime,
      duration: 0,
      req,
      res,
      ignored: false,
      stage: 'request' // <--- NUEVO: Marcamos la fase inicial
    });

    onRequest(immediateEvent);


    const immediateDecision = decisionStore.match({ ip: req.ip, path: req.path });
    if (immediateDecision && immediateDecision.action === 'block') {
        return applyDecision({ decision: immediateDecision, req, res, next });
    }

    /* ---------------------------------------------------------
       3. ANALISIS POST-RESPONSE (Fase: 'response')
       --------------------------------------------------------- */
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const finalEvent = createRequestEvent({
        id,
        startTime,
        duration,
        req,
        res,
        ignored: config.http?.ignorePaths?.includes(req.path),
        stage: 'response' // <--- NUEVO: Marcamos la fase final
      });

      onRequest(finalEvent); 
    });

    next();
  };
}