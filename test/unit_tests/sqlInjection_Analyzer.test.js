import { jest } from '@jest/globals';

// 1. MOCK de la creación de señal
jest.unstable_mockModule('../src/signals/createSignal.js', () => ({
  createSignal: jest.fn((data) => ({ ...data, id: 'sqli-threat-id' }))
}));

const { createSQLInjectionAnalyzer } = await import('../src/analyzers/sqlInjection_Analyzer.js');

describe('SQL Injection Analyzer - Unit Tests', () => {
  let mockBus;
  let mockLogger;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBus = { emit: jest.fn() };
    mockLogger = { debug: jest.fn(), warn: jest.fn() };
  });

  test('debe emitir amenaza si el score es igual o mayor al threshold', () => {
    const analyzer = createSQLInjectionAnalyzer({ bus: mockBus, logger: mockLogger });
    
    const suspicionSignal = {
      type: 'sqli.suspicion',
      data: { score: 12, threshold: 10 },
      event: { request: { ip: '1.2.3.4' } }
    };

    analyzer(suspicionSignal);

    expect(mockBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'threat.sql_injection',
        level: 'high'
      })
    );
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  test('NO debe emitir amenaza si el score es menor al threshold', () => {
    const analyzer = createSQLInjectionAnalyzer({ bus: mockBus, logger: mockLogger });
    
    const suspicionSignal = {
      type: 'sqli.suspicion',
      data: { score: 4, threshold: 10 },
      event: { request: { ip: '1.2.3.4' } }
    };

    analyzer(suspicionSignal);

    expect(mockBus.emit).not.toHaveBeenCalled();
  });
});