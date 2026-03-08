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

    /*---------------------------------------------------------------------
      PRE-CHECK: se consulta la decisionStore antes de procesar la request 
      para bloquear lo antes posible si ya hay una decision que aplica
    */
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
//-------------------------------------------------------------------------
    /* POST ANALYSIS: se crea el evento de request al finalizar 
    la respuesta para tener toda la información disponible */
    res.on('finish', () => {
      const duration = Date.now() - startTime;
//-------------------------------------------------------------------------
/*Se crea el evento de request con toda la información relevante para 
el análisis. Se manda el evento normalizado ya que req por si solo es enorme
*/
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
//-------------------------------------------------------------------------
    next();
  };
}