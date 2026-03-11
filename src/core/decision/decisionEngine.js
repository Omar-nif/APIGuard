export function createDecisionEngine({ bus, decisionStore, logger, config }) {
  const policies = config.security?.policies ?? {};

  const ESCALATION = {
    delay: 'rateLimit',
    rateLimit: 'block'
  };

  function escalateAction(currentAction) {
    return ESCALATION[currentAction] || currentAction;
  }

  function resolvePolicy(threatType) {
    let current = threatType;

    while (current) {
      if (policies[current]) {
        return policies[current];
      }

      const lastDot = current.lastIndexOf('.');
      if (lastDot === -1) break;

      current = current.slice(0, lastDot);
    }

    return null;
  }

  function buildDecision(policy, signal) {
    const ip = signal?.data?.ip || signal?.event?.request?.ip;
    const path = signal?.data?.path || signal?.event?.request?.path;

    if (!ip) return null;

    const match = {};

    if (policy.scope?.includes('ip')) {
      match.ip = ip;
    }

    if (policy.scope?.includes('path') && path) {
      match.path = path;
    }

    // revisar si ya existe una decisión activa
    const existing = decisionStore.match({ ip });

    let action = policy.action;

    if (existing) {
      action = escalateAction(existing.action);
    }

    return {
      action,
      reason: signal.type,
      duration: policy.duration,
      match,
      delay: policy.delay,
      rateLimit: policy.rateLimit
    };
  }

  function handleThreat(signal) {
    console.log("ENGINE SIGNAL", signal.type);
    if (signal.level !== 'high') return;

    const policy = resolvePolicy(signal.type);
    console.log("POLICY FOUND", policy);
    if (!policy) return;

    console.log("POLICY FOUND", policy);

    const decision = buildDecision(policy, signal);
    if (!decision) return;

    decisionStore.register(decision);

    logger?.warn?.('[DECISION REGISTERED]', {
      action: decision.action,
      reason: decision.reason,
      duration: decision.duration,
      match: decision.match
    });
  }

  bus.registerAction(handleThreat);

  return {};
}