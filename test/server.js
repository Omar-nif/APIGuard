import express from 'express';
import apiGuard from '../src/index.js';

const app = express();
app.use(express.json());

// montar APIGuard
app.use(
  apiGuard({
    log: true,
    slowThreshold: 500,
    ignorePaths: ['/health', '/favicon.ico']
  })
);

// rutas normales
app.get('/health', (req, res) => {
  res.send('OK');
});

app.get('/fast', (req, res) => {
  res.json({ ok: true });
});

app.get('/slow', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  res.json({ ok: true });
});

app.post('/login', (req, res) => {
  res.json({ user: req.body.email });
});

app.listen(3000, () => {
  console.log('Servidor de prueba en http://localhost:3000');
});
