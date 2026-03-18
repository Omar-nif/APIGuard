import { createSignal } from "../signals/createSignal.js";
import { NOSQL_PATTERNS } from "../utils/nosqlPatterns.js";

export function createNoSQLInjectionDetector({ bus, config, logger }) {
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
        logger?.debug?.(`[NoSQL DETECTOR] Match: ${pattern.name} (+${pattern.score})`);
      }
    });

    return totalScore;
  }

  function scanObject(obj) {
    let score = 0;
    if (!obj || typeof obj !== 'object') return 0;

    for (const key in obj) {
      if (excludeFields.includes(key)) continue;

      // 1. REVISAR LA LLAVE: Ahora buscamos el $ en cualquier posición
      // Esto atrapa "id[$ne]" y también "$gt"
      if (key.includes('$')) {
        score += 10; 
        logger?.debug?.(`[NoSQL DETECTOR] Operador detectado en llave: ${key}`);
      }

      const value = obj[key];

      // 2. REVISAR EL VALOR
      if (typeof value === 'object' && value !== null) {
        // Si el valor es un objeto, lo escaneamos recursivamente
        score += scanObject(value);
        
        // Además, analizamos el objeto convertido a string por si tiene
        // patrones sospechosos en su estructura JSON
        score += analyzeValue(value);
      } else {
        score += analyzeValue(value);
      }
    }
    return score;
  }

  return function noSqlInjectionDetector(signal) {
    if (!signal || signal.type !== 'request' || signal.event.stage !== 'request') return;

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