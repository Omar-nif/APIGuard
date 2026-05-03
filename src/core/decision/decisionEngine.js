export function createDecisionEngine({ bus, decisionStore, config }) {
  const policies = config.security?.policies ?? {};

  const ESCALATION = {
    monitor: 'delay',
    delay: 'rateLimit',
    rateLimit: 'block',
    block: 'block' 
  };

  function escalateAction(currentAction) {
    return ESCALATION[currentAction] || currentAction;
  }

  function resolvePolicy(threatType) {
    let current = threatType;
    while (current) {
      if (policies[current]) return policies[current];
      const lastDot = current.lastIndexOf('.');
      if (lastDot === -1) break;
      current = current.slice(0, lastDot);
    }
    return null;
  }

  function buildDecision(policy, signal, existing) {
    const ip = String(signal.event?.request?.ip || signal.data?.ip || '').trim();
    const path = signal.event?.request?.path || signal.data?.path || '';

    if (!ip) return null;

    // --- PUNTO CLAVE ---
    // Si ya existe una decisión, heredamos su "match" original para no crear llaves duplicadas
    // Si no existe, usamos el scope definido en la política.
    const match = existing ? { ...existing.match } : { ip };
    
    if (!existing && policy.scope?.includes('path') && path) {
      match.path = path;
    }

    let action = policy.action || 'monitor';
    let duration = policy.duration || 60000;

    if (existing) {
      action = escalateAction(existing.action);
      duration = (existing.duration || 60000) * 2;
    }

    return {
      action,
      reason: signal.type,
      duration,
      match,
      delay: policy.delay,
      rateLimit: policy.rateLimit
    };
  }

  function handleThreat(signal) {
    if (signal.level !== 'high') return;

    const policy = resolvePolicy(signal.type);
    if (!policy) return;

    const context = {
      ip: String(signal.event?.request?.ip || signal.data?.ip || '').trim(),
      path: signal.event?.request?.path || signal.data?.path || ''
    };

    // 1. Buscamos si ya hay un castigo
    const existing = decisionStore.match(context);

    // 2. Construimos la decisión (respetando el match anterior si existe)
    const decision = buildDecision(policy, signal, existing);
    
    if (decision) {
      decisionStore.register(decision);
    }
  }

  bus.registerAction(handleThreat);

  return {};
}