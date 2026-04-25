import { createSignal } from '../signals/createSignal.js';

/**
 * Calcula la entropía de Shannon de una cadena.
 * Blindado contra strings vacíos o nulos.
 */
function calculateEntropy(str) {
  if (!str || str.length === 0) return 0;

  const charCounts = new Map(); // Usar Map es ligeramente más rápido para conteos en Node.js
  const length = str.length;

  for (let i = 0; i < length; i++) {
    const char = str[i];
    charCounts.set(char, (charCounts.get(char) || 0) + 1);
  }

  let entropy = 0;
  for (const count of charCounts.values()) {
    const p = count / length;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}

export function createEndpointEntropyDetector({
  bus,
  threshold = 3.5
}) {
  if (!bus) {
    throw new Error('pathEntropyDetector requires a signal bus');
  }

  return function pathEntropyDetector(signal) {
    try {
      // 1. Filtrado rápido
      if (!signal || signal.type !== 'request') return;

      const event = signal.event;
      if (!event || event.meta?.ignored) return;

      const path = event.request?.path;
      // Saltamos si no hay path o es la raíz
      if (!path || path === '/') return;

      // 2. Extracción del segmento a analizar
      // Solo analizamos el último segmento (nombre del recurso)
      const lastSegment = path.substring(path.lastIndexOf('/') + 1);
      
      // Si el segmento es muy corto, la entropía no es significativa
      if (lastSegment.length < 5) return;

      // 3. Cálculo de Entropía
      const entropy = calculateEntropy(lastSegment);

      // 4. Evaluación y Emisión
      if (entropy >= threshold) {
        const entropySignal = createSignal({
          type: 'endpoint.high_entropy',
          level: 'low',
          source: 'pathEntropyDetector',
          event,
          data: {
            ip: event.request.ip,
            path,
            entropy: Number(entropy.toFixed(2)),
            threshold
          }
        });

        // Emitimos asíncronamente para no bloquear el procesamiento del request
        setImmediate(() => {
          try {
            bus.emit(entropySignal);
          } catch (e) {}
        });
      }
    } catch (err) {
      // Fail-Open: Si el cálculo falla, la vida sigue
    }
  };
}