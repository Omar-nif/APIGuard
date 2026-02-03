export function createSignalBus({ logger }) {
    const analyzers = new Set();
    const actions = new Set();

    // Seguridad: Si no pasan logger, creamos uno básico para que no rompa
    const log = logger || { debug: () => {}, threat: () => {} };

    function registerAnalyzer(analyzer) {
        if (typeof analyzer !== 'function') {
            throw new Error('Analyzer must be a function');
        }
        analyzers.add(analyzer);
    }

    function registerAction(action) {
        if (typeof action !== 'function') {
            throw new Error('Action must be a function');
        }
        actions.add(action);
    }

    function emit(signal) {
        if (!signal || typeof signal.type !== 'string') return;

        log.debug('[BUS EMIT]', signal.type);

        // Analizadores reciben TODAS las señales
        for (const analyzer of analyzers) {
            try {
                analyzer(signal);
            } catch (err) {
                // El bus jamás debe romper el flujo
            }
        }

        // Las acciones SOLO escuchan amenazas
        if (signal.type === 'THREAT_DETECTED') {
            logger.threat(
              '[THREAT]',
              signal.threatType,
              signal.data
            );
      
            for (const action of actions) {
              action(signal);
            }
          }
        
    }

    return {
        registerAnalyzer,
        registerAction,
        emit
    };
}



/* 

din logger:

if (signal.type === 'THREAT_DETECTED') {
            for (const action of actions) {
                try {
                    action(signal);
                } catch (err) {
                    // Igual: nunca romper
                }
            }
        }
for (const action of actions) {
                try {
                    action(signal);
                } catch (err) {
                    // Igual: nunca romper
                }
            }

V1
export function createSignalBus() {
    const analyzers = new Set();

    function registerAnalyzer(analyzer) {
        if (typeof analyzer !== 'function') {
            throw new Error('Analyzer must be a function');
        }
        analyzers.add(analyzer);
    }

    function emit(signal) {
        console.log('[BUS EMIT]', signal.type);
        if (!signal || typeof signal.type !== 'string') return;

        for (const analyzer of analyzers) {
            try {
                analyzer(signal);
            } catch (err) {
                // El bus nunca debe romper el flujo
            }
        }
    }

    return {
        registerAnalyzer,
        emit
    };
}
*/
/*Nota: el bus espera una señal mientras que los detectores mandan dos por lo 
que puede ser que el bus solo reciba un texto  
*/