# APIGuard
Es una librería de seguridad para aplicaciones Node.js con Express, distribuida mediante npm, que funcionará como middleware.

## Integrantes
- Omar Nicanor
- Miguel Lopez

## Tecnologías
- JavaScript
- Node.js 
- Express 

## Instrucciones para clonar y correr el proyecto
### Clonar
```bash
git clone [https://github.com/Omar-nif/APIGuard]
cd apiguard
```

## Instalar dependencias
```bash
npm install
```
## Ejecutar
```bash
cd .\test\
node server.js
```
## Ejecutar prueba
```bash
cd .\test\ //en otra terminal
node brutheForze_test.js
```
## Configuración de ramas

main: rama principal

feature/*: ramas de desarrollo por funcionalidad

fix/*: arreglar alguna funcionalidad

test/*: pruebas a algun modulo

## Integración con APIGuard Monitor (Dashboard)

La librería APIGuard **no envía correos**.

Su responsabilidad es:
- detectar amenazas en runtime
- generar un SecurityEvent consistente
- enviarlo al backend del dashboard

El backend del dashboard es quien:
- autentica API key
- resuelve proyecto e instalación
- guarda el SecurityEvent en MongoDB
- decide si envía correo según preferencias del proyecto

### Endpoint oficial de ingestión

- `POST /api/ingest/security-events`
- Header: `x-api-key: <API_KEY>`

### Configuración mínima en APIGuard

```json
{
	"api_key": "ag_xxxxxxxxxxxxxxxxx",
	"reporting": {
		"enabled": true,
		"base_url": "http://localhost:4000",
		"endpoint": "http://localhost:4000/api/ingest/security-events",
		"installation_id": "install_prod_01"
	}
}
```

Notas:
- `reporting.enabled=false` mantiene solo modo local/consola.
- No configurar destinatarios de correo en la librería.
- No configurar severidad mínima de email en la librería.

### Payload SecurityEvent que envía la librería

```json
{
	"installation_id": "install_prod_01",
	"detected_at": "2026-04-03T12:00:00.000Z",
	"event_type": "sql_injection",
	"severity": "high",
	"summary": "[sql_injection] threat detected on /login from 203.0.113.42",
	"description": "[sql_injection] threat detected on /login from 203.0.113.42",
	"detector_code": "sqlInjectionAnalyzer",
	"ip": "203.0.113.42",
	"method": "POST",
	"path": "/login",
	"status_code": 401,
	"score": 7,
	"payload_json": {
		"request_id": "req_abc123",
		"source": "sqlInjectionAnalyzer",
		"signal_type": "threat.sql_injection",
		"detections": ["union_select"],
		"data": {
			"score": 7,
			"threshold": 3,
			"ip": "203.0.113.42"
		},
		"request": {
			"query": {},
			"body": {
				"username": "admin' OR '1'='1"
			}
		}
	}
}
```

Severidades válidas enviadas por la librería:
- `low`
- `medium`
- `high`
- `critical`
