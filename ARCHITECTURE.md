# Arquitectura de ApiGuard 

Este documento describe la estructura interna y el flujo de datos de la librería.

## Vista General
ApiGuard funciona como un sistema desacoplado donde la **ingesta de datos** (Middleware) está separada del **motor de decisiones** (Core).

## Componentes

### 1. Punto de Entrada (`index.js`)
Es el orquestador que inicializa el sistema. Su función es:
- Cargar la configuración.
- Instanciar el Core.
- Retornar el middleware configurado.

| Componente | Responsabilidad |
| :--- | :--- |
| **Config** | Valida y mezcla las opciones del usuario. |
| **Core** | Procesa patrones y mantiene el estado de riesgo. |
| **Middleware** | Intercepta `req/res` y ejecuta acciones de bloqueo. |



## Flujo de una Request
1. El usuario hace una petición.
2. El **Middleware** extrae los metadatos.
3. El **Core** analiza los patrones.
4. Si el riesgo es alto, el **Middleware** corta la conexión.