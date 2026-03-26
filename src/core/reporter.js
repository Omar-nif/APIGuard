// src/core/reporter.js

export function createTelemetryReporter({ bus, config, logger }) {
  const telemetry = config?.telemetry;
  const apiKey = config?.projectKey;

  // 1. Verificación inicial
  if (!telemetry?.enabled || !apiKey) {
    logger?.info?.("[REPORTER] Telemetría desactivada o sin API Key.");
    return;
  }

  // 2. Definimos la acción que se ejecutará cuando haya una amenaza
  const reportAction = (signal) => {
    // Construimos el paquete de datos
    const report = {
      apiKey: apiKey,
      timestamp: new Date().toISOString(),
      threat: {
        type: signal.type,
        level: signal.data?.level || 'medium',
        ip: signal.event?.request?.ip || 'unknown',
        path: signal.event?.request?.path || 'unknown',
        method: signal.event?.request?.method || 'unknown',
        status_code: signal.event?.response?.status || null,
        score: signal.data?.score || 0,
        detections: signal.data?.detections || []
      }
    };

    // Enviamos al exterior
    fetch(telemetry.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-APIGUARD-KEY': apiKey
      },
      body: JSON.stringify(report)
    }).catch(err => {
      // Si el dashboard está apagado, solo avisamos en el log local
      logger?.error?.(`[REPORTER] Falló el envío al Dashboard: ${err.message}`);
    });
  };

  // 3. REGISTRO: Le decimos al bus que esta función es una "Action"
  // Gracias a tu SignalBus, esto se ejecutará automáticamente en cada 'threat.*'
  bus.registerAction(reportAction);

  logger?.info?.(`[REPORTER] Sistema de reportes conectado a: ${telemetry.endpoint}`);
}