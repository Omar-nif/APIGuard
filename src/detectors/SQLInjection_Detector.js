import { createSignal } from "../signals/createSignal.js";
import { SQL_PATTERNS } from "../utils/sqlPatterns.js"; 

export function createSQLInjectionDetector({ bus, config }) {
  const settings = config?.security?.detectors?.sqlInjection;
  if (!settings?.enabled) return () => {};

  const { 
    excludeFields = [], 
    maxDepth = 5, // Evita recursión infinita
    maxKeys = 100 // Evita escaneos de objetos masivos
  } = settings;

  // Pre-check para no iterar si no hay patrones
  if (!Array.isArray(SQL_PATTERNS) || SQL_PATTERNS.length === 0) return () => {};

  function analyzeValue(value) {
    if (typeof value !== 'string' || value.length < 3) return 0;
    
    let totalScore = 0;
    // Usamos un bucle for tradicional para mayor velocidad
    for (let i = 0; i < SQL_PATTERNS.length; i++) {
      const pattern = SQL_PATTERNS[i];
      if (pattern.regex.test(value)) {
        totalScore += pattern.score;
      }
    }
    return totalScore;
  }

  // scanObject ahora tiene límite de profundidad y cantidad de llaves
  function scanObject(obj, depth = 0, processedKeys = { count: 0 }) {
    if (depth > maxDepth || processedKeys.count >= maxKeys) return 0;
    
    let score = 0;
    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
      if (excludeFields.includes(key)) continue;

      processedKeys.count++;
      const value = obj[key];

      if (value && typeof value === 'object') {
        score += scanObject(value, depth + 1, processedKeys);
      } else if (value !== null && value !== undefined) {
        score += analyzeValue(String(value));
      }

      if (processedKeys.count >= maxKeys) break;
    }
    return score;
  }

  return function sqlInjectionDetector(signal) {
    try {
      if (!signal || signal.type !== 'request') return;

      const { query, body } = signal.event.request;
      let totalRequestScore = 0;

      // Reset de contador por cada request
      if (settings.checkQuery && query) {
        totalRequestScore += scanObject(query, 0, { count: 0 });
      }
      if (settings.checkBody && body) {
        totalRequestScore += scanObject(body, 0, { count: 0 });
      }

      if (totalRequestScore > 0) {
        const suspicionSignal = createSignal({
          type: 'sqli.suspicion',
          source: 'sqlInjectionDetector',
          event: signal.event,
          data: {
            score: totalRequestScore,
            threshold: settings.threshold || 20
          }
        });

        // Emisión asíncrona
        setImmediate(() => {
          try {
            bus.emit(suspicionSignal);
          } catch (e) {}
        });
      }
    } catch (err) {
      // Fail-Open: Si el escaneo falla por estructura compleja, no tiramos la app.
    }
  };
}