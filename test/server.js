import express from 'express';
import apiguard from '../src/index.js'; //  SOLO la API pública

const app = express();

// 1. PRIMERO: Los Parsers Globales
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// 2. SEGUNDO: APIGuard (Ahora sí tiene datos que leer)
app.use(
  apiguard({
    // opciones...
  })
);

// ---------------- Endpoints de prueba ---------------------
app.get('/fast', (req, res) => {
  res.send('fast');
});

app.get('/slow', async (req, res) => {
  await new Promise(r => setTimeout(r, 800));
  res.send('slow');
});

// --------------- Prueba para fuerza bruta -----------------
app.post('/login', express.json(), (req, res) => {
  const { username, password } = req.body || {};

  if (username === 'admin' && password === '1234') {
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ success: false });
});

// ---------------- Prueba para SQLi ----------------------
app.get('/api/users', (req, res) => {
  const { name, id, search } = req.query;
  
  // Si este log aparece, significa que APIGuard consideró la petición SEGURA
  console.log(`--- [SERVER] Petición recibida legalmente: name=${name || ''}, id=${id || ''} ---`);

  res.json({ 
    status: "success", 
    message: "La petición llegó al controlador de Express",
    echo: req.query 
  });
});
// ---------------- Prueba DoS ------------------------------
app.get('/', (req, res) => {
  res.send('home');
});

// Endpoint "Costoso" de prueba
app.get('/api/reports/heavy-export', (req, res) => {
  // Simulamos que hace algo que consume CPU
  res.json({ message: "Reporte generado con éxito", data: "..." });
});
// ---------------------------------------------------------

// ---------------- Servidor -------------------------------
app.listen(3000, () => {
  console.log('Servidor en http://localhost:3000');
  console.log('\n');
});
// ---------------------------------------------------------
