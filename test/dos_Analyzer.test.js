import { jest } from '@jest/globals';

// 1. MOCK de creación de señal
jest.unstable_mockModule('../src/signals/createSignal.js', () => ({
  createSignal: jest.fn((data) => ({ ...data, id: 'dos-threat-id' }))
}));

const { createDosAnalyzer } = await import('../src/analyzers/dosAnalyzer.js');

describe('DoS Analyzer - Unit Tests', () => {
  let mockBus;
  let mockLogger;
  let config;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBus = { emit: jest.fn() };
    mockLogger = { threat: jest.fn() };
    config = {
      security: {
        detectors: {
          dos: {
            requestFlood: { enabled: true },
            endpointFlood: { enabled: true }
          }
        }
      }
    };
  });

  test('debe traducir una señal de tasa alta a una amenaza de inundación de peticiones', () => {
    const analyzer = createDosAnalyzer({ bus: mockBus, logger: mockLogger, config });
    
    const signal = {
        type: 'request.high_rate',
        event: { request: { ip: '192.168.1.1' } },
        data: { requests: 100, windowMs: 10000 }
      };

    analyzer(signal);

    expect(mockBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'threat.dos.request_flood',
          level: 'high',
          event: expect.objectContaining({
            request: { ip: '192.168.1.1' }
          }),
          data: expect.objectContaining({ 
            engine: 'APIGuard_DoS_Core',
            requests: 100 
          })
        })
      );
      expect(mockLogger.threat).toHaveBeenCalled();
    });

  test('debe traducir correctamente un flood de endpoint específico', () => {
    const analyzer = createDosAnalyzer({ bus: mockBus, config });
    
    const signal = {
      type: 'endpoint.high_rate',
      event: { request: { ip: '192.168.1.1' } },
      data: { path: '/api/login', requests: 50 }
    };

    analyzer(signal);

    expect(mockBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'threat.dos.endpoint_flood'
      })
    );
  });

  test('NO debe emitir nada si el tipo de señal no está mapeado', () => {
    const analyzer = createDosAnalyzer({ bus: mockBus, config });
    
    // Una señal que no es de DoS (aunque fuera válida para otro analyzer)
    analyzer({ type: 'other.signal' });

    expect(mockBus.emit).not.toHaveBeenCalled();
  });
});