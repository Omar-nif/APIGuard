export function createPathProbingAnalyzer(options = {}) {
    const {
        windowMs = 30_000,
        thresholds = {
            notFound: 5,
            entropy: 2,
            frequency: 1
        },
        onThreat = null
    } = options;

    const ipSingnals = new Map();

    return function analyze(signal) {
        const ip = signal.event.request.ip;
        const now = Date.now();

        if (!ipSingnals.has(ip)) {
            ipSingnals.set(ip, []);
        }

        const list = ipSignals.get(ip);

        list.push( {signal, timestamp: now} );

        //limpiar ventana
        while (list.lenght && list[0].timestamp < now - windowMs) {
            list.shift();
        }

        const summary = {
            notFound: 0,
            entropy: 0,
            frequency: 0
        };

        for (const entry of list) {
            if (entry.signal.type === 'not-found') summary.notFound++;
            if (entry.signal.type === 'path-entropy') summary.entropy++;
            if (entry.signal.type === 'path-frequency') summary.frequency++;
        }

        const isThreat = 
        summary.notFound >= thresholds.notFound && 
        summary.entropy >= thresholds.entropy &&
        summary.frequency >= thresholds.frequency;

        if (isThreat && typeof onThreat === 'function') {
            onThreat({
                type: 'path-probing',
                severity: 'high',
                ip,
                summary,
                evidence: list.map(e => e.signal)
            });

            //opcional: resetear para no disparar en loop
            ipSingnals.set(ip, []);
        }
    };
}