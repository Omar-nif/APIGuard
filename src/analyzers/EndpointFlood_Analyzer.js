import { createSignal } from '../signals/createSignal.js';

export function createEndpointFloodAnalyzer({ bus, config }) {
  const settings = config?.security?.detectors?.dos?.endpointFlood;
  if (!settings?.enabled) return () => {};

  return function endpointFloodAnalyzer(signal) {
    try {
      if (!signal || signal.type !== 'endpoint.high_rate') return;

      const { event, data } = signal;

      const threat = createSignal({
        type: 'threat.dos.endpoint_flood',
        level: 'high',
        source: 'endpointFloodAnalyzer',
        event,
        data: { ...data, analysisTimestamp: Date.now() }
      });

        try {
          bus.emit(threat);
        } catch (e) {}
    } catch (err) {
      // Fail-Open
    }
  };
}