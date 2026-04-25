import { createSignal } from "../signals/createSignal.js";

export function createExpensiveEndpointAnalyzer({ bus, config }) {
  if (!bus) throw new Error('expensiveEndpointAnalyzer requires bus');

  const settings = config?.security?.detectors?.dos?.expensiveEndpoints;

  if (!settings?.enabled) {
    return () => {};
  }

  const {
    windowMs = 60_000,
    threshold = 5,
    cooldownMs = 5000
  } = settings;

  const state = new Map();
  const lastDetection = new Map();

  function getState(ip) {
    if (!state.has(ip)) {
      state.set(ip, {
        count: 0,
        lastSeen: Date.now()
      });
    }
    return state.get(ip);
  }

  function cleanup(ip, data) {
    if (Date.now() - data.lastSeen > windowMs) {
      state.delete(ip);
    }
  }

  function evaluate(ip, path, data, signal) {
    const now = Date.now();
    const lastTime = lastDetection.get(ip) || 0;
    console.log("Contador para IP:", ip, data.count)
    // Evaluamos si superó el umbral y si ya pasó el tiempo de cooldown
    if (data.count >= threshold && (now - lastTime > cooldownMs)) {
      const threatSignal = createSignal({
        type: 'threat.dos.expensive_endpoint',
        level: 'high',
        source: 'expensiveEndpointAnalyzer',
        event: signal.event, // Evento original que viene del detector
        data: {
          ip,
          path,
          requests: data.count,
          windowMs,
          threshold
        }
      });

      bus.emit(threatSignal);
      
      lastDetection.set(ip, now);
      state.delete(ip); // Reiniciamos contador para esta IP
    }
  }

  return function expensiveEndpointAnalyzer(signal) {
    // IMPORTANTE: Ahora escuchamos la señal específica del detector
    if (!signal || signal.type !== 'dos.expensive_access') return;

    const { ip } = signal.event.request;
    const { path } = signal.data; // El path viene extraído por el detector

    const data = getState(ip);
    data.count++;
    data.lastSeen = Date.now();

    evaluate(ip, path, data, signal);
    cleanup(ip, data);
  };
}