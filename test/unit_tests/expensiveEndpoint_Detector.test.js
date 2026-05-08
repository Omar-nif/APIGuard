import { jest } from '@jest/globals';

// 1. MOCK de creación de señal
jest.unstable_mockModule('../src/signals/createSignal.js', () => ({
  createSignal: jest.fn((data) => ({ ...data, id: 'exp-det-123' }))
}));

const { createExpensiveEndpointDetector } = await import('../src/detectors/expensiveEndpoint_Detector.js');

describe('Expensive Endpoint Detector - Unit Tests', () => {
  let mockBus;
  let mockLogger;
  let config;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBus = { emit: jest.fn() };
    mockLogger = { debug: jest.fn() };
    config = {
      security: {
        detectors: {
          dos: {
            expensiveEndpoints: {
              enabled: true,
              endpoints: ['/api/v1/reports', '/api/v1/search']
            }
          }
        }
      }
    };
  });

  test('debe emitir señal cuando se accede a un endpoint marcado como costoso', () => {
    const detector = createExpensiveEndpointDetector({ bus: mockBus, config, logger: mockLogger });
    const signal = { 
      type: 'request', 
      event: { request: { path: '/api/v1/reports', method: 'POST' } } 
    };

    detector(signal);

    expect(mockBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'dos.expensive_access',
        data: expect.objectContaining({ path: '/api/v1/reports', method: 'POST' })
      })
    );
  });

  test('NO debe emitir señal para rutas que no están en la lista de configuración', () => {
    const detector = createExpensiveEndpointDetector({ bus: mockBus, config });
    const signal = { 
      type: 'request', 
      event: { request: { path: '/api/v1/health', method: 'GET' } } 
    };

    detector(signal);

    expect(mockBus.emit).not.toHaveBeenCalled();
  });

  test('debe retornar una función vacía si el detector está deshabilitado', () => {
    config.security.detectors.dos.expensiveEndpoints.enabled = false;
    const detector = createExpensiveEndpointDetector({ bus: mockBus, config });
    
    // Si está deshabilitado, el detector es una función vacía que no hace nada
    expect(typeof detector).toBe('function');
    detector({ type: 'request' });
    expect(mockBus.emit).not.toHaveBeenCalled();
  });
});