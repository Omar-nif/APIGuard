const ACTION_HANDLERS = {
  block({ decision, req, res, logger }) {
    logger?.warn?.('Request blocked', {
      ip: req.ip,
      reason: decision.reason
    });

    res.setHeader('X-Apiguard-Action', 'block');
    // Opcional: indicar cuánto tiempo durará el bloqueo
    res.setHeader('X-Apiguard-Duration', decision.duration);

    return res.status(403).json({
      error: 'Forbidden',
      reason: decision.reason ?? 'Blocked by security policy'
    });
  },

  monitor({ req, logger, next }) {
    logger?.info?.('Request monitored', { ip: req.ip });
    return next();
  },

  delay({ decision, req, res, next, logger }) {
    const delayConfig = decision.delay ?? { min: 500, max: 2000 };

    if (!decision._state) {
      decision._state = { hits: 0 };
    }

    decision._state.hits++;

    const { min, max } = delayConfig;
    // Escalado de delay basado en hits (máximo tras 10 hits)
    const progress = Math.min(decision._state.hits / 10, 1);
    let delay = Math.floor(min + (max - min) * progress);
    
    // Añadimos jitter para evitar ataques de timing precisos
    delay += Math.random() * 200;

    logger?.warn?.('Request delayed', {
      ip: req.ip,
      delay: Math.round(delay),
      hits: decision._state.hits
    });

    res.setHeader('X-Apiguard-Action', 'delay');
    res.setHeader('X-Apiguard-Delay', Math.round(delay));

    // PROTECCIÓN: Si el cliente cierra la conexión, no disparamos el timeout innecesariamente
    const timer = setTimeout(() => {
      if (!res.writableEnded) {
        next();
      }
    }, delay);

    req.on('close', () => clearTimeout(timer));
  },

  rateLimit({ decision, req, res, next, logger }) {
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
      logger?.warn?.('Rate limit exceeded', { ip: req.ip, count: state.count });

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

export function applyDecision({ decision, req, res, next, logger }) {
  // Si no hay decisión o la decisión ha expirado, permitimos pasar
  if (!decision || (decision.expiresAt && decision.expiresAt < Date.now())) {
    return next();
  }

  const handler = ACTION_HANDLERS[decision.action];

  if (handler) {
    return handler({ decision, req, res, next, logger });
  }

  return next();
}
