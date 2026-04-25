export function createTelemetryReporter({ bus, config }) {
  const { telemetry, apiKey } = config;
  
  // Si no hay API Key o no está habilitado, salimos sin registrar nada en el bus
  if (!telemetry?.enabled || !apiKey) return;

  let buffer = [];
  const MAX_BUFFER_SIZE = 50;
  const FLUSH_INTERVAL = 5000; // 5 segundos

  const flush = async () => {
    if (buffer.length === 0) return;

    const reportsToSend = [...buffer];
    buffer = []; // Limpiamos el buffer inmediatamente para evitar duplicados

    try {
      const response = await fetch(telemetry.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-apiguard-key': apiKey
        },
        body: JSON.stringify({
          apiKey,
          timestamp: new Date().toISOString(),
          events: reportsToSend
        })
      });

      if (!response.ok) {
        // Usamos console.warn directo ya que no hay logger, 
        // pero solo para errores críticos de configuración/auth
        if (response.status === 401 || response.status === 403) {
          console.warn(`[APIGuard] Telemetry Error: Invalid API Key.`);
        }
      }
    } catch (err) {
      // Fallo silencioso en red para no molestar al usuario en consola
    }
  };

  // Intervalo para vaciar el buffer por tiempo
  const timer = setInterval(flush, FLUSH_INTERVAL);
  
  // .unref() permite que el proceso de Node termine aunque el timer siga activo
  if (timer.unref) timer.unref();

  bus.registerAction((signal) => {
    // Solo reportamos señales de amenazas confirmadas
    if (!signal.type.startsWith('threat.')) return;

    buffer.push({
      type: signal.type,
      level: signal.data?.level || 'medium',
      ip: signal.event?.request?.ip || signal.data?.ip || 'unknown',
      path: signal.event?.request?.path || signal.data?.path || 'unknown',
      method: signal.event?.request?.method || 'unknown',
      status_code: signal.event?.response?.statusCode || null,
      score: signal.data?.score || 0,
      detections: signal.data?.detections || []
    });

    // Si el buffer se llena antes de los 5 segundos, enviamos ya
    if (buffer.length >= MAX_BUFFER_SIZE) {
      flush();
    }
  });
}