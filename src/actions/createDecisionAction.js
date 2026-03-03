export function createDecisionAction({ decisionStore, config }) {
    return function decisionAction(threat) {
      const rule = config.responses?.[threat.type];
  
      if (!rule) return;
  
      const ip = threat.context?.ip;
      const path = threat.context?.path;
  
      if (!ip) return;
  
      const decision = {
        id: generateId(),
        type: rule.type,
        target: {
          ip,
          ...(rule.type === 'shadow' && path ? { path } : {})
        },
        expiresAt: Date.now() + rule.duration
      };
  
      decisionStore.register(decision);
    };
  }
  
  function generateId() {
    return Math.random().toString(36).slice(2);
  }