import { createSignal } from "../signals/createSignal.js";

export function createAuthBruteForceAnalyzer(options = {}) {
    const {
        bus,
        windowMS = 60_000,
        threshold = 5
    } = options;

    if (!bus) throw new Error('authBruteForceAnalyzer requires bus');

    const state = new Map();

    function getState(ip) {
        if (!state.has(ip)) {
            state.set(ip, {
                attempts: 0, 
                firstSeen: Date.now(),
                lastSeen: Date.now()
            });
        }
        return state.get(ip);
    }

    function evaluate(ip, data, signal) {
        if (data.attempts >= threshold) {
            bus.emit(
                createSignal({
                    type: 'threat.auth_bruteforce',
                    level: 'high',
                    source: 'authBruteForceAnalyzer',
                    event: signal.event, 
                    data: {
                        ip,
                        attempts: data.attempts,
                        windowMS
                    }
                })
            );
            state.delete(ip); // Reset tras detectar la amenaza
        }
    }

    return function authBruteForceAnalyzer(signal) {
        // Filtro: Solo nos interesan fallos de autenticación
        if (!signal || signal.type !== 'auth.failed') return;

        const ip = signal.event.request.ip;
        const data = getState(ip);

        data.attempts++;
        console.log(
            '[BRUTE STATE]',
            ip,
            'attempts:',
            data.attempts
          );
          
        data.lastSeen = Date.now();

        evaluate(ip, data, signal);
        // El cleanup aquí limpia solo a la IP actual si ya pasó su tiempo
        // (Aunque lo ideal sería un intervalo global, para empezar está bien)
        const now = Date.now();
        if (now - data.lastSeen > windowMS) {
            state.delete(ip);
        }
    };
}