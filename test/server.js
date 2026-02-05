import express from 'express';
import apiguard from '../src/index.js'; //  SOLO la API pública

const app = express();

// ------------------------ APIGuard ------------------------
app.use(
  apiguard({
    // aquí luego irán opciones reales:
    // logLevel, thresholds, enableDetectors, etc.
  })
);
// ---------------------------------------------------------

// ---------------- Endpoints de prueba ---------------------
app.get('/fast', (req, res) => {
  res.send('fast');
});

app.get('/slow', async (req, res) => {
  await new Promise(r => setTimeout(r, 800));
  res.send('slow');
});

app.post('/login', express.json(), (req, res) => {
  const { username, password } = req.body || {};

  if (username === 'admin' && password === '1234') {
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ success: false });
});
// ---------------------------------------------------------

// ---------------- Servidor -------------------------------
app.listen(3000, () => {
  console.log('Servidor en http://localhost:3000');
  console.log('\n');
});
// ---------------------------------------------------------
