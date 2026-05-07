export function createTelemetryReporter({ bus, config }) {
  const { telemetry, apiKey } = config;
  
  if (!telemetry?.enabled || !apiKey || !telemetry.endpoint) return;

  let buffer = [];
  const MAX_BUFFER_SIZE = 50;
  const HARD_LIMIT = 200; 
  const FLUSH_INTERVAL = 5000;

  const flush = async () => {
    if (buffer.length === 0) return;

    // Tomamos los eventos del buffer
    const eventsToSend = buffer.splice(0, MAX_BUFFER_SIZE);

    // Mapeamos cada evento al formato que el Dashboard entiende y los enviamos en paralelo
    const sendPromises = eventsToSend.map(async (event) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);

        const response = await fetch(telemetry.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'x-apiguard-key': apiKey 
          },
          body: JSON.stringify({
            apiKey: apiKey, // Algunos dashboards lo buscan en el body
            timestamp: event.timestamp,
            // ENVOLVEMOS LOS DATOS EN EL OBJETO "threat"
            threat: {
              type: event.type,
              level: event.level,
              ip: event.ip,
              path: event.path,
              method: event.method,
              status_code: event.status_code,
              score: event.score
            }
          }),
          signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok && (response.status === 401 || response.status === 403)) {
          console.error(`[APIGuard] Telemetry Auth Failed: Check your API Key.`);
        }
      } catch (err) {
        // Fallo silencioso para no interrumpir la ejecución principal
      }
    });

    // Esperamos a que todos los envíos de este flush terminen
    await Promise.allSettled(sendPromises);
  };

  const timer = setInterval(flush, FLUSH_INTERVAL);
  if (timer.unref) timer.unref();

  bus.registerAction((signal) => {
    if (!signal.type.startsWith('threat.')) return;

    if (buffer.length >= HARD_LIMIT) {
      buffer.shift();
    }

    // Guardamos los datos con los nombres que luego mapearemos al "threat"
    buffer.push({
      id: Math.random().toString(36).substr(2, 9),
      type: signal.type,
      level: signal.level || signal.data?.level || 'medium',
      ip: signal.data?.ip || signal.event?.request?.ip || 'unknown',
      path: signal.data?.path || signal.event?.request?.path || 'unknown',
      method: signal.event?.request?.method || 'unknown',
      status_code: signal.event?.response?.statusCode || null,
      score: signal.data?.score || 0,
      timestamp: new Date().toISOString()
    });

    if (buffer.length >= MAX_BUFFER_SIZE) {
      setImmediate(flush);
    }
  });
}