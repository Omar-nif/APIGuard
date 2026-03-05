import { createSignalBus } from './signalBus.js';
import { createLogger } from './logger.js';

// Threats
import { registerEndpointEnumerationThreat } from './threats/endpointEnumerationThreat.js';
import { registerAuthBruteForceThreat } from './threats/authBruteForceThreat.js';

// Decisions
import { createDecisionStore } from './decision/decisionStore.js';
import { createDecisionEngine } from './decision/decisionEngine.js';

export function createApiguardCore(config) {
  const logger = createLogger({
    mode: config.logger.mode
  });

  const bus = createSignalBus({ logger });

  // ==============================
  // DECISION SYSTEM
  // ==============================

  const decisionStore = createDecisionStore({ logger });

  createDecisionEngine({
    bus,
    decisionStore,
    logger,
    config
  });

  //============== THREAT REGISTRY =======================

  if (config.security?.endpointEnumeration?.enabled) {
    registerEndpointEnumerationThreat({ bus, logger, config });
  }

  if (config?.security?.detectors?.bruteForce.enabled) {
    registerAuthBruteForceThreat({ bus, logger, config });
  }
//==========================================================
  return {
    process(event) {
      bus.emit({
        type: 'request',
        event,
        source: 'apiguardCore'
      });
    },

    decisionStore // necesario para el middleware
  };
}
