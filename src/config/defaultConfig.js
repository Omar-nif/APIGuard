export const defaultConfig = {
  logger: {
    mode: 'debug' // silent | threat | debug
  },

  security: {
    detectors: {
      pathProbing: {
        enabled: true
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
        duration: 300_000 // 5 min
      }
    }
  },

  http: {
    ignorePaths: [],
    slowThreshold: null
  }
};

/*export const defaultConfig = {
  logger: {
    mode: 'threat' // silent | threat | debug
  },

  security: {
    pathProbing: {
      enabled: true
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

  http: {
    ignorePaths: [],
    slowThreshold: null
  }
};
*/