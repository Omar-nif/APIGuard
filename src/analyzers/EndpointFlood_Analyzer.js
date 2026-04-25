// src/analyzers/Endpoint_Flood_Analyzer.js
import { createSignal } from '../signals/createSignal.js';

export function createEndpointFloodAnalyzer({ bus, config }) {
  const settings = config?.security?.detectors?.dos?.endpointFlood;
  if (!settings?.enabled) return () => {};

  return function endpointFloodAnalyzer(signal) {
    if (!signal || signal.type !== 'endpoint.high_rate') return;

    const { event, data } = signal;

    bus.emit(createSignal({
      type: 'threat.dos.endpoint_flood',
      level: 'high',
      source: 'endpointFloodAnalyzer',
      event,
      data: { ...data, analysisTimestamp: Date.now() }
    }));
  };
}