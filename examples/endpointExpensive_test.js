// Prueba con fetch nativo (sin dependencias)
async function launchAttack() {
    const target = 'http://localhost:3000/api/reports/heavy-export';
    console.log(`--- Iniciando ataque a: ${target} ---`);

    for (let i = 1; i <= 100; i++) {
        try {
            const res = await fetch(target);
            console.log(`[${i}] Status: ${res.status}`);
        } catch (e) {
            console.log(`[${i}] Error de conexión: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, 200));
    }
}
launchAttack();
//const axios = require('axios');

/*async function launchAttack() {
    const target = 'http://localhost:3000/api/reports/heavy-export';
    console.log(`--- Iniciando ataque a endpoint costoso: ${target} ---`);

    for (let i = 1; i <= 15; i++) {
        try {
            const start = Date.now();
            const response = await axios.get(target);
            const duration = Date.now() - start;
            console.log(`[Petición ${i}] Status: ${response.status} | Tiempo: ${duration}ms`);
        } catch (error) {
            console.log(`[Petición ${i}] Error: ${error.response?.status} - ${error.response?.data?.message || 'Rate Limited'}`);
        }
        
        // Un pequeño respiro para que el server procese
        await new Promise(resolve => setTimeout(resolve, 200));
    }
}

launchAttack();*/