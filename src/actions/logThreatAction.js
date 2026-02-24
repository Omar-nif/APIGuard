export function createLogThreatAction({ logger, prefix = '[APIGUARD][THREAT]' } = {}) {
  if (!logger) {
    throw new Error('logThreatAction requires a logger');
  }

  return function logThreatAction(signal) {
    if (!signal || !signal.type.startsWith('threat.')) return;

    const { type, level, source, data, event } = signal;

    const logPayload = {
      type,
      level,
      source,
      ip: data?.ip,
      path: event?.request?.path,
      time: new Date().toISOString(),
      ...data // ← aquí está la clave
    };

    logger.threat(prefix, logPayload);
  };
}
