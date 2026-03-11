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
          windowMs: 10_000,
          threshold: 50,
          cooldownMs: 5000
        },

        endpointFlood: {
          enabled: true,
          windowMs: 10_000,
          threshold: 50,
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
        delay: {
          min: 500,
          max: 4000
        }
      },

      'threat.dos': {
        action: 'delay',
        scope: 'ip',
        duration: 60_000,
        delay: {
          min: 200,
          max: 2000
        }
      }
    }
  },

  http: {
    ignorePaths: [],
    slowThreshold: null
  }
};

/*
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
        action: 'delay',
        scope: 'ip',
        duration: 120_000,
        delay: {
          min: 500,
          max: 4000
        }
      }
    }
  },

  http: {
    ignorePaths: [],
    slowThreshold: null
  }
};*/