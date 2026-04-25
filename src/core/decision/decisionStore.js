import crypto from 'crypto';

export function createDecisionStore({ 
  cleanupInterval = 30_000,
  maxEntries = 5000 // Límite de seguridad para la RAM
} = {}) {
  const store = new Map();

  const ACTION_PRIORITY = {
    block: 4,
    rateLimit: 3,
    delay: 2,
    monitor: 1
  };

  function register(decision) {
    const key = buildKey(decision.match);

    // PROTECCIÓN DE MEMORIA:
    // Si el store está lleno y vamos a insertar una llave nueva
    if (store.size >= maxEntries && !store.has(key)) {
      // Estrategia: Eliminar la entrada más antigua (la primera del Map)
      const firstKey = store.keys().next().value;
      store.delete(firstKey);
    }

    store.set(key, {
      ...decision,
      expiresAt: Date.now() + decision.duration
    });
  }

  function isMatch(matchCriteria, requestContext) {
    const criteriaKeys = Object.keys(matchCriteria);
    if (criteriaKeys.length === 0) return false;
  
    return criteriaKeys.every(key => {
      // Forzamos a String y quitamos espacios por si acaso
      const criteriaVal = String(matchCriteria[key]).trim();
      const contextVal = String(requestContext[key] || '').trim();
  
      return criteriaVal === contextVal;
    });
  }
  
  function match(requestContext) {
    const now = Date.now();
    let bestDecision = null;
    let highestSpecificity = -1;
    let highestPriority = -1;

    const expiredKeys = [];

    // Iteramos el store
    for (const [key, decision] of store.entries()) {
      if (decision.expiresAt <= now) {
        expiredKeys.push(key);
        continue;
      }

      if (isMatch(decision.match, requestContext)) {
        const specificity = Object.keys(decision.match).length;
        const priority = ACTION_PRIORITY[decision.action] ?? 0;

        if (
          specificity > highestSpecificity ||
          (specificity === highestSpecificity && priority > highestPriority)
        ) {
          highestSpecificity = specificity;
          highestPriority = priority;
          bestDecision = decision;
        }
      }
    }

    // Limpieza de expirados encontrada durante el match
    expiredKeys.forEach(k => store.delete(k));

    return bestDecision;
  }

  function cleanup() {
    const now = Date.now();
    for (const [key, decision] of store.entries()) {
      if (decision.expiresAt <= now) store.delete(key);
    }
  }

  function startCleanupLoop() {
    const timer = setInterval(cleanup, cleanupInterval);
    if (timer.unref) timer.unref();
  }

  startCleanupLoop();

  return { register, match };
}