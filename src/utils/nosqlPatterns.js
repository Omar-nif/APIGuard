/**
 * Diccionario de firmas de NoSQL Injection (Específico para MongoDB/DocumentDB)
 * Enfocado en operadores de consulta y manipulación de lógica de objetos.
 */
export const NOSQL_PATTERNS = [
    { 
      // Operadores de comparación comunes ($ne, $gt, $regex, etc.)
      regex: /"\$(ne|gt|lt|gte|lte|in|nin|exists|not|mod|all|size|type|elemMatch|regex)"\s*:/i, 
      score: 10, 
      name: 'mongodb_operator_injection' 
    },
    { 
      // Operadores lógicos ($or, $and, $nor, $where)
      regex: /"\$(or|and|nor|where)"\s*:/i, 
      score: 12, 
      name: 'nosql_logic_injection' 
    },
    { 
      // Intento de inyección de JavaScript (muy peligroso en MongoDB)
      regex: /(db\s*\.\s*|sleep\s*\(|function\s*\(|return\s+true|while\s*\(true\))/i, 
      score: 15, 
      name: 'javascript_nosql_injection' 
    },
    { 
      // Patrones de bypass de autenticación típicos
      regex: /\{\s*"\$ne"\s*:\s*""\s*\}|\{\s*"\$gt"\s*:\s*""\s*\}/i, 
      score: 12, 
      name: 'auth_bypass_nosql' 
    },
    { 
      // Detección de llaves de objeto que empiezan con $ (cuando no se esperan)
      regex: /\$(where|expr|jsonSchema)/i, 
      score: 15, 
      name: 'high_risk_operator' 
    }
];