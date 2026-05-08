const URL_BASE = 'http://localhost:3000/api/users';

async function runSQLInjectionTest() {
  console.log("--- INICIANDO SIMULACIÓN DE INYECCIÓN SQL ---");
  
  // Escenarios: 1. Bypass simple, 2. Union Select (Extracción)
  const payloads = [
    "?id=1%20OR%201=1",
    "?name=admin'--",
    "?search=products%20UNION%20SELECT%20username,password%20FROM%20users"
  ];

  for (const payload of payloads) {
    try {
      const url = URL_BASE + payload;
      console.log(`\nEnviando Payload: ${payload}`);
      
      const res = await fetch(url);
      console.log(`Status: ${res.status}`);
      
      if (res.status === 403) {
        console.log("[ÉXITO] APIGuard interceptó y bloqueó el intento de inyección.");
      } else {
        console.warn("[FALLO] La petición no fue bloqueada.");
      }
    } catch (err) {
      console.error("Error de conexión:", err.message);
    }
  }
}
runSQLInjectionTest();