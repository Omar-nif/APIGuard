import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function runTest(name, endpoint, method = 'GET', body = null) {
  console.log(`\n--- Probando: ${name} ---`);
  
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  
  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json().catch(() => ({}));
    
    console.log(`URL: ${BASE_URL}${endpoint}`);
    console.log(`Status: ${response.status}`);
    
    if (response.status === 403) {
      console.log(`Resultado: BLOQUEADO (Correcto)`);
    } else if (response.status === 200) {
      console.log(`Resultado: PERMITIDO (Correcto)`);
    } else {
      console.log(`Resultado inesperado: ${response.status}`);
    }
  } catch (error) {
    console.error(`Error en la conexión: ${error.message}`);
  }
}

async function startTests() {
  // 1. CASO LEGÍTIMO: Búsqueda normal
  await runTest(
    "Usuario Legítimo", 
    "/api/users?name=Omar"
  );

  // 2. ATAQUE URL: Inyección de operador $ne (Not Equal) en Query String
  // Express convierte ?id[$ne]=null en { id: { $ne: null } }
  await runTest(
    "Ataque NoSQL via Query ($ne)", 
    "/api/users?id[$ne]=null"
  );

  // 3. ATAQUE BODY: Bypass de Login con $gt (Greater Than)
  // Intentamos entrar si el password es "mayor que nada"
  await runTest(
    "Ataque NoSQL via Body ($gt)", 
    "/login", 
    "POST", 
    { username: "admin", password: { "$gt": "" } }
  );

  // 4. ATAQUE JS INJECTION: Uso de $where para ejecutar código
  await runTest(
    "Ataque NoSQL JavaScript ($where)", 
    "/api/users", 
    "POST", 
    { "$where": "sleep(5000)" }
  );

  console.log("\n--- Pruebas finalizadas ---");
}

startTests();