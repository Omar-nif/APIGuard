import { createSignal } from '../signals/createSignal.js';

export function createRequestFloodAnalyzer({ bus, config }) {
  const settings = config?.security?.detectors?.dos?.requestFlood;
  if (!settings?.enabled) return () => {};

  return function requestFloodAnalyzer(signal) {
    try {
      if (!signal || signal.type !== 'request.high_rate') return;

      const { event, data } = signal;
      
      // Convertimos sospecha en amenaza confirmada
      const threat = createSignal({
        type: 'threat.dos.request_flood',
        level: 'high',
        source: 'requestFloodAnalyzer',
        event,
        data: { ...data, analysisTimestamp: Date.now() }
      });

      setImmediate(() => {
        try {
          bus.emit(threat);
        } catch (e) {}
      });
    } catch (err) {
      // Fail-Open
    }
  };
}