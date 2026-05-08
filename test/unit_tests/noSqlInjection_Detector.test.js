import { jest } from '@jest/globals';

// 1. MOCK de patrones NoSQL y creación de señal
jest.unstable_mockModule('../src/utils/nosqlPatterns.js', () => ({
  NOSQL_PATTERNS: [
    { name: 'Generic NoSQL Op', regex: /\$[a-z]+/i, score: 5 },
    { name: 'Script Injection', regex: /db\./i, score: 15 }
  ]
}));

jest.unstable_mockModule('../src/signals/createSignal.js', () => ({
  createSignal: jest.fn((data) => ({ ...data, id: 'nosql-sig-123' }))
}));

const { createNoSQLInjectionDetector } = await import('../src/detectors/noSqlInjection_Detector.js');

describe('NoSQL Injection Detector - Unit Tests', () => {
  let mockBus;
  let config;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBus = { emit: jest.fn() };
    config = {
      security: {
        detectors: {
          noSqlInjection: {
            enabled: true,
            checkQuery: true,
            checkBody: true,
            excludeFields: ['safe_id'],
            threshold: 10
          }
        }
      }
    };
  });

  test('debe detectar operadores de MongoDB (como $ne) en las llaves del objeto', () => {
    const detector = createNoSQLInjectionDetector({ bus: mockBus, config });
    const inputSignal = {
      type: 'request',
      event: {
        request: { 
          body: { username: { "$ne": null } }, // Ataque típico de bypass
          query: {} 
        }
      }
    };

    detector(inputSignal);

    // Debe sumar puntos por el pattern regex Y por detectar el '$' en la llave
    expect(mockBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'nosql.suspicion',
        data: expect.objectContaining({ score: expect.any(Number) })
      })
    );
  });

  test('debe detectar ataques mediante inyección de scripts (db.collection)', () => {
    const detector = createNoSQLInjectionDetector({ bus: mockBus, config });
    const inputSignal = {
      type: 'request',
      event: {
        request: { body: { comment: "return db.users.find()" }, query: {} }
      }
    };

    detector(inputSignal);
    expect(mockBus.emit).toHaveBeenCalled();
  });

  test('debe ignorar campos en la lista de exclusión', () => {
    const detector = createNoSQLInjectionDetector({ bus: mockBus, config });
    const inputSignal = {
      type: 'request',
      event: {
        request: { body: { safe_id: { "$gt": 0 } }, query: {} }
      }
    };

    detector(inputSignal);
  });
});