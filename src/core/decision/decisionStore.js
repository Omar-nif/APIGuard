import crypto from 'crypto';

export function createDecisionStore({ cleanupInterval = 30_000 } = {}) {
  const store = new Map();

  function register(decision) {
    const key = buildKey(decision.match);

    store.set(key, {
      ...decision,
      expiresAt: Date.now() + decision.duration
    });
  }

  const ACTION_PRIORITY = {
    block: 3,
    delay: 2,
    monitor: 1
  };

function match(requestContext) {
  const now = Date.now();
  let bestDecision = null;
  let highestSpecificity = -1;
  let highestPriority = -1;

  for (const [key, decision] of store.entries()) {
    if (decision.expiresAt <= now) {
      store.delete(key);
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

  return bestDecision;
}

  function isMatch(matchCriteria, requestContext) {
    return Object.entries(matchCriteria).every(
      ([key, value]) => requestContext[key] === value
    );
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

function buildKey(match) {
  const parts = Object.entries(match)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`);

  return parts.length > 0 ? parts.join('|') : crypto.randomUUID();
}