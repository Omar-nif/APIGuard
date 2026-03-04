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
      }
    },

    policies: {
      'threat.auth_bruteforce': {
        action: 'block',
        scope: 'ip',
        duration: 300_000
      },

      'threat.endpoint_enumeration': {
        action: 'block',
        scope: 'ip',
        duration: 120_000
      }
    }
  },

  http: {
    ignorePaths: [],
    slowThreshold: null
  }
};