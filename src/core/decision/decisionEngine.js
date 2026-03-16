//console.log("DEBUG: Decision Engine Factory Called"); // Añade esto arriba

export function createDecisionEngine({ bus, decisionStore, logger, config }) {
  const policies = config.security?.policies ?? {};

  const ESCALATION = {
    delay: 'rateLimit',
    rateLimit: 'block',
    block: 'block' // Techo del escalado
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

  /**
   * Crea el objeto de decisión final basado en la política y el historial
   */
  function buildDecision(policy, signal, existing) {
    const ip = signal.event?.request?.ip || signal.data?.ip;
    const path = signal.event?.request?.path || signal.data?.path;

    if (!ip) return null;

    // 1. Definir el alcance (Match) de la decisión
    const match = {};
    if (policy.scope?.includes('ip')) match.ip = ip;
    if (policy.scope?.includes('path') && path) match.path = path;

    // 2. Determinar la acción (Escalar si ya existe una)
    let action = policy.action;
    let duration = policy.duration;

    if (existing) {
      action = escalateAction(existing.action);
      // Penalización: Duplicamos la duración si es reincidente
      duration = existing.duration * 2;
      
      console.log(`[ENGINE] Escalando de ${existing.action} a ${action} para ${ip}`);
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

  /**
   * Manejador principal de señales de amenaza
   */
  function handleThreat(signal) {
    if (signal.level !== 'high') return;

    const policy = resolvePolicy(signal.type);
    if (!policy) return;

    // Contexto completo para que decisionStore.match funcione correctamente
    const context = {
      ip: String(signal.event?.request?.ip || signal.data?.ip || '').trim(),
      path: signal.event?.request?.path || signal.data?.path
    };
    /*const context = {
      ip: signal.event?.request?.ip || signal.data?.ip,
      path: signal.event?.request?.path || signal.data?.path
    };*/

    // 1. Buscar decisión previa usando el contexto corregido
    console.log("BUSCANDO PREVIA PARA:", context.ip);
    const existing = decisionStore.match(context);
    console.log("EXISTING DECISION?", existing?.action || 'none');

    // 2. Construir la nueva decisión (con escalado interno)
    const decision = buildDecision(policy, signal, existing);
    if (!decision) return;

    // 3. Registrar en el Store
    decisionStore.register(decision);

    logger?.warn?.(`[DECISION ${existing ? 'ESCALATED' : 'CREATED'}]`, {
      ip: context.ip,
      action: decision.action,
      reason: decision.reason,
      duration: `${decision.duration / 1000}s`
    });
  }

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
*/