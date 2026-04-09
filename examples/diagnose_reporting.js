/**
 * Script de diagnóstico para verificar si los eventos se están enviando al backend
 */

import http from 'http';
import https from 'https';

const BACKEND_URL = 'http://localhost:4000/api/ingest/security-events';
const API_KEY = 'ag_test_connection_2026';
const INSTALLATION_ID = 'install_test_connection_001';

async function testBackendConnection() {
  console.log('\n DIAGNÓSTICO DE REPORTING\n');
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`API Key: ${API_KEY}`);
  console.log(`Installation ID: ${INSTALLATION_ID}\n`);

  // 1. Verificar que el backend está disponible
  console.log('1  Verificando conectividad con el backend...');
  try {
    const response = await fetch(`${BACKEND_URL.replace('/api/ingest/security-events', '/health')}`);
    console.log(`    Backend respondió: ${response.status}`);
  } catch (err) {
    console.log(`    Backend NO disponible: ${err.message}`);
    console.log('   ACCIÓN: Asegúrate de que ApiGuard_Monitor esté ejecutándose en localhost:4000\n');
    return;
  }

  // 2. Enviar un evento de prueba
  console.log('\n2  Enviando evento de prueba...');
  const testPayload = {
    installation_id: INSTALLATION_ID,
    detected_at: new Date().toISOString(),
    event_type: 'sql_injection',
    severity: 'high',
    summary: '[sql_injection] threat detected on /api/users from 127.0.0.1',
    description: 'Test SQL injection event from diagnostic script',
    detector_code: 'sqlInjectionAnalyzer',
    ip: '127.0.0.1',
    method: 'GET',
    path: '/api/users',
    status_code: 403,
    score: 15,
    payload_json: {
      request_id: 'diag-test-001',
      source: 'diagnostic_script',
      signal_type: 'threat.sql_injection'
    }
  };

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify(testPayload)
    });

    const data = await response.json().catch(() => ({}));
    
    if (response.status === 201) {
      console.log(`    Evento aceptado por backend (201)`);
      console.log(`    Email enviado: ${data.email_sent ? 'SÍ' : 'NO'}`);
      if (data.email_sent === false) {
        console.log('     NOTA: Email NO fue enviado. Verifica la configuración de alertas en el backend.');
      }
    } else {
      console.log(`    Backend rechazó el evento (${response.status})`);
      console.log(`   Respuesta: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    console.log(`    Error al enviar evento: ${err.message}`);
  }

  // 3. Verificar configuración en backend
  console.log('\n3  Verificando configuración de alertas...');
  try {
    const response = await fetch(
      `http://localhost:4000/api/projects/by-key/${API_KEY}/preferences`,
      {
        headers: { 'x-api-key': API_KEY }
      }
    );

    if (response.status === 200) {
      const prefs = await response.json();
      console.log(`   Preferencias encontradas`);
      console.log(`   Email alerts: ${prefs.email_alerts?.enabled ? 'HABILITADO' : 'DESHABILITADO'}`);
      console.log(`   Correos: ${prefs.email_alerts?.recipient_emails?.join(', ') || 'NINGUNO'}`);
      console.log(`   Min severity: ${prefs.email_alerts?.min_severity || 'N/A'}`);
    } else {
      console.log(`     No se pudieron obtener preferencias (${response.status})`);
    }
  } catch (err) {
    console.log(`     No se puede verificar preferencias: ${err.message}`);
  }

  console.log('\n Diagnóstico completado\n');
}

testBackendConnection();
