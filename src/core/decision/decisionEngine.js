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
    // Normalizamos los datos de entrada
    const ip = String(signal.event?.request?.ip || signal.data?.ip || '').trim();
    const path = signal.event?.request?.path || signal.data?.path || '';

    if (!ip) return null;

    // 1. Definir el alcance (Match)
    // CRÍTICO: Debe coincidir con la estructura que el Store espera para crear la llave
    const match = { ip };
    if (policy.scope?.includes('path') && path) {
      match.path = path;
    }

    // 2. Determinar la acción
    let action = policy.action || 'monitor';
    let duration = policy.duration || 60000; // Default 1 min si no hay política

    if (existing) {
      action = escalateAction(existing.action);
      // Penalización: Duplicamos la duración
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
    // Solo actuamos ante amenazas confirmadas (high)
    if (signal.level !== 'high') return;

    const policy = resolvePolicy(signal.type);
    if (!policy) return;

    // Contexto normalizado para buscar en el Store
    const context = {
      ip: String(signal.event?.request?.ip || signal.data?.ip || '').trim(),
      path: signal.event?.request?.path || signal.data?.path || ''
    };

    // 1. Buscar si ya hay un castigo activo para este sujeto
    const existing = decisionStore.match(context);

    // 2. Construir la nueva decisión (Nueva o Escalada)
    const decision = buildDecision(policy, signal, existing);
    
    if (decision) {
      decisionStore.register(decision);
    }
  }

  // El motor se suscribe a las señales de tipo "threat.*"
  bus.registerAction(handleThreat);

  return {};
}