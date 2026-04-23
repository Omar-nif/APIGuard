import { jest } from '@jest/globals';

// 1. MOCK de los patrones SQL y la creación de señal
jest.unstable_mockModule('../src/utils/sqlPatterns.js', () => ({
  SQL_PATTERNS: [
    { name: 'OR 1=1', regex: /OR 1=1/i, score: 5 },
    { name: 'DROP TABLE', regex: /DROP TABLE/i, score: 10 }
  ]
}));

jest.unstable_mockModule('..//src/signals/createSignal.js', () => ({
  createSignal: jest.fn((data) => ({ ...data, id: 'sqli-signal-id' }))
}));

const { createSQLInjectionDetector } = await import('../src/detectors/SQLInjection_Detector.js');

describe('SQL Injection Detector - Unit Tests', () => {
  let mockBus;
  let config;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBus = { emit: jest.fn() };
    config = {
      security: {
        detectors: {
          sqlInjection: {
            enabled: true,
            checkQuery: true,
            checkBody: true,
            excludeFields: ['token'],
            threshold: 5
          }
        }
      }
    };
  });

  test('debe detectar un ataque simple en el query string', () => {
    const detector = createSQLInjectionDetector({ bus: mockBus, config });
    const inputSignal = {
      type: 'request',
      event: {
        request: { query: { id: '1 OR 1=1' }, body: {} }
      }
    };

    detector(inputSignal);

    expect(mockBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'sqli.suspicion',
        data: expect.objectContaining({ score: 5 })
      })
    );
  });

  test('debe ignorar campos configurados en excludeFields', () => {
    const detector = createSQLInjectionDetector({ bus: mockBus, config });
    const inputSignal = {
      type: 'request',
      event: {
        request: { query: {}, body: { token: 'DROP TABLE' } } // Campo excluido
      }
    };

    detector(inputSignal);
    expect(mockBus.emit).not.toHaveBeenCalled();
  });

  test('debe acumular el score si hay múltiples patrones', () => {
    const detector = createSQLInjectionDetector({ bus: mockBus, config });
    const inputSignal = {
      type: 'request',
      event: {
        request: { query: { q: 'OR 1=1' }, body: { comment: 'DROP TABLE' } }
      }
    };

    detector(inputSignal);
    expect(mockBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ score: 15 }) // 5 + 10
      })
    );
  });
});