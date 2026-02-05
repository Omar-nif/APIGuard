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

  /* ---------- Posible modificacion --------------------------
  export function createRequestEvent({
  id,
  startTime,
  duration,
  req,
  res,
  slowThreshold = null,
  ignored = false,
  error = null
}) {
  const statusCode = res?.statusCode ?? 0;
  const now = Date.now();

  return {
    id,
    timestamp: now,

    time: {
      start: startTime,
      end: startTime + duration,
      duration
    },

    request: {
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl,
      ip: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null
    },

    response: {
      statusCode,
      ok: statusCode >= 200 && statusCode < 300
    },

    performance: {
      slow:
        slowThreshold !== null && duration >= slowThreshold,
      threshold: slowThreshold
    },

    meta: {
      ignored,
      error
    }
  };
}

Notas:

1. timestamp vs startTime (detalle semántico)

Ahora :

timestamp: startTime

Eso puede confundir luego porque timestamp suele interpretarse como 
“evento emitido” y startTime es “inicio de request”

Recomendación:
Guárdarlos ambos, con nombres claros.

time: {
  start: startTime,
  end: startTime + duration
}

Y si quieres un timestamp plano:

timestamp: Date.now()

2. success basado solo en statusCode (ojo aquí)

success: statusCode < 400

Esto está bien por ahora, pero deja una puerta rara pues un 401 o 403 
no es éxito, pero sí es información útil y detectores de auth suelen querer
fallos explícitos.

Recomendación:
No decidas “éxito” tan fuerte aquí.
Mejor:

ok: statusCode >= 200 && statusCode < 300 y deja que los detectores decidan si
algo es “malicioso”.

3. req.ip puede mentir (pero está bien dejarlo)

Express a veces:

usa x-forwarded-for

depende de trust proxy

Sugerencia:
No lo compliques ahora, pero deja el campo listo:

ip: req.ip ?? null

Está bien como esta, solo nota mental para el futuro.

*/