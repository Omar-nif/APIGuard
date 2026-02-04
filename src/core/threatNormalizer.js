import { createSignal } from '../signals/createSignal.js';

export function createThreatNormalizer({ bus, logger }) {
  if (!bus) throw new Error('threatNormalizer requires bus');

  return function threatNormalizer(signal) {
    if (!signal || typeof signal.type !== 'string') return;

    // normalizamos amenazas
    if (!signal.type.startsWith('threat.')) return;

    const threatType = signal.type.replace('threat.', '');

    logger.threat(
      '[THREAT NORMALIZED]',
      threatType,
      signal.data
    );

    bus.emit(
      createSignal({
        type: 'THREAT_DETECTED',
        threatType,
        level: signal.level,
        source: signal.source,
        event: signal.event,
        data: signal.data
      })
    );
  };
}
