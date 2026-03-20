async function simulateBruteForce() {
  console.log("Iniciando simulación de Fuerza Bruta...");

  for (let i = 1; i <= 10; i++) {
    try {
      const res = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'wrongpassword'
        })
      });

      console.log(`Intento ${i}: Status ${res.status}`);
    } catch (err) {
      console.error("Error: Asegúrate de que tu servidor esté encendido");
    }
  }
}

simulateBruteForce();