const ACTION_HANDLERS = {
  block({ decision, res }) {
    res.setHeader('X-Apiguard-Action', 'block');
    res.setHeader('X-Apiguard-Duration', decision.duration);

    return res.status(403).json({
      error: 'Forbidden',
      reason: decision.reason ?? 'Blocked by security policy'
    });
  },

  monitor({ next }) {
    return next();
  },

  delay({ decision, req, res, next }) {
    const delayConfig = decision.delay ?? { min: 500, max: 2000 };

    if (!decision._state) {
      decision._state = { hits: 0 };
    }

    decision._state.hits++;

    const { min, max } = delayConfig;
    const progress = Math.min(decision._state.hits / 10, 1);
    let delay = Math.floor(min + (max - min) * progress);
    
    // Jitter para evitar análisis de timing
    delay += Math.random() * 200;

    res.setHeader('X-Apiguard-Action', 'delay');
    res.setHeader('X-Apiguard-Delay', Math.round(delay));

    const timer = setTimeout(() => {
      if (!res.writableEnded) {
        next();
      }
    }, delay);

    req.on('close', () => clearTimeout(timer));
  },

  rateLimit({ decision, res, next }) {
    const config = decision.rateLimit ?? { maxRequests: 10, windowMs: 1000 };

    if (!decision._rateState) {
      decision._rateState = {
        count: 0,
        windowStart: Date.now()
      };
    }

    const state = decision._rateState;
    const now = Date.now();

    if (now - state.windowStart > config.windowMs) {
      state.count = 0;
      state.windowStart = now;
    }

    state.count++;

    if (state.count > config.maxRequests) {
      res.setHeader('X-Apiguard-Action', 'rateLimit');
      res.setHeader('Retry-After', Math.ceil(config.windowMs / 1000));

      return res.status(429).json({
        error: 'Too Many Requests',
        retryAfter: `${Math.ceil(config.windowMs / 1000)}s`
      });
    }

    return next();
  }
};

export function applyDecision({ decision, req, res, next }) {
  // Si no hay decisión o expiró, seguimos adelante
  if (!decision || (decision.expiresAt && decision.expiresAt < Date.now())) {
    return next();
  }

  const handler = ACTION_HANDLERS[decision.action];

  if (handler) {
    return handler({ decision, req, res, next });
  }

  return next();
}