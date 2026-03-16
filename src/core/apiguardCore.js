import { createSignalBus } from './signalBus.js';
import { createLogger } from './logger.js';

// Threats
import { registerEndpointEnumerationThreat } from './threats/endpointEnumerationThreat.js';
import { registerAuthBruteForceThreat } from './threats/authBruteForceThreat.js';
import { registerDoSThreat } from './threats/dosThreat.js';

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

  if (config.security?.detectors?.endpointEnumeration?.enabled) {
    registerEndpointEnumerationThreat({ bus, logger, config });
  }

  if (config?.security?.detectors?.bruteForce?.enabled) {
    registerAuthBruteForceThreat({ bus, logger, config });
  }

  /*if (config.security?.detectors?.dos?.enabled) {
    registerDoSThreat({ bus, logger, config });
  }*/

  
  //opcion 2:
  if (config.security?.detectors?.dos) { 
    registerDoSThreat({ bus, logger, config });
  }
  
  /*const dosConfig = config.security?.detectors?.dos;
  if (dosConfig?.requestFlood?.enabled || dosConfig?.endpointFlood?.enabled) {
    registerDoSThreat({ bus, logger, config });
  }*/
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
