export function createDecisionEngine({ bus, decisionStore, logger, config }) {
  const policies = config.security?.policies ?? {};

  function resolvePolicy(threatType) {
    return policies[threatType] ?? null;
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

    return {
      action: policy.action,
      reason: signal.type,
      duration: policy.duration,
      match
    };
  }

  function handleThreat(signal) {
    if (signal.level !== 'high') return;

    const policy = resolvePolicy(signal.type);
    if (!policy) return;

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