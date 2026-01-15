  /**
 * Esta función toma los objetos gigantes de Express (req, res)
 * y extrae solo lo que nos sirve para detectar ataques o fallos.
 */
export function createRequestEvent({
    id,             // ID único generado en utils
    startTime,      // Cuándo empezó la petición
    duration,       // Cuánto tardó (calculado en el middleware)
    req,            // Objeto de petición de Express
    res,            // Objeto de respuesta de Express
    slowThreshold = null, // El límite de tiempo definido por el usuario
    ignored = false,      // Si el usuario pidió ignorar esta ruta
    error = null          // Si hubo algún error en el proceso
  }) {
    
    // Obtenemos el código de estado (200, 404, 500, etc.)
    // El "?." evita que el código explote si "res" no existe.
    // El "??" pone un 0 si no se encuentra el código de estado.
    const statusCode = res?.statusCode ?? 0;
  
    // Retornamos un objeto limpio y organizado
    return {
      id,
      timestamp: startTime, // Guardamos el momento exacto del evento
  
      // --- DATOS DEL CLIENTE  ---
      request: {
        method: req.method,      // GET, POST, DELETE, etc.
        path: req.path,          // La ruta limpia (ej: /login)
        originalUrl: req.originalUrl, // La ruta con parámetros (ej: /login?user=1)
        ip: req.ip || null,      // Dirección IP del que hace la petición
        userAgent: req.headers['user-agent'] || null // Qué navegador o bot está usando
      },
  
      // --- DATOS DEL SERVIDOR (Qué pasó) ---
      response: {
        statusCode,
        // Si el código es menor a 400 (como un 200 OK), la petición fue exitosa.
        // Si es 400+ (como 404 o 500), se marca como fallo.
        success: statusCode < 400
      },
  
      // --- MÉTRICAS DE VELOCIDAD (Cuánto tardó) ---
      performance: {
        duration, // Tiempo en milisegundos
        // Esta es la lógica clave:
        // Decimos que es "slow" (lenta) SOLO SI el usuario puso un límite 
        // Y el tiempo que tardó la petición es mayor o igual a ese límite.
        slow:
          slowThreshold !== null && duration >= slowThreshold,
        threshold: slowThreshold
      },
  
      // --- INFORMACIÓN EXTRA ---
      meta: {
        ignored, // Para saber si esta petición debería ser ignorada en los logs
        error    // Si ocurrió algún error técnico, aquí se guarda
      }
    };
  }