export function createTelemetryReporter({ bus, config }) {
  const { telemetry, apiKey } = config;
  
  if (!telemetry?.enabled || !apiKey || !telemetry.endpoint) return;

  let buffer = [];
  const MAX_BUFFER_SIZE = 50;
  const HARD_LIMIT = 200; 
  const FLUSH_INTERVAL = 5000;

  const flush = async () => {
    if (buffer.length === 0) return;

    // Tomamos una captura del buffer y lo vaciamos
    const eventsToSend = buffer.splice(0, MAX_BUFFER_SIZE);

    try {
      // Usamos una señal de tiempo de espera (AbortController) 
      // para que la petición no se quede colgada para siempre
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(telemetry.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`, // Estándar de la industria
          'x-apiguard-key': apiKey // Mantenemos tu header por compatibilidad
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          eventsCount: eventsToSend.length,
          events: eventsToSend
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.error(`[APIGuard] Telemetry Auth Failed: Check your API Key.`);
        }
      }
    } catch (err) {
      // Fallo silencioso: La red puede fallar, pero APIGuard debe seguir vivo
    }
  };

  const timer = setInterval(flush, FLUSH_INTERVAL);
  if (timer.unref) timer.unref();

  bus.registerAction((signal) => {
    // Filtro: Solo reportamos amenazas confirmadas o señales críticas
    if (!signal.type.startsWith('threat.')) return;

    // Prevención de desbordamiento de memoria
    if (buffer.length >= HARD_LIMIT) {
      buffer.shift(); // Sacamos el evento más viejo para meter el nuevo
    }

    buffer.push({
      id: Math.random().toString(36).substr(2, 9), // ID único para el evento
      type: signal.type,
      level: signal.data?.level || 'medium',
      ip: signal.event?.request?.ip || signal.data?.ip || 'unknown',
      path: signal.event?.request?.path || signal.data?.path || 'unknown',
      method: signal.event?.request?.method || 'unknown',
      status_code: signal.event?.response?.statusCode || null,
      score: signal.data?.score || 0,
      timestamp: new Date().toISOString()
    });

    if (buffer.length >= MAX_BUFFER_SIZE) {
      // Usamos setImmediate para que el envío ocurra en el próximo ciclo
      // y no bloquee el hilo actual del bus
      setImmediate(flush);
    }
  });
}