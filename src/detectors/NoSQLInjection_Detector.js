import { createSignal } from "../signals/createSignal.js";
import { NOSQL_PATTERNS } from "../utils/nosqlPatterns.js";

export function createNoSQLInjectionDetector({ bus, config }) {
  const settings = config?.security?.detectors?.noSqlInjection;
  if (!settings?.enabled) return () => {};

  const { 
    excludeFields = [],
    maxDepth = 5,
    maxKeys = 100 
  } = settings;

  // Helper para análisis de strings (evitamos redundancia)
  function analyzeString(str) {
    if (!str || str.length < 2) return 0;
    let score = 0;
    for (let i = 0; i < NOSQL_PATTERNS.length; i++) {
      if (NOSQL_PATTERNS[i].regex.test(str)) {
        score += NOSQL_PATTERNS[i].score;
      }
    }
    return score;
  }

  // scanObject optimizado: una sola pasada por el árbol
  function scanObject(obj, depth = 0, state = { count: 0 }) {
    if (!obj || typeof obj !== 'object' || depth > maxDepth || state.count >= maxKeys) {
      return 0;
    }

    let score = 0;

    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
      if (excludeFields.includes(key)) continue;
      
      state.count++;
      if (state.count >= maxKeys) break;

      // 1. Detectar operadores en la LLAVE (ej. $ne, $gt, o id[$gt])
      if (key.includes('$')) {
        score += 15; // Los operadores en llaves son altamente sospechosos
      }

      const value = obj[key];

      // 2. Analizar el VALOR
      if (value && typeof value === 'object') {
        // En NoSQL, si el valor es un objeto, revisamos sus llaves recursivamente
        score += scanObject(value, depth + 1, state);
      } else if (typeof value === 'string') {
        score += analyzeString(value);
      }
    }

    return score;
  }

  return function noSqlInjectionDetector(signal) {
    try {
      if (!signal || signal.type !== 'request') return;

      const { query, body } = signal.event.request;
      let totalRequestScore = 0;

      // Análisis rápido inicial: Stringify global (OPCIONAL pero eficiente)
      // En lugar de stringify en cada paso, lo hacemos una vez por sección
      if (settings.checkQuery && query) {
        const queryStr = JSON.stringify(query);
        totalRequestScore += analyzeString(queryStr);
        // Si el stringify no fue suficiente, entramos al análisis estructural
        totalRequestScore += scanObject(query, 0, { count: 0 });
      }

      if (settings.checkBody && body) {
        const bodyStr = JSON.stringify(body);
        totalRequestScore += analyzeString(bodyStr);
        totalRequestScore += scanObject(body, 0, { count: 0 });
      }

      if (totalRequestScore > 0) {
        const suspicion = createSignal({
          type: 'nosql.suspicion',
          source: 'noSqlInjectionDetector',
          event: signal.event,
          data: {
            score: totalRequestScore,
            threshold: settings.threshold || 20
          }
        });

        setImmediate(() => {
          try { bus.emit(suspicion); } catch (e) {}
        });
      }
    } catch (err) {
      // Fail-Open
    }
  };
}