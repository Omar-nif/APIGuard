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

/*Nota: el bus espera una señal mientras que los detectores mandan dos por lo 
que puede ser que el bus solo reciba un texto  
*/