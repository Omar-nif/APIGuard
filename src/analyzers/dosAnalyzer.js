import { createSignal } from '../signals/createSignal.js';

const SIGNAL_TO_THREAT = {
  'request.high_rate': 'threat.dos.request_flood',
  'endpoint.high_rate': 'threat.dos.endpoint_flood'
};

export function createDosAnalyzer({ bus, logger, config }) {
  if (!bus) throw new Error('dosAnalyzer requires a signal bus');

  // 1. Verificación de consistencia con la configuración
  const dosConfig = config?.security?.detectors?.dos;
  const isEnabled = dosConfig?.requestFlood?.enabled || dosConfig?.endpointFlood?.enabled;

  if (!isEnabled) {
    return () => {}; // Retorno consistente con la arquitectura
  }

  return function dosAnalyzer(signal) {
    if (!signal) return;

    const threatType = SIGNAL_TO_THREAT[signal.type];
    if (!threatType) return;

    const { event, data } = signal;
    const ip = event.request.ip;

    // 2. Uso del logger profesional del sistema
    logger?.threat?.(
      '[DOS THREAT DETECTED]',
      `type=${threatType}`,
      `ip=${ip}`,
      `details=${JSON.stringify(data)}`
    );

    // 3. Emisión de la señal final de amenaza
    bus.emit(
      createSignal({
        type: threatType,
        level: 'high',
        source: 'dosAnalyzer',
        event,
        data: {
          ...data,
          analysisTimestamp: Date.now(),
          engine: 'APIGuard_DoS_Core'
        }
      })
    );
  };
}