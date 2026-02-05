import { createSignal } from '../signals/createSignal.js';

export function createAuthFailedDetector({ bus, authPaths = ['/login'] }) {
  if (!bus) throw new Error('authFailedDetector requires bus');

  return function authFailedDetector(event) {
    if (!event || event.meta.ignored) return;

    const { request, response } = event;

    // Path sensible (configurable)
    if (!authPaths.includes(request.path)) return;

    // Metodos tipicos de auth -------> (posible configuracion)
    if (!['POST', 'PUT'].includes(request.method)) return;

    // codigos de fallo de auth
    if (![401, 403, 400, 422].includes(response.statusCode)) return;

    /* 
    401 Unauthorized: Se requiere autenticación.
    403 Forbidden: Acceso prohibido al recurso.
    400/422 (Bad Request/Unprocessable Entity): El atacante está enviando
     datos mal formados o intentando inyecciones en el formulario.
    */
    bus.emit(
      createSignal({
        type: 'auth.failed',
        level: 'low',
        source: 'authFailedDetector',
        event,
        data: {
          ip: request.ip,
          path: request.path,
          statusCode: response.statusCode
        }
      })
    );

    //console.log('[AUTH FAILED]', request.ip, request.path);
  };
}
