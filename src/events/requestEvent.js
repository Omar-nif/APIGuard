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
  
    return {
      id,
      timestamp: startTime,
  
      request: {
        method: req.method,
        path: req.path,
        originalUrl: req.originalUrl,
        ip: req.ip || null,
        userAgent: req.headers['user-agent'] || null
      },
  
      response: {
        statusCode,
        success: statusCode < 400
      },
  
      performance: {
        duration,
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
  