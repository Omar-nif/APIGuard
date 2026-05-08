const TARGETS = [
    'http://localhost:3000/api/users',
    'http://localhost:3000/api/products',
    'http://localhost:3000/api/auth',
    'http://localhost:3000/'
  ];
  
  async function runRequestFlood() {
    console.log("--- INICIANDO PRUEBA DE REQUEST FLOOD (GLOBAL) ---");
    let totalSent = 0;
    const MAX_TEST = 200;
  
    for (let i = 0; i < MAX_TEST; i++) {
      const target = TARGETS[i % TARGETS.length]; 
      const start = Date.now();
      
      try {
        const res = await fetch(target);
        const duration = Date.now() - start;
        const action = res.headers.get('x-apiguard-action') || 'allow';
  
        console.log(`[${i+1}] Path: ${new URL(target).pathname} | Status: ${res.status} | Latencia: ${duration}ms | Acción: ${action}`);
  
        if (duration > 1000) {
          console.log("\n[EFECTO DELAY] El sistema está reteniendo las peticiones.");
        }
        
        if (res.status === 403) {
          console.log("\n[BLOQUEO TOTAL] La IP ha sido expulsada.");
          break;
        }
      } catch (err) {
        console.log("Error:", err.message);
      }
    }
  }
  
  runRequestFlood();