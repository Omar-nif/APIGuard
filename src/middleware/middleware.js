import { createRequestEvent } from '../events/requestEvent.js';
import generateRequestId from '../utils/generateRequestId.js';
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
    ignorePaths = []
  } = config.http || {};

  return function apiGuardMiddleware(req, res, next) {
    try {
      const startTime = Date.now();
      const id = generateRequestId();
      const path = req.path;

      // 1. PRE-CHECK: Bloqueo inmediato si ya existe una decisión.
      try {
        const decision = decisionStore.match({ ip: req.ip, path });
        if (decision) {
          return applyDecision({ decision, req, res, next });
        }
      } catch (err) {
        // Fail-Open: Si falla el store, no detenemos la API.
        console.error('[APIGuard] DecisionStore Match Error:', err);
      }

      // 2. ANÁLISIS DE ENTRADA (Stage: request)
      try {
        const immediateEvent = createRequestEvent({
          id, 
          startTime, 
          duration: 0, 
          req, 
          res, 
          ignored: ignorePaths.includes(path), 
          stage: 'request'
        });
        onRequest(immediateEvent);
      } catch (e) { /* Fail-Open */ }

      res.on('finish', () => {
        try {
          const duration = Date.now() - startTime;
          const finalEvent = createRequestEvent({
            id, 
            startTime, 
            duration, 
            req, 
            res, 
            ignored: ignorePaths.includes(path),
            stage: 'response' 
          });
          
          onRequest(finalEvent); 
        } catch (e) { /* Fail-Open */ }
      });

      next();
    } catch (globalError) {
      // ÚLTIMA LÍNEA DE DEFENSA
      console.error('[APIGuard] Global Middleware Error:', globalError);
      next();
    }
  };
}