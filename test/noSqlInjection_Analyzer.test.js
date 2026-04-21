import { jest } from '@jest/globals';

// 1. MOCK de la creación de señal
jest.unstable_mockModule('../src/signals/createSignal.js', () => ({
  createSignal: jest.fn((data) => ({ ...data, id: 'nosql-threat-999' }))
}));

const { createNoSQLInjectionAnalyzer } = await import('../src/analyzers/noSqlInjection_Analyzer.js');

describe('NoSQL Injection Analyzer - Unit Tests', () => {
  let mockBus;
  let mockLogger;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBus = { emit: jest.fn() };
    mockLogger = { debug: jest.fn(), warn: jest.fn() };
  });

  test('debe escalar a amenaza cuando el score supera el threshold', () => {
    const analyzer = createNoSQLInjectionAnalyzer({ bus: mockBus, logger: mockLogger });
    
    const suspicionSignal = {
      type: 'nosql.suspicion',
      data: { score: 20, threshold: 10 },
      event: { request: { ip: '10.0.0.5', path: '/api/data' } }
    };

    analyzer(suspicionSignal);

    expect(mockBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'threat.nosql_injection',
        level: 'high',
        data: expect.objectContaining({ ip: '10.0.0.5', score: 20 })
      })
    );
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  test('NO debe emitir amenaza si el score es insuficiente', () => {
    const analyzer = createNoSQLInjectionAnalyzer({ bus: mockBus, logger: mockLogger });
    
    const suspicionSignal = {
      type: 'nosql.suspicion',
      data: { score: 5, threshold: 10 },
      event: { request: { ip: '10.0.0.5' } }
    };

    analyzer(suspicionSignal);

    expect(mockBus.emit).not.toHaveBeenCalled();
  });
});