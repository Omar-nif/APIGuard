import { createSignal } from "../signals/createSignal.js";
import { SQL_PATTERNS } from "../utils/sqlPatterns.js"; 

export function createSQLInjectionDetector({ bus, config }) {
  const settings = config?.security?.detectors?.sqlInjection;

  if (!settings?.enabled) return () => {};

  const { excludeFields = [] } = settings;

  function analyzeValue(value) {
    if (typeof value !== 'string') return 0;
    
    let totalScore = 0;
    // Usamos el diccionario importado
    SQL_PATTERNS.forEach(pattern => {
      if (pattern.regex.test(value)) {
        totalScore += pattern.score;
      }
    });
    return totalScore;
  }

  function scanObject(obj) {
    let score = 0;
    for (const key in obj) {
      if (excludeFields.includes(key)) continue;

      const value = obj[key];
      if (typeof value === 'object' && value !== null) {
        score += scanObject(value);
      } else {
        score += analyzeValue(String(value));
      }
    }
    return score;
  }

  return function sqlInjectionDetector(signal) {
    if (!signal || signal.type !== 'request') return;

    const { query, body } = signal.event.request;
    let totalRequestScore = 0;

    if (settings.checkQuery && query) totalRequestScore += scanObject(query);
    if (settings.checkBody && body) totalRequestScore += scanObject(body);

    if (totalRequestScore > 0) {
      bus.emit(createSignal({
        type: 'sqli.suspicion',
        source: 'sqlInjectionDetector',
        event: signal.event,
        data: {
          score: totalRequestScore,
          threshold: settings.threshold
        }
      }));
    }
  };
}
