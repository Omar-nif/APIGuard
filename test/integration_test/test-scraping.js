async function runScrapingTest() {
    console.log("--- INICIANDO SIMULACIÓN DE SCRAPING ---");
    
    // Simulamos que el bot quiere extraer los productos del 1 al 50
    for (let productId = 1; productId <= 50; productId++) {
      const url = `http://localhost:3000/api/products/${productId}`;
      const start = Date.now();
  
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Scrapy/2.5 (Bot)' 
          }
        });
        const duration = Date.now() - start;
  
        console.log(`Extrayendo ID ${productId} | Status: ${res.status} | Tiempo: ${duration}ms`);
  
        if (duration > 1500) {
          console.log("\n  [DETECCIÓN] APIGuard ha ralentizado el scraping (Acción: DELAY).");
        }
  
        if (res.status === 403) {
          console.log("\n [BLOQUEO] Bot expulsado del sistema.");
          break;
        }
      } catch (err) {
        console.error("Error:", err.message);
      }
      
      // El bot no espera, intenta ir lo más rápido posible
    }
  }
  
  runScrapingTest();