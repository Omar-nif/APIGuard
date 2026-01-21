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

export function createPathEntropyDetector({
  bus,
  threshold = 3.5
}) {
  if (!bus) {
    throw new Error('pathEntropyDetector requires a signal bus');
  }

  return function pathEntropyDetector(event) {
    if (!event || event.meta.ignored) return;

    const path = event.request?.path;
    if (!path) return;

    const entropy = calculateEntropy(path);

    if (entropy < threshold) return;

    bus.emit(
      'signal',
      createSignal({
        type: 'path-entropy',
        source: 'pathEntropyDetector',
        severity: 'low',
        meta: {
          path,
          entropy,
          threshold
        }
      })
    );
  };
}
