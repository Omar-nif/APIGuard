export function createDecisionEngine({ bus, decisionStore, logger, config }) {
    const blockDuration =
      config.security?.bruteForce?.blockDuration ?? 5 * 60 * 1000;
  
    function handleThreat(signal) {
      const ip = signal?.data?.ip || signal?.event?.request?.ip;
      if (!ip) return;
  
      if (signal.level !== 'high') return;
  
      decisionStore.register({
        scope: 'ip',
        ip,
        action: 'block',
        reason: signal.type,
        duration: blockDuration
      });
  
      logger?.warn?.('[DECISION REGISTERED]', {
        ip,
        action: 'block',
        duration: blockDuration
      });
    }
  
    bus.registerAction(handleThreat);
  
    return {};
  }