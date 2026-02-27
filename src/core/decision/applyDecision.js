export function applyDecision({ decision, req, res, next, logger }) {
    const action = decision?.action ?? 'allow';
  
    if (action === 'block') {
      logger?.warn?.('Request blocked', {
        ip: req.ip,
        reason: decision.reason
      });
  
      return res.status(403).json({
        error: 'Forbidden',
        reason: decision.reason ?? 'Blocked by security policy'
      });
    }
  
    if (action === 'monitor') {
      logger?.info?.('Request monitored', {
        ip: req.ip,
        reason: decision.reason
      });
    }
  
    // allow o monitor continúan normalmente
    return next();
  }