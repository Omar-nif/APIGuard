//console.log("DEBUG: Decision Engine Factory Called"); // Añade esto arriba

export function createDecisionEngine({ bus, decisionStore, logger, config }) {
  //console.log("DecisionEngine CREATED");
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
    console.log("BUSCANDO PREVIA PARA:", ip);
    const existing = decisionStore.match({ ip });
    console.log("EXISTING DECISION?", existing?.action);

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
    if (signal.level !== 'high') return;

    const policy = resolvePolicy(signal.type);
    if (!policy) return;

    // 1. Obtener la IP correctamente
    const ip = signal.event?.request?.ip || signal.data?.ip;
    
    // 2. Buscar si ya lo conocemos para escalar
    const existing = decisionStore.match({ ip });
    
    // 3. Determinar la acción final (Escalada o Base)
    let finalAction = policy.action;
    if (existing) {
      finalAction = escalateAction(existing.action);
      
      // LOGICA DE REFUERZO: Si ya estaba en block, mantenlo en block y aumenta duración
      if (existing.action === 'block') {
         finalAction = 'block';
      }
    }

    const decision = buildDecision(policy, signal);
    if (!decision) return;

    // 4. Aplicar la acción escalada al objeto final
    decision.action = finalAction;
    
    // 5. PENALIZACIÓN: Si reincide, duplicamos la duración del castigo
    if (existing) {
      decision.duration = existing.duration * 2; 
    }

    decisionStore.register(decision);

    logger?.warn?.(`[DECISION ${existing ? 'ESCALATED' : 'CREATED'}]`, {
      ip,
      action: decision.action,
      duration: decision.duration
    });
  }
  //console.log("DecisionEngine registering handler");
  bus.registerAction(handleThreat);

  return {};
}

/*
export function createDecisionEngine({ bus, decisionStore, logger, config }) {
  //console.log("DecisionEngine CREATED");
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
    console.log("BUSCANDO PREVIA PARA:", ip);
    const existing = decisionStore.match({ ip });
    console.log("EXISTING DECISION?", existing?.action);

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
    //console.log("DEBUG: handleThreat executed for", signal.type);
    //console.log("ENGINE SIGNAL", signal.type);
    if (signal.level !== 'high') return;

    const policy = resolvePolicy(signal.type);
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
  //console.log("DecisionEngine registering handler");
  bus.registerAction(handleThreat);

  return {};
}*/