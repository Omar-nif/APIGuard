import express from 'express';
import apiguard from '../src/index.js';

const app = express();

// 1. PRIMERO: Los Parsers Globales (Crítico para que APIGuard vea los datos)
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// 2. SEGUNDO: APIGuard (Actúa como escudo entre los datos y tus rutas)
app.use(apiguard({}));

// ---------------- Endpoints de prueba ---------------------

// Endpoint base
app.get('/', (req, res) => res.send('APIGuard Shield Active'));

// --- PRUEBA: Login (Fuerza Bruta y NoSQL Body Injection) ---
app.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  
  // LOG de control: Si ves esto con un ataque, APIGuard falló.
  //console.log(`--- [SERVER] Intento de acceso: user=${username}, pass=${JSON.stringify(password)} ---`);

  if (username === 'admin' && password === '1234') {
    return res.status(200).json({ success: true, message: "Login correcto" });
  }

  return res.status(401).json({ success: false, message: "Credenciales inválidas" });
});

// --- PRUEBA: Usuarios (SQLi y NoSQL Query Injection) ---
app.get('/api/users', (req, res) => {
  // En NoSQL, name o id pueden llegar como objetos { $ne: null }
  //console.log("--- [SERVER] Query recibida:", req.query);

  res.json({ 
    status: "success", 
    message: "La petición llegó al controlador (Segura)",
    echo: req.query 
  });
});

// Añade esto debajo del app.get('/api/users'...)
app.post('/api/users', (req, res) => {
  res.json({ message: "Si ves esto, el ataque POST pasó" });
});

// --- PRUEBA: DoS (Rutas rápidas, lentas y costosas) ---
app.get('/fast', (req, res) => res.send('fast'));

app.get('/slow', async (req, res) => {
  await new Promise(r => setTimeout(r, 800));
  res.send('slow');
});

app.get('/api/reports/heavy-export', (req, res) => {
  res.json({ message: "Reporte pesado generado" });
});

// ---------------- Servidor -------------------------------
app.listen(3000, () => {
  console.log('Servidor APIGuard en http://localhost:3000');
  console.log('Esperando señales de ataque...\n');
});