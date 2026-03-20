const TARGET_URL = 'http://localhost:3000/api/users'; // Ajusta a tu endpoint real

async function sendRequest(label, params) {
    const url = new URL(TARGET_URL);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    console.log(`\n--- Probando: ${label} ---`);
    console.log(`URL: ${url.href}`);

    try {
        const response = await fetch(url);
        const data = await response.json().catch(() => ({}));
        
        console.log(`Status: ${response.status}`);
        if (response.status === 403) {
            console.log('✅ Resultado: BLOQUEADO (Correcto para ataque)');
        } else if (response.status === 200) {
            console.log('✅ Resultado: PERMITIDO (Correcto para usuario legal)');
        } else {
            console.log(`Resultado: Código ${response.status}`);
        }
    } catch (error) {
        console.error(`❌ Error de conexión: ${error.message}`);
    }
}

async function runTests() {
    // 1. Caso Falso Positivo (Usuario con apellido con comilla)
    // Score esperado: 1 (break_char) -> Threshold es 10, debería pasar.
    await sendRequest('Usuario Legítimo (O\'Connor)', { name: "O'Connor" });

    // 2. Caso Ataque Tautología (Clásico OR 1=1)
    // Score esperado: 1 (') + 8 (1=1) + 3 (--) = 12 -> Debería bloquear.
    await sendRequest('Ataque Tautología (OR 1=1)', { id: "1' OR 1=1 --" });

    // 3. Caso Ataque Crítico (UNION SELECT)
    // Score esperado: 10 (union_attack) + 1 (;) = 11 -> Debería bloquear.
    await sendRequest('Ataque de Extracción (UNION SELECT)', { search: "admin'; UNION SELECT * FROM users" });
}

runTests();