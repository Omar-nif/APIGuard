export function createTelemetryReporter({ bus, config, logger }) {
  const telemetry = config?.telemetry;
  const apiKey = config?.apiKey;

  if (!telemetry?.enabled || !apiKey) {
    logger?.info?.("[REPORTER] Telemetría desactivada o sin API Key.");
    return;
  }

  const reportAction = (signal) => {
    (async () => {
      const report = {
        apiKey: apiKey,
        timestamp: new Date().toISOString(),
        threat: {
          type: signal.type,
          level: signal.data?.level || 'medium',
          ip: signal.event?.request?.ip || 'unknown',
          path: signal.event?.request?.path || 'unknown',
          method: signal.event?.request?.method || 'unknown',
          status_code: signal.event?.response?.statusCode || null,
          score: signal.data?.score || 0,
          detections: signal.data?.detections || []
        }
      };

      try {
        const response = await fetch(telemetry.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-apiguard-key': apiKey 
          },
          body: JSON.stringify(report)
        });

        if (!response.ok) {
          logger?.error?.(`[REPORTER] Dashboard rechazó el evento: ${response.status}`);
        }
      } catch (err) {
        logger?.error?.(`[REPORTER] Error de red al conectar con Dashboard: ${err.message}`);
      }
    })();
  };

  bus.registerAction(reportAction);
  logger?.info?.(`[REPORTER] Sistema de reportes conectado a: ${telemetry.endpoint}`);
}