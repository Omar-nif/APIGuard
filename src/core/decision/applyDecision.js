const ACTION_HANDLERS = {
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
  }
};

export function applyDecision({ decision, req, res, next, logger }) {
  const action = decision?.action ?? 'allow';

  const handler = ACTION_HANDLERS[action];

  if (handler) {
    return handler({ decision, req, res, next, logger });
  }

  return next();
}