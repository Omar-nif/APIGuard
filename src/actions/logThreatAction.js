export function createLogThreatAction({ logger, prefix = '[APIGUARD][THREAT]' } = {}) {
  if (!logger) {
    throw new Error('logThreatAction requires a logger');
  }

  return function logThreatAction(signal) {
    if (!signal || !signal.type.startsWith('threat.')) return;

    const {
      type,
      level,
      source,
      data,
      event
    } = signal;

    logger.threat(
      prefix,
      {
        type,
        level,
        source,
        ip: data?.ip,
        path: event?.request?.path,
        signals: data?.signals,
        time: new Date().toISOString()
      }
    );
  };
}


/* ------------------ V1 (sin logger) ------------------------
export function createLogThreatAction(options = {}) {
    const {
      prefix = '[APIGUARD][THREAT]'
    } = options;
  
    return function logThreatAction(signal) {
      if (!signal || !signal.type.startsWith('threat.')) return;
  
      const {
        type,
        level,
        source,
        data,
        event
      } = signal;
  
      console.log(`
  ${prefix}
  Type: ${type}
  Level: ${level}
  Source: ${source}
  IP: ${data?.ip}
  Path: ${event?.request?.path}
  Signals: ${JSON.stringify(data?.signals)}
  Time: ${new Date().toISOString()}
  `);
    };
  }
  */