import { createSignalBus } from './signalBus.js';
import { createLogger } from './logger.js';

// Threats
import { registerPathProbingThreat } from './threats/pathProbingThreat.js';
import { registerAuthBruteForceThreat } from './threats/authBruteForceThreat.js';

// Decisions
import { createDecisionStore } from './decision/createDecisionStore.js';
import { createDecisionEngine } from './decision/createDecisionEngine.js';

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

  // ==============================
  // THREAT REGISTRY
  // ==============================

  if (config.security?.pathProbing?.enabled) {
    registerPathProbingThreat({ bus, logger, config });
  }

  if (config.security?.bruteForce?.enabled) {
    registerAuthBruteForceThreat({ bus, logger, config });
  }

  return {
    process(event) {
      bus.emit({
        type: 'request',
        event,
        source: 'apiguardCore'
      });
    },

    decisionStore // 🔥 necesario para el middleware
  };
}

/*
import { createSignalBus } from './signalBus.js';
import { createLogger } from './logger.js';

// Threats
import { registerPathProbingThreat } from './threats/pathProbingThreat.js';
import { registerAuthBruteForceThreat } from './threats/authBruteForceThreat.js';

export function createApiguardCore(config) {
  const logger = createLogger({
    mode: config.logger.mode
  });

  const bus = createSignalBus({ logger });

  // Threat Registry (explícito por ahora)
  if (config.security?.pathProbing?.enabled) {
    registerPathProbingThreat({ bus, logger, config });
  }

  if (config.security?.bruteForce?.enabled) {
    registerAuthBruteForceThreat({ bus, logger, config });
  }

  return {
    process(event) {
      bus.emit({
        type: 'request',
        event,
        source: 'apiguardCore'
      });
    }
  };
}

*/