const URL = 'http://localhost:3000/api/reports/generate'; // Endpoint marcado como costoso

async function runExpensiveEndpointTest() {
  console.log("--- INICIANDO PRUEBA DE ENDPOINT COSTOSO ---");
  console.log(`Objetivo: ${URL}`);
  
  for (let i = 1; i <= 80; i++) {
    try {
      const start = Date.now();
      const res = await fetch(URL);
      const duration = Date.now() - start;

      console.log(`Petición #${i} | Status: ${res.status} | Latencia: ${duration}ms`);

      if (res.status === 429 || res.status === 403) {
        console.log("\n [ÉXITO] APIGuard limitó el acceso al recurso costoso tras pocos intentos.");
        break;
      }
    } catch (err) {
      console.error("Error:", err.message);
    }
  }
}

runExpensiveEndpointTest();