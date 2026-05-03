export function createDecisionStore({ 
  cleanupInterval = 30_000,
  maxEntries = 5000 
} = {}) {
  const store = new Map();

  const ACTION_PRIORITY = {
    block: 4,
    rateLimit: 3,
    delay: 2,
    monitor: 1
  };

  // Función auxiliar para crear una llave consistente
  function buildKey(match) {
    // Si el match tiene IP y Path, la llave es "ip:path"
    // Si solo tiene IP, es "ip:"
    return `${match.ip || ''}:${match.path || ''}`;
  }

  function register(decision) {
    try {
      const key = buildKey(decision.match);

      if (store.size >= maxEntries && !store.has(key)) {
        const firstKey = store.keys().next().value;
        store.delete(firstKey);
      }

      store.set(key, {
        ...decision,
        expiresAt: Date.now() + decision.duration
      });
    } catch (e) {
      // Fail-open
    }
  }

  function match(requestContext) {
    const now = Date.now();
    const { ip, path } = requestContext;

    // 1. Buscar coincidencia específica (IP + Path)
    // 2. Buscar coincidencia general (Solo IP)
    const specificKey = `${ip}:${path}`;
    const generalKey = `${ip}:`;

    const candidates = [store.get(specificKey), store.get(generalKey)]
      .filter(d => d && d.expiresAt > now);

    if (candidates.length === 0) return null;

    // Si hay varios, elegimos por prioridad de acción
    return candidates.sort((a, b) => 
      (ACTION_PRIORITY[b.action] || 0) - (ACTION_PRIORITY[a.priority] || 0)
    )[0];
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