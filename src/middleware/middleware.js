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
      const context = { ip: req.ip, path };

      /* ---------------------------------------------------------
         1. PRE-CHECK (Bloqueo por historial)
         --------------------------------------------------------- */
      try {
        const decision = decisionStore.match(context);
        if (decision) {
          return applyDecision({ decision, req, res, next });
        }
      } catch (err) {
      }

      /* ---------------------------------------------------------
         2. ANÁLISIS DE ENTRADA (Detección en tiempo real)
         --------------------------------------------------------- */
      try {
        const immediateEvent = createRequestEvent({
          id, startTime, duration: 0, req, res, 
          ignored: ignorePaths.includes(path), 
          stage: 'request'
        });

        onRequest(immediateEvent);

        const immediateDecision = decisionStore.match(context);
        if (immediateDecision && immediateDecision.action === 'block') {
          return applyDecision({ decision: immediateDecision, req, res, next });
        }
      } catch (e) { /* Fail-Open */ }

      /* ---------------------------------------------------------
         3. ANÁLISIS POST-RESPONSE (Aprendizaje)
         --------------------------------------------------------- */
      res.on('finish', () => {
        //console.log(`[DEBUG] Respuesta terminada. Status: ${res.statusCode} | Path: ${req.path}`);
        try {
          const duration = Date.now() - startTime;
          const finalEvent = createRequestEvent({
            id, startTime, duration, req, res, 
            ignored: ignorePaths.includes(path),
            stage: 'response' 
          });
          
          onRequest(finalEvent); 
        } catch (e) { /* Fail-Open */ }
      });

      // Si llegamos aquí, la petición es segura para continuar a la API
      next();

    } catch (globalError) {
      console.error('[APIGuard] Global Middleware Error:', globalError);
      next();
    }
  };
}