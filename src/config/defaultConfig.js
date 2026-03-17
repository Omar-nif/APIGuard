export const defaultConfig = {
  logger: {
    mode: 'threat' // silent | threat | debug
  },

  security: {
    detectors: {
      endpointEnumeration: {
        enabled: true,
        windowMS: 60_000,
        threshold: 10
      },

      bruteForce: {
        enabled: true,
        authPaths: ['/login'],
        methods: ['POST'],
        failureStatusCodes: [401, 403],
        threshold: 3,
        windowMS: 60_000
      },

      dos: {
        requestFlood: {
          enabled: true,
          windowMs: 10000,
          threshold: 10,
          cooldownMs: 1000
        },

        endpointFlood: {
          enabled: true,
          windowMs: 10_000,
          threshold: 10,
          cooldownMs: 1000
        },

        expensiveEndpoints: {
          enabled: true,
          windowMs: 60_000, 
          threshold: 5,      
          endpoints: ['/api/reports/heavy-export', // <-- Endpoint "caro" de ejemplo
            '/api/search', '/api/export', '/api/reports'],
          cooldownMs: 5000
        }
      }
    },

    policies: {
      'threat.auth_bruteforce': {
        action: 'block',
        scope: 'ip',
        duration: 300_000
      },

      'threat.endpoint_enumeration': {
        action: 'delay',
        scope: 'ip',
        duration: 120_000,
        delay: { min: 500, max: 4000 }
      },

      'threat.dos': {
        action: 'delay',
        scope: 'ip',
        duration: 60_000,
        delay: { min: 200, max: 1000 }
      },
      
      'threat.dos.expensive_endpoint': {
        action: 'rateLimit',
        scope: 'ip',
        duration: 120_000, // Un poco más de tiempo porque es un ataque más "caro"
        rateLimit: { maxRequests: 2, windowMs: 10000 } // Muy restrictivo
      },
    }
  },

  http: {
    ignorePaths: [],
    slowThreshold: null
  }
};
