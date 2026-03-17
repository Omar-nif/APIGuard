/**
 * Diccionario de firmas de SQL Injection
 * Cada patrón tiene un regex, un puntaje de sospecha y un nombre descriptivo.
 */
export const SQL_PATTERNS = [
    { 
      regex: /\d+\s*=\s*\d+|(['"])[a-zA-Z]+\1\s*=\s*(['"])[a-zA-Z]+\2/i, 
      score: 8, 
      name: 'tautology' 
    },
    { 
      regex: /(--|#|\/\*|\*\/)/i, 
      score: 3, 
      name: 'comment' 
    },
    { 
      regex: /union\s+(all\s+)?select/i, 
      score: 10, 
      name: 'union_attack' 
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