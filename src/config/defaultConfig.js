export const defaultConfig = {
  apikey: process.env.APIGUARD_API_KEY || "", 
  telemetry: {
    enabled: false, 
    endpoint: process.env.APIGUARD_TELEMETRY_URL || ""
  },

  security: {
    detectors: {
      endpointEnumeration: {
        enabled: true,
        windowMS: 60_000,
        threshold: 15 
      },

      bruteForce: {
        enabled: true,
        authPaths: ['/login', '/signin', '/api/auth/login'], 
        methods: ['POST'],
        failureStatusCodes: [401, 403],
        threshold: 5, 
        windowMS: 60_000
      },

      sqlInjection: {
        enabled: true,
        threshold: 20, 
        checkQuery: true, 
        checkBody: true,  
        excludeFields: ['password', 'token', 'secret', 'content'] 
      },

      noSqlInjection: {
        enabled: true,
        threshold: 20,
        checkQuery: true,
        checkBody: true,
        excludeFields: ['password', 'token', 'secret', 'content'] 
      },

      scraping: {
        enabled: true,
        threshold: 25,
        checkHeaders: true,
        blockSuspiciousAgents: true
      },

      dos: {
        requestFlood: {
          enabled: true,
          windowMs: 10_000,
          threshold: 100,
          cooldownMs: 5000
        },

        endpointFlood: {
          enabled: true,
          windowMs: 10_000,
          threshold: 50, 
          cooldownMs: 5000
        },

        expensiveEndpoints: {
          enabled: true,
          windowMs: 60_000, 
          threshold: 10, 
          endpoints: [], 
          cooldownMs: 5000
        }
      }
    },

    policies: {
      'threat.auth_bruteforce': {
        action: 'block',
        scope: 'ip',
        duration: 900_000 
      },

      'threat.endpoint_enumeration': {
        action: 'delay',
        scope: 'ip',
        duration: 300_000,
        delay: { min: 1000, max: 5000 }
      },

      'threat.sql_injection': {
        action: 'block', 
        scope: 'ip',
        duration: 3600_000 
      },

      'threat.nosql_injection': {
        action: 'block',
        scope: 'ip',
        duration: 3600_000
      },

      'threat.scraping': {
        action: 'delay', 
        duration: 600_000,      
        scope: 'ip',
        delay: { min: 2000, max: 3000 }
      },

      'threat.dos': {
        action: 'delay',
        scope: 'ip',
        duration: 60_000,
        delay: { min: 500, max: 2000 }
      },
      
      'threat.dos.expensive_endpoint': {
        action: 'rateLimit',
        scope: 'ip',
        duration: 120_000,
        rateLimit: { maxRequests: 5, windowMs: 60_000 }
      },
    }
  },

  http: {
    ignorePaths: ['/favicon.ico', '/robots.txt', '/static/*'], 
    slowThreshold: 2000 
  }
};