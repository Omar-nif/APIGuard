const ACTION_HANDLERS = {

  // -------------------- Bloqueo de ip ---------------------
  block({ decision, req, res, logger }) {
    logger?.warn?.('Request blocked', {
      ip: req.ip,
      reason: decision.reason
    });

    res.setHeader('X-Apiguard-Action', 'block');

    return res.status(403).json({
      error: 'Forbidden',
      reason: decision.reason ?? 'Blocked by security policy'
    });
  },

  monitor({ decision, req, logger, next }) {
    logger?.info?.('Request monitored', {
      ip: req.ip,
      reason: decision.reason
    });

    return next();
  },
// ---------------------------------------------------------------
// --------------- Retraso progresivo con jitter -----------------
  delay({ decision, req, res, next, logger }) {

    const delayConfig = decision.delay ?? { min: 500, max: 2000 };

    // estado interno de la decision
    if (!decision._state) {
      decision._state = { hits: 0 };
    }

    decision._state.hits++;

    const { min, max } = delayConfig;

    // progresión suave
    const progress = Math.min(decision._state.hits / 10, 1);

    let delay = Math.floor(
      min + (max - min) * progress
    );

    // pequeño jitter aleatorio
    const jitter = Math.random() * 200;
    delay += jitter;

    logger?.warn?.('Request delayed', {
      ip: req.ip,
      delay,
      hits: decision._state.hits,
      reason: decision.reason
    });

    res.setHeader('X-Apiguard-Action', 'delay');

    setTimeout(() => {
      next();
    }, delay);
  }

};
// -----------------------------------------------------

export function applyDecision({ decision, req, res, next, logger }) {
  const action = decision?.action ?? 'allow';

  const handler = ACTION_HANDLERS[action];

  if (handler) {
    return handler({ decision, req, res, next, logger });
  }

  return next();
}