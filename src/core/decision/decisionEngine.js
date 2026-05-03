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

  const THREAT_NAMES = {
    'threat.auth_bruteforce': 'Ataque de fuerza bruta',
    'threat.endpoint_enumeration': 'Enumeración de endpoints',
    'threat.dos.endpoint_flood': 'Inundación de peticiones a endpoint (DoS)',
    'threat.dos.expensive_endpoint': 'Abuso de endpoints costosos (DoS)',
    'threat.nosql_injection': 'Inyección NoSQL',
    'threat.dos.request_flood': 'Inundación masiva de peticiones (Flood)',
    'threat.scraping': 'Extracción de datos no autorizada (Scraping)',
    'threat.sql_injection': 'Inyección SQL'
  };
  
  const ACTION_NAMES = {
    'block': 'bloqueo total',
    'delay': 'retardo de respuesta',
    'rateLimit': 'límite de velocidad',
    'monitor': 'monitoreo preventivo'
  };

  function handleThreat(signal) {
    if (signal.level !== 'high') return;
  
    const policy = resolvePolicy(signal.type);
    if (!policy) return;
  
    const context = {
      ip: String(signal.event?.request?.ip || signal.data?.ip || '').trim(),
      path: signal.event?.request?.path || signal.data?.path || ''
    };
  
    const existing = decisionStore.match(context);
    const decision = buildDecision(policy, signal, existing);
    
    if (decision) {
      decisionStore.register(decision);
  
      // --- NUEVO: Log Detallado ---
      const timestamp = new Date().toLocaleTimeString();

      // Traducimos los términos o usamos el original si no existe traducción
      const threatHumanName = THREAT_NAMES[signal.type] || signal.type;
      const actionHumanName = ACTION_NAMES[decision.action] || decision.action;

      const actionEmoji = {
        block: 'BLOCK',
        delay: 'DELAY',
        rateLimit: 'RATE_LIMIT',
        monitor: 'MONITOR'
      }[decision.action] || decision.action;
  
      console.warn(
        `\n -----------------------------------------` +
        `[APIGuard][${timestamp}]   SYSTEM ACTION\n` +
        ` > Evento:  ${threatHumanName}\n` +
        ` > Acción:  ${actionEmoji.toUpperCase()} aplicado a ${context.ip}\n` +
        ` > Motivo:  Se detectó un ${threatHumanName.toLowerCase()} y se aplicó un ${actionHumanName} para detenerlo.\n` +
        ` > Duración: ${decision.duration / 1000}s\n` +
        ` -----------------------------------------`
      );
    }
  }

  bus.registerAction(handleThreat);

  return {};
}
