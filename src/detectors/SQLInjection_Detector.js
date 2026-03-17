import { createSignal } from "../signals/createSignal.js";
import { SQL_PATTERNS } from "../utils/sqlPatterns.js"; // <--- Importación limpia

export function createSQLInjectionDetector({ bus, config, logger }) {
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
        logger?.debug?.(`[SQLi DETECTOR] Match: ${pattern.name} (+${pattern.score})`);
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

    console.log("DATOS RECIBIDOS EN DETECTOR:", signal.event.request.query);

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

/*
function analyzeValue(value) {
  // 1. Normalización: Forzamos string y decodificamos posibles ataques URL encodeados
  let strValue = "";
  try {
    strValue = decodeURIComponent(String(value));
  } catch (e) {
    strValue = String(value); // Si falla el decode, usamos el original
  }

  let totalScore = 0;
  
  for (const pattern of SQL_PATTERNS) {
    // 2. Usamos .test() directamente sobre el valor normalizado
    // Importante: No usar /g en el diccionario
    if (pattern.regex.test(strValue)) {
      totalScore += pattern.score;
      logger?.debug?.(`[SQLi DETECTOR] Match: ${pattern.name} in "${strValue}" (+${pattern.score})`);
    }
  }
  return totalScore;
}

function scanObject(obj) {
  let score = 0;
  if (!obj) return 0;

  // Manejamos Arrays explícitamente
  if (Array.isArray(obj)) {
    for (const item of obj) {
      score += (typeof item === 'object') ? scanObject(item) : analyzeValue(item);
    }
    return score;
  }

  for (const key in obj) {
    if (excludeFields.includes(key)) continue;

    const value = obj[key];
    if (typeof value === 'object' && value !== null) {
      score += scanObject(value); // Recursión para objetos anidados
    } else {
      score += analyzeValue(value);
    }
  }
  return score;
}
*/