import { jest } from '@jest/globals';

// 1. MOCK del bus 
const mockBus = {
  registerAction: jest.fn()
};

describe('Decision Engine - Unit Tests', () => {
  let mockStore;
  let mockLogger;
  let config;
  let createDecisionEngine;
  let threatHandler;

  beforeAll(async () => {
    const module = await import('../src/core/decision/decisionEngine.js');
    createDecisionEngine = module.createDecisionEngine;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock del almacén de decisiones
    mockStore = {
      match: jest.fn(),
      register: jest.fn()
    };

    mockLogger = { warn: jest.fn() };

    config = {
      security: {
        policies: {
          'threat.dos': { action: 'delay', duration: 10000, scope: ['ip'], delay: 500 },
          'threat.sql_injection': { action: 'block', duration: 3600000, scope: ['ip'] }
        }
      }
    };

    // Inicializamos el motor
    createDecisionEngine({ 
      bus: mockBus, 
      decisionStore: mockStore, 
      logger: mockLogger, 
      config 
    });

    // Capturamos el handler que el motor registró en el bus
    threatHandler = mockBus.registerAction.mock.calls[0][0];
  });

  test('debe crear una decisión inicial basada en la política jerárquica', () => {
    const signal = {
      type: 'threat.dos.request_flood',
      level: 'high',
      event: { request: { ip: '192.168.1.100' } }
    };

    mockStore.match.mockReturnValue(null);

    threatHandler(signal);

    expect(mockStore.register).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'delay', // Viene de la política padre 'threat.dos'
        reason: 'threat.dos.request_flood'
      })
    );
  });

  test('debe escalar la acción y duplicar duración si hay una decisión previa', () => {
    const signal = {
      type: 'threat.dos',
      level: 'high',
      event: { request: { ip: '192.168.1.100' } }
    };

    mockStore.match.mockReturnValue({
      action: 'delay',
      duration: 10000
    });

    threatHandler(signal);

    expect(mockStore.register).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'rateLimit', // delay -> rateLimit
        duration: 20000
      })
    );
  });

  test('debe aplicar el scope correctamente (IP + Path)', () => {
    config.security.policies['threat.test'] = { 
      action: 'block', 
      duration: 5000, 
      scope: ['ip', 'path'] 
    };

    const signal = {
      type: 'threat.test',
      level: 'high',
      event: { request: { ip: '1.1.1.1', path: '/login' } }
    };

    threatHandler(signal);

    expect(mockStore.register).toHaveBeenCalledWith(
      expect.objectContaining({
        match: { ip: '1.1.1.1', path: '/login' }
      })
    );
  });
});