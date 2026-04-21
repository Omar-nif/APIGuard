import { jest } from '@jest/globals';

// 1. MOCK de creación de señal
jest.unstable_mockModule('../src/signals/createSignal.js', () => ({
  createSignal: jest.fn((data) => ({ ...data, id: 'endpoint-rate-id' }))
}));

const { createEndpointRateDetector } = await import('../src/detectors/endpointRate_Detector.js');

describe('Endpoint Rate Detector - Unit Tests', () => {
  let mockBus;
  let config;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBus = { emit: jest.fn() };
    config = {
      enabled: true,
      windowMs: 1000,
      threshold: 2, // Umbral bajo para testear rápido
      cooldownMs: 500
    };
  });

  test('debe disparar señal cuando una IP satura un endpoint específico', () => {
    const detector = createEndpointRateDetector({ bus: mockBus, config });
    const signal = { 
      type: 'request', 
      event: { request: { ip: '1.1.1.1', path: '/api/login' } } 
    };

    detector(signal); // 1
    detector(signal); // 2 - Dispara

    expect(mockBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'endpoint.high_rate',
        data: expect.objectContaining({ path: '/api/login', ip: '1.1.1.1' })
      })
    );
  });

  test('NO debe sumar peticiones de diferentes endpoints para la misma IP', () => {
    const detector = createEndpointRateDetector({ bus: mockBus, config });
    
    // Petición a ruta A
    detector({ type: 'request', event: { request: { ip: '1.1.1.1', path: '/api/A' } } });
    // Petición a ruta B
    detector({ type: 'request', event: { request: { ip: '1.1.1.1', path: '/api/B' } } });

    // Aunque la IP lleva 2 peticiones totales, ninguna ruta ha llegado al threshold (2)
    expect(mockBus.emit).not.toHaveBeenCalled();
  });

  test('debe respetar el cooldown por cada combinación IP:Path', () => {
    const detector = createEndpointRateDetector({ bus: mockBus, config });
    const signal = { 
      type: 'request', 
      event: { request: { ip: '1.1.1.1', path: '/api/login' } } 
    };

    detector(signal); detector(signal); // Dispara 1
    detector(signal); // Debería disparar 2 por conteo, pero cooldown lo bloquea
    
    expect(mockBus.emit).toHaveBeenCalledTimes(1);
  });
});