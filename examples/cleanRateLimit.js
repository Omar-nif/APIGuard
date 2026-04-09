/**
 * Script para limpiar el rate limit
 * 
 * El rate limiter de APIGuard mantiene estado en memoria por IP.
 * Este script espera a que se limpie automáticamente (30+ segundos de inactividad)
 * y luego verifica que la IP esté lista para nuevas peticiones.
 */

import http from 'http';

const SERVER_HOST = 'localhost';
const SERVER_PORT = 3000;
const CLEANUP_WAIT_TIME = 35000; // 35 segundos (más que el timeout de 30s)

console.log(' Limpiando rate limit...');
console.log(`   Esperando ${CLEANUP_WAIT_TIME / 1000}s para que se resetee el estado de 127.0.0.1...`);

// Mostrar barra de progreso
let elapsed = 0;
const progressInterval = setInterval(() => {
  elapsed += 1000;
  const percent = Math.round((elapsed / CLEANUP_WAIT_TIME) * 100);
  const filled = Math.round(percent / 5);
  const empty = 20 - filled;
  const bar = '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
  process.stdout.write(`\r${bar} ${percent}%`);
}, 1000);

// Esperar antes de hacer prueba
setTimeout(async () => {
  clearInterval(progressInterval);
  console.log('\n✓ Rate limit limpiado automáticamente\n');

  // Hacer una petición de prueba para confirmar
  console.log('Enviando petición de prueba...');
  
  const options = {
    hostname: SERVER_HOST,
    port: SERVER_PORT,
    path: '/api/users?name=test',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log(`   Status: ${res.statusCode}`);
    
    if (res.statusCode === 429) {
      console.log(' Rate limit aún activo. Espera un poco más e intenta nuevamente.');
    } else if (res.statusCode === 200 || res.statusCode === 404) {
      console.log(' Rate limit limpiado. Listo para nuevas pruebas.');
    } else {
      console.log(`  Respuesta inesperada: ${res.statusCode}`);
    }
  });

  req.on('error', (err) => {
    console.error(` Error de conexión: ${err.message}`);
    console.log('   Asegúrate de que el servidor esté corriendo en localhost:3000');
  });

  req.on('timeout', () => {
    req.destroy();
    console.error(' Timeout en la conexión');
  });

  req.end();
}, CLEANUP_WAIT_TIME);
