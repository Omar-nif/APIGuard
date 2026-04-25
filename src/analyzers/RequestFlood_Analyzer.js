    // src/analyzers/Request_Flood_Analyzer.js
import { createSignal } from '../signals/createSignal.js';

export function createRequestFloodAnalyzer({ bus, config }) {
  // Leemos del config centralizado de 'dos'
  const settings = config?.security?.detectors?.dos?.requestFlood;
  if (!settings?.enabled) return () => {};

  return function requestFloodAnalyzer(signal) {
    if (!signal || signal.type !== 'request.high_rate') return;

    const { event, data } = signal;
    
    bus.emit(createSignal({
      type: 'threat.dos.request_flood',
      level: 'high',
      source: 'requestFloodAnalyzer',
      event,
      data: { ...data, analysisTimestamp: Date.now() }
    }));
  };
}