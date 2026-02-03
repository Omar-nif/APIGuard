import express from 'express';
import createApiguard from '../src/middleware.js';
//import { createApiguardCore } from '../src/core/apiguardCore.js';
import { createApiguardCore } from '../src/core/apiguardCore.js'
import { createSlowRequestDetector } from '../src/detectors/slowRequest.js';

const app = express();
// ------------------------ Instancia de APIGuard  -----------------------
const apiguardCore = createApiguardCore();

// ----------- Simulacion de detector (nada importante para el funcionamiento)
const slowDetector = createSlowRequestDetector({
  onSlow(event) {
    //console.log('SLOW REQUEST DETECTED');
    //console.log(event.request.method, event.request.path);
    //console.log(`Duration: ${event.performance.duration}ms`);
  }
});
//---------------------------------------------------------------------

// -------- Instancia para prueba de slowRequest (Nada importante) ------
app.use(
  createApiguard({
    slowThreshold: 500,
    onRequest: slowDetector,
    core: apiguardCore  
  })
);
//-----------------------------------------------------------------------

// ---------------- Endpoints de prueba ---------------------------
app.get('/fast', (req, res) => {
  res.send('fast');
});

app.get('/slow', async (req, res) => {
  await new Promise(r => setTimeout(r, 800));
  res.send('slow');
});
// -----------------------------------------------------------------

// -------------- Endpoints de prueba para "brute force" -----------

app.post('/login', express.json(), (req, res) => {
  const { ussername, password } = req.body || {};

  // Simulacion
  if(ussername === 'admin' && password === '1234') {
    return res.status(200).json({ succes: true });
  }

  return res.status(401).json({ succes: false });
});
//-------------------------------------------------------------------

// ------------------------- Servidor de express ------------------
app.listen(3000, () => {
  console.log('Servidor en http://localhost:3000 \n');
});
//-----------------------------------------------------------------