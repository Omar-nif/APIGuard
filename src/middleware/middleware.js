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
    try {
      const startTime = Date.now();
      const id = generateRequestId();

      // 1. PRE-CHECK: Si falla el store, dejamos pasar (Fail-Open)
      let decision;
      try {
        decision = decisionStore.match({ ip: req.ip, path: req.path });
      } catch (err) {
        // Error interno de APIGuard, seguimos adelante sin bloquear
        return next();
      }

      if (decision) return applyDecision({ decision, req, res, next });

      // 2. ANALISIS DE INTRUSIÓN
      // Envolvemos onRequest en un try/catch para que un error en un detector
      // no detenga la petición del cliente.
      try {
        const immediateEvent = createRequestEvent({
          id, startTime, duration: 0, req, res, ignored: false, stage: 'request'
        });
        onRequest(immediateEvent);
      } catch (e) { /* Error silencioso: la seguridad falló, pero la API sigue viva */ }

      // 3. ANALISIS POST-RESPONSE
      res.on('finish', () => {
        try {
          const duration = Date.now() - startTime;
          const finalEvent = createRequestEvent({
            id, startTime, duration, req, res, 
            ignored: config.http?.ignorePaths?.includes(req.path),
            stage: 'response' 
          });
          onRequest(finalEvent); 
        } catch (e) { /* Ignoramos errores en la fase de respuesta */ }
      });

      next();
    } catch (globalError) {
      // ÚLTIMA LÍNEA DE DEFENSA: Si todo falla, next() asegura que la API responda.
      next();
    }
  };
}