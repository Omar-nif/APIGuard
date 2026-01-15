import express from 'express';
import createApiguard from '../src/middleware.js';
import { createSlowRequestDetector } from '../src/detectors/slowRequest.js';

const app = express();

const slowDetector = createSlowRequestDetector({
  onSlow(event) {
    console.log('SLOW REQUEST DETECTED');
    console.log(event.request.method, event.request.path);
    console.log(`Duration: ${event.performance.duration}ms`);
  }
});

app.use(
  createApiguard({
    slowThreshold: 500,
    onRequest: slowDetector
  })
);

app.get('/fast', (req, res) => {
  res.send('fast');
});

app.get('/slow', async (req, res) => {
  await new Promise(r => setTimeout(r, 800));
  res.send('slow');
});

app.listen(3000, () => {
  console.log('Servidor en http://localhost:3000');
});
