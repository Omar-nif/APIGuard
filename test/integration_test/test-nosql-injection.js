const URL = 'http://localhost:3000/api/login';

async function runNoSQLTest() {
  console.log("--- INICIANDO SIMULACIÓN DE INYECCIÓN NOSQL ---");
  
  // El payload intenta decir: "Búscame un usuario donde el password sea MAYOR QUE nada"
  // Esto en MongoDB suele devolver el primer usuario encontrado (el admin).
  const attackPayload = {
    username: "admin",
    password: { "$gt": "" } 
  };

  try {
    console.log("Enviando JSON con operador $gt...");
    const res = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attackPayload)
    });

    console.log(`Status recibido: ${res.status}`);

    if (res.status === 403) {
      console.log("[ÉXITO] APIGuard detectó el operador malicioso y bloqueó el JSON.");
    } else {
      console.warn("[FALLO] El middleware permitió el paso del objeto malicioso.");
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

runNoSQLTest();