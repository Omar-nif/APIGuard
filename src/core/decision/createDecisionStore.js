export function createDecisionStore({ cleanupInterval = 30_000 } = {}) {
  const store = new Map();

  function register(decision) {
    const key = buildKey(decision);

    store.set(key, {
      ...decision,
      expiresAt: Date.now() + decision.duration
    });
  }

  function match({ ip, path }) {
    const now = Date.now();

    for (const [key, decision] of store.entries()) {
      if (decision.expiresAt <= now) {
        store.delete(key);
        continue;
      }

      if (decision.scope === 'ip' && decision.ip === ip) {
        return decision;
      }

      if (
        decision.scope === 'ip+path' &&
        decision.ip === ip &&
        decision.path === path
      ) {
        return decision;
      }
    }

    return null;
  }

  function cleanup() {
    const now = Date.now();

    for (const [key, decision] of store.entries()) {
      if (decision.expiresAt <= now) {
        store.delete(key);
      }
    }
  }

  function startCleanupLoop() {
    setInterval(cleanup, cleanupInterval).unref();
  }

  startCleanupLoop();

  return {
    register,
    match
  };
}

function buildKey(decision) {
  if (decision.scope === 'ip') {
    return `ip:${decision.ip}`;
  }

  if (decision.scope === 'ip+path') {
    return `ip:${decision.ip}:path:${decision.path}`;
  }

  return crypto.randomUUID();
}