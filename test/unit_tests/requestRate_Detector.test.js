import { jest } from '@jest/globals';

// 1. MOCK de creación de señal
jest.unstable_mockModule('../src/signals/createSignal.js', () => ({
  createSignal: jest.fn((data) => ({ ...data, id: 'dos-rate-id' }))
}));

const { createRequestRateDetector } = await import('../src/detectors/requestRate_Detector.js');

describe('Request Rate Detector - Unit Tests', () => {
  let mockBus;
  let config;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBus = { emit: jest.fn() };
    config = {
      enabled: true,
      windowMs: 1000, // 1 segundo para el test
      threshold: 3,    // Solo 3 peticiones para disparar
      cooldownMs: 500
    };
  });

  test('debe emitir señal al alcanzar el umbral de peticiones', () => {
    const detector = createRequestRateDetector({ bus: mockBus, config });
    const signal = { type: 'request', event: { request: { ip: '1.1.1.1' } } };

    detector(signal); // 1
    detector(signal); // 2
    detector(signal); // 3 - Dispara

    expect(mockBus.emit).toHaveBeenCalledTimes(1);
    expect(mockBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'request.high_rate' })
    );
  });

  test('debe respetar el tiempo de cooldown para no duplicar señales', () => {
    const detector = createRequestRateDetector({ bus: mockBus, config });
    const signal = { type: 'request', event: { request: { ip: '1.1.1.1' } } };

    detector(signal); detector(signal); detector(signal); // Dispara 1
    detector(signal); // Debería disparar 2 por lógica de conteo, pero el COOLDOWN lo evita

    expect(mockBus.emit).toHaveBeenCalledTimes(1); 
  });

  test('debe reiniciar el contador si pasa el tiempo de la ventana', async () => {
    const detector = createRequestRateDetector({ bus: mockBus, config });
    const signal = { type: 'request', event: { request: { ip: '1.1.1.1' } } };

    detector(signal); // 1
    detector(signal); // 2
    
    // Simulamos espera manual (promesa) mayor a windowMs
    await new Promise(r => setTimeout(r, 1100));

    detector(signal); // Debería ser el nuevo 1, no el 3.
    
    expect(mockBus.emit).not.toHaveBeenCalled();
  });
});