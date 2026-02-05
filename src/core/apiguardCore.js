
import { createSignalBus } from './signalBus.js';

// ------------------------ Detectores -----------------------------------------
import { createNotFoundDetector } from '../detectors/notFound_Detector.js';
//import { createPathFrequencyDetector } from '../detectors/pathFrequency_Detector.js';
import { createPathEntropyDetector } from '../detectors/pathEntropy_Detector.js';
import { createPathDiversityDetector } from '../detectors/createPathDiversity_Detector.js';

import { createAuthFailedDetector } from '../detectors/authFailed_Detector.js';
//-----------------------------------------------------------------------------

// ------------------------- Analizadores --------------------------------------
import { createPathProbingAnalyzer } from '../analyzers/pathProbingAnalyzer.js';
import { createAuthBruteForceAnalyzer } from '../analyzers/authBruteForceAnalyzer.js';
//--------------------------------------------------------------------------------

// --------------------------- Actions ----------------------------------------------
import { createLogThreatAction } from '../actions/logThreatAction.js';
//---------------------------------------------------------------------------------

// --------------------------- logger -----------------------------------------------
import { createLogger, LOG_LEVELS } from './logger.js';
//-----------------------------------------------------------------------------------

export function createApiguardCore() {

  const logger = createLogger(LOG_LEVELS.THREAT); // Modos: SILENT, THREAT, DEBUG
  const bus = createSignalBus({ logger });

  //  --------------- Registro de detectores (leen eventos) -------------------------------
  const detectors = [
    createNotFoundDetector({ bus }),
    createPathDiversityDetector({ bus }),
    createPathEntropyDetector({ bus }),
    createAuthFailedDetector({ bus })
  ];
//----------------------------------------------------------------------------------------

  // ------------------------ Registro de analizadores ----------------------------------
  bus.registerAnalyzer(
    createPathProbingAnalyzer({ bus, logger }),
    createAuthBruteForceAnalyzer({ bus, logger })
  );
// ---------------------------------------------------------------------------------------

  // ---------------- Registro de actions (escucha amenazas) ------------------------------
  bus.registerAction(
    createLogThreatAction({ logger })
  );
//----------------------------------------------------------------------------------------

  /*bus.registerAnalyzer(signal => {
    console.log('[SIGNAL BUS]', signal.type, signal.data);
  });*/
  
  return {
    process(event) {
      detectors.forEach(detector => detector(event));
    }
  };
}

/* ---------------------------- V1 ----------------------------------
export function createApiguardCore() {
  const bus = createSignalBus();

  // Analyzer escucha TODAS las señales
  bus.registerAnalyzer(
    createPathProbingAnalyzer({ bus })
  );

  // Action escucha señales de amenaza
  bus.registerAnalyzer(
    createLogThreatAction()
  );

  // Detectores (se ejecutan manualmente)
  const detectors = [
    createNotFoundDetector({ bus }),
    createPathFrequencyDetector({ bus }),
    createPathEntropyDetector({ bus })
  ];

  return {
    process(event) {
      detectors.forEach(detector => detector(event));
    }
  };
}
/*
------------------------- V2 -------------------------------
/*
import { createBus } from '../bus.js';

// Detectores
import { createNotFoundDetector } from '../detectors/notFoundDetector.js';
import { createPathFrequencyDetector } from '../detectors/pathFrequencyDetector.js';
import { createPathEntropyDetector } from '../detectors/pathEntropyDetector.js';

// Analyzer
import { createPathProbingAnalyzer } from '../analyzers/pathProbingAnalyzer.js';

// Action
import { createLogThreatAction } from '../actions/logThreatAction.js';

export function createApiguardCore() {
  const bus = createBus();

  // Detectores
  const notFoundDetector = createNotFoundDetector({ bus });
  const pathFrequencyDetector = createPathFrequencyDetector({ bus });
  const pathEntropyDetector = createPathEntropyDetector({ bus });

  // Analyzer
  const pathProbingAnalyzer = createPathProbingAnalyzer({ bus });

  // Action
  const logThreatAction = createLogThreatAction();

  // Conexiones
  bus.on('event', notFoundDetector);
  bus.on('event', pathFrequencyDetector);
  bus.on('event', pathEntropyDetector);

  bus.on('signal', pathProbingAnalyzer);
  bus.on('signal', logThreatAction);

  return {
    process(event) {
      bus.emit('event', event);
    }
  };
}
*/