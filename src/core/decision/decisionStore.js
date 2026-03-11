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
    block: 4,
    rateLimit: 3,
    delay: 2,
    monitor: 1
  };
// ----------------- Match -----------------------------------
/**
 * Evalúa el contexto de la petición contra las decisiones almacenadas
 * para encontrar la acción de seguridad más relevante.
 */
function match(requestContext) {
  const now = Date.now();
  let bestDecision = null;
  let highestSpecificity = -1;
  let highestPriority = -1;

  // Usamos una lista de llaves para borrar después y no mutar el Map durante la iteración
  const expiredKeys = [];

  for (const [key, decision] of store.entries()) {
    // 1. Gestión de expiración
    if (decision.expiresAt <= now) {
      expiredKeys.push(key);
      continue;
    }

    // 2. Lógica de coincidencia mejorada
    // Pasamos el contexto de la request para ver si encaja con los criterios guardados
    if (isMatch(decision.match, requestContext)) {
      
      // La especificidad es cuántos campos coinciden (ej: IP + Path = 2, solo IP = 1)
      const specificity = Object.keys(decision.match).length;
      const priority = ACTION_PRIORITY[decision.action] ?? 0;

      // 3. Selección de la "mejor" decisión:
      // Priorizamos lo más específico (ej. bloquear un path es más específico que bloquear la IP)
      // Si tienen la misma especificidad, priorizamos la acción más severa (ej. block > delay)
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

  // Limpiamos los expirados encontrados en este ciclo
  expiredKeys.forEach(key => store.delete(key));

  return bestDecision;
}

/**
 * Nueva lógica unidireccional:
 * Verifica que los datos presentes en el contexto coincidan con los criterios guardados.
 */
function isMatch(matchCriteria, requestContext) {
  const contextKeys = Object.keys(requestContext);
  
  // Si no hay contexto (IP o Path), no podemos matchear nada
  if (contextKeys.length === 0) return false;

  // Validamos que CADA dato del contexto de la petición coincida con el criterio guardado
  // Esto permite que si buscamos por {ip: '1.1.1.1'}, coincida con un registro 
  // de {ip: '1.1.1.1', path: '/admin'}
  return contextKeys.every(key => {
    return matchCriteria[key] === requestContext[key];
  });
}
// ----------------------------------------------------------
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