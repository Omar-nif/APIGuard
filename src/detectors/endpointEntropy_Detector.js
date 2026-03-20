import { createSignal } from '../signals/createSignal.js';

function calculateEntropy(str) {
  if (!str || str.length === 0) return 0;

  const charCounts = {};

  for (const char of str) {
    charCounts[char] = (charCounts[char] || 0) + 1;
  }

  const length = str.length;
  let entropy = 0;

  for (const char in charCounts) {
    const p = charCounts[char] / length;
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
    if (!signal || signal.type !== 'request') return;

    const event = signal.event;

    if (event.meta?.ignored) return;

    const path = event.request?.path;
    if (!path) return;

    // solo analizar último segmento
    const segments = path.split('/');
    const lastSegment = segments.pop() || '';

    const entropy = calculateEntropy(lastSegment);

    if (entropy < threshold) return;

    bus.emit(
      createSignal({
        type: 'endpoint.high_entropy',
        level: 'low',
        source: 'pathEntropyDetector',
        event,
        data: {
          ip: event.request.ip,
          path,
          entropy,
          threshold
        }
      })
    );
  };
}
