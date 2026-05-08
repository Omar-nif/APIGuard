const URL = 'http://localhost:3000/api/v1/products';

async function runEndpointFloodTest() {
  console.log("--- INICIANDO PRUEBA DE ENDPOINT FLOOD ---");
  console.log(`Objetivo: ${URL}`);

  // Creamos un array de 60 promesas de petición simultáneas
  const requests = Array.from({ length: 80 }).map((_, i) => 
    fetch(URL)
      .then(res => {
        if (res.status === 429 || res.status === 403) {
          console.log(`Req #${i + 1}: [BLOQUEADO] Status ${res.status}`);
          return 'blocked';
        }
        return 'success';
      })
      .catch(err => 'error')
  );

  const results = await Promise.all(requests);
  
  const blockedCount = results.filter(r => r === 'blocked').length;
  const successCount = results.filter(r => r === 'success').length;

  console.log("\n--- RESUMEN DE LA PRUEBA ---");
  console.log(`Peticiones exitosas: ${successCount}`);
  console.log(`Peticiones bloqueadas: ${blockedCount}`);

  if (blockedCount > 0) {
    console.log("[ÉXITO] El sistema detectó la inundación y activó el escudo.");
  }
}

runEndpointFloodTest();