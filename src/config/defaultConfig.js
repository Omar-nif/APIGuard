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

      sqlInjection: {
        enabled: true,
        threshold: 3, 
        checkQuery: true, 
        checkBody: true,  
        excludeFields: ['password', 'token', 'secret'] 
      },

      noSqlInjection: {
        enabled: true,
        threshold: 10,
        checkQuery: true,
        checkBody: true
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
          endpoints: ['/api/reports/heavy-export', '/api/search', '/api/export', '/api/reports'],
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

      // --- NUEVA POLÍTICA: SQL INJECTION ---
      'threat.sql_injection': {
        action: 'block', // Acción radical para una amenaza de integridad de datos
        scope: 'ip',
        duration: 600_000 // 10 minutos de bloqueo inicial
      },

      'threat.nosql_injection': {
      action: 'block',
      scope: 'ip',
      duration: 600_000
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
        duration: 120_000,
        rateLimit: { maxRequests: 2, windowMs: 10000 }
      },
    }
  },

  http: {
    ignorePaths: [],
    slowThreshold: null
  }
};