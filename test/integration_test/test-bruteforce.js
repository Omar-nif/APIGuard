const URL = 'http://localhost:3000/login';

async function runBruteForceTest() {
  console.log("--- INICIANDO SIMULACIÓN DE FUERZA BRUTA ---");
  for (let i = 1; i <= 10; i++) {
    try {
      const start = Date.now();
      const res = await fetch(URL, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'wrong_password' })
      });
      const duration = Date.now() - start;
      
      console.log(`Intento ${i} | Status: ${res.status} | Tiempo: ${duration}ms`);
      
      if (res.status === 403) {
        console.log(">> [BLOQUEO DETECTADO] El sistema ha denegado el acceso.");
        break; 
      }
    } catch (err) {
      console.error("Error en la conexión:", err.message);
    }
  }
}
runBruteForceTest();