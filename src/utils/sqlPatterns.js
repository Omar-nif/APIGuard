/**
 * Diccionario de firmas de SQL Injection
 * Cada patrón tiene un regex, un puntaje de sospecha y un nombre descriptivo.
 */
export const SQL_PATTERNS = [
  { 
    // El "OR" o "AND" es el alma de la inyección
    regex: /\b(or|and|xor|not)\b\s+(\d+|=|['"])/i, 
    score: 10, 
    name: 'logical_connector' 
  },
  { 
    // Tu tautología es buena, pero añadamos una versión más amplia
    regex: /\d+\s*=\s*\d+|(['"])[a-zA-Z]+\1\s*=\s*(['"])[a-zA-Z]+\2/i, 
    score: 12, // Subimos de 8 a 12 porque esto casi nunca es legítimo
    name: 'tautology' 
  },
  { 
    // Unir comentarios con comandos es señal clara
    regex: /(--|#|\/\*)/i, 
    score: 5, // Subimos de 3 a 5
    name: 'comment' 
  },
  { 
    regex: /union\s+(all\s+)?select/i, 
    score: 15, // Un UNION SELECT es 99% un ataque. Subimos a 15.
    name: 'union_attack' 
  },
  { 
    // Caracteres peligrosos combinados con palabras clave
    regex: /['"];\s*\b(drop|delete|truncate|update)\b/i,
    score: 20, // Si detectamos esto, es un ataque letal. Bloqueo inmediato.
    name: 'stacked_queries'
  },
    { 
      regex: /\b(insert|update|delete|drop|truncate|alter)\b/i, 
      score: 7, 
      name: 'dml_command' 
    },
    { 
      regex: /\b(information_schema|table_name|column_name|sysdatabases)\b/i, 
      score: 10, 
      name: 'metadata_leak' 
    },
    { 
      regex: /(['";])/, 
      score: 1, 
      name: 'break_char' 
    },
    { 
      regex: /\b(sleep|benchmark|load_file|curruser|user\(\))\b/i, 
      score: 8, 
      name: 'system_function' 
    }
  ];