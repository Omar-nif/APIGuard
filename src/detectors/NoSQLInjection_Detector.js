import { createSignal } from "../signals/createSignal.js";
import { NOSQL_PATTERNS } from "../utils/nosqlPatterns.js";

export function createNoSQLInjectionDetector({ bus, config }) {
  const settings = config?.security?.detectors?.noSqlInjection;

  if (!settings?.enabled) return () => {};

  const { excludeFields = [] } = settings;

  /**
   * Analiza un valor individual. 
   * A diferencia de SQL, aquí también revisamos si el "valor" es en realidad
   * un objeto que contiene llaves prohibidas (como $ne, $gt).
   */
  function analyzeValue(value) {
    let totalScore = 0;
    let stringToTest = "";

    if (typeof value === 'object' && value !== null) {
      // Si el valor es un objeto, lo convertimos a string para ver si tiene operadores
      stringToTest = JSON.stringify(value);
    } else {
      stringToTest = String(value);
    }

    NOSQL_PATTERNS.forEach(pattern => {
      if (pattern.regex.test(stringToTest)) {
        totalScore += pattern.score;
      }
    });

    return totalScore;
  }

  function scanObject(obj) {
    let score = 0;
    if (!obj || typeof obj !== 'object') return 0;
  
    // Convertimos TODO el objeto a string de una vez para buscar operadores rápido
    const fullString = JSON.stringify(obj);
    NOSQL_PATTERNS.forEach(pattern => {
      if (pattern.regex.test(fullString)) {
        score += pattern.score;
      }
    });
  
    for (const key in obj) {
      if (excludeFields.includes(key)) continue;
  
      // Detectar operador en la llave (id[$ne] o $gt)
      if (key.includes('$')) {
        score += 10;
      }
  
      const value = obj[key];
      if (typeof value === 'object' && value !== null) {
        score += scanObject(value); // Seguimos bajando en el árbol
      }
    }
    return score;
  }

  return function noSqlInjectionDetector(signal) {
    //if (!signal || signal.type !== 'request' || signal.event.stage !== 'request') return;
    if (!signal || signal.type !== 'request') return;
    
    const { query, body } = signal.event.request;
    let totalRequestScore = 0;

    if (settings.checkQuery && query) totalRequestScore += scanObject(query);
    if (settings.checkBody && body) totalRequestScore += scanObject(body);

    if (totalRequestScore > 0) {
      bus.emit(createSignal({
        type: 'nosql.suspicion',
        source: 'noSqlInjectionDetector',
        event: signal.event,
        data: {
          score: totalRequestScore,
          threshold: settings.threshold
        }
      }));
    }
  };
}