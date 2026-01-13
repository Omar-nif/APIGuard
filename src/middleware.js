export default function createApiguard(options = {}) {
    const {
      log = true,
      slowThreshold = null,
      ignorePaths = [],
      onRequest = null
    } = options;
  
    return function apiGuardMiddleware(req, res, next) {
      const startTime = Date.now();
  
      res.on('finish', () => {
        try {
          const duration = Date.now() - startTime;
          const ignored = ignorePaths.includes(req.path);
  
          const statusCode = res.statusCode;
          const isSlow =
            slowThreshold !== null && duration >= slowThreshold;
  
          const requestEvent = {
            id: generateRequestId(),
            timestamp: startTime,
  
            request: {
              method: req.method,
              path: req.path,
              originalUrl: req.originalUrl,
              ip: req.ip,
              userAgent: req.headers['user-agent'] || null
            },
  
            response: {
              statusCode,
              success: statusCode < 400
            },
  
            performance: {
              duration,
              slow: isSlow,
              threshold: slowThreshold
            },
  
            meta: {
              ignored,
              error: null
            }
          };
  
          // Log interno
          if (log && !ignored) {
            console.log('[APIGUARD]', requestEvent);
          }
  
          // Hook público
          if (typeof onRequest === 'function' && !ignored) {
            try {
              onRequest(requestEvent);
            } catch (hookError) {
              console.error('[APIGUARD] Error en onRequest hook:', hookError);
            }
          }
  
        } catch (error) {
        }
      });
      next();
    };
  }
  
  function generateRequestId() {
    return `req_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }
  