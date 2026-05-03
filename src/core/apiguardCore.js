import { createSignalBus } from './signalBus.js';
import { createTelemetryReporter } from './reporter.js';

// Threats
import { registerEndpointEnumerationThreat } from './threats/endpointEnumerationThreat.js';
import { registerAuthBruteForceThreat } from './threats/authBruteForceThreat.js';
import { registerDoSThreat } from './threats/dosThreat.js';
import { registerSQLInjectionThreat } from './threats/sqlInjectionThreat.js';
import { registerNoSQLInjectionThreat } from './threats/nosqlInjectionThreat.js';
import { registerScrapingThreat } from './threats/scrapingThreat.js';

// Decisions
import { createDecisionStore } from './decision/decisionStore.js';
import { createDecisionEngine } from './decision/decisionEngine.js';

export function createApiguardCore(config) {

  const bus = createSignalBus();

  // ================DECISION SYSTEM ==============================
  const decisionStore = createDecisionStore();

  createDecisionEngine({
    bus,
    decisionStore,
    config
  });

  //============== THREAT REGISTRY ===============================

  if (config.security?.detectors?.endpointEnumeration?.enabled) {
    registerEndpointEnumerationThreat({ bus, config });
  }

  if (config?.security?.detectors?.bruteForce?.enabled) {
    registerAuthBruteForceThreat({ bus, config });
  }

  if (config?.security?.detectors?.sqlInjection?.enabled) {
    registerSQLInjectionThreat({ bus, config });
  }

  if (config?.security?.detectors?.noSqlInjection?.enabled) {
    registerNoSQLInjectionThreat({ bus, config });
  }

  if (config.security?.detectors?.scraping?.enabled) {
    registerScrapingThreat({ bus, config });
  }

  // Verificamos si existe el objeto dos para registrar sus sub-amenazas
  const dosConfig = config.security?.detectors?.dos;
  if (dosConfig) {
      // Registramos si al menos uno de los tres está habilitado
      if (dosConfig.requestFlood?.enabled || 
          dosConfig.endpointFlood?.enabled || 
          dosConfig.expensiveEndpoints?.enabled) {
          registerDoSThreat({ bus, config });
      }
  }

  // ============================ Telemetry sistem =========================
  
  createTelemetryReporter( { bus, config,});
  
// --------------------------------------------------------------------------
return {
  process(event) {
    bus.emit({
      type: event.stage || 'request', 
      event,
      source: 'apiguardCore'
    });
  },
  decisionStore 
};
}
