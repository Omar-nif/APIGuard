import { jest } from '@jest/globals';

// 1. MOCK de la función createSignal
jest.unstable_mockModule('../src/signals/createSignal.js', () => ({
  createSignal: jest.fn((data) => ({ ...data, id: 'threat-id-999' }))
}));

// 2. Importación dinámica
const { createAuthBruteForceAnalyzer } = await import('../src/analyzers/authBruteForceAnalyzer.js');

describe('AuthBruteForce Analyzer - Unit Tests', () => {
  let mockBus;
  let mockLogger;
  let config;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBus = { emit: jest.fn() };
    mockLogger = { threat: jest.fn(), debug: jest.fn() };
    config = {
      security: {
        detectors: {
          bruteForce: {
            enabled: true,
            windowMS: 1000, // Ventana corta para el test
            threshold: 3    // Bajamos el limite a 3 para probar rápido
          }
        }
      }
    };
  });

  test('debe incrementar intentos sin emitir amenaza antes del umbral', () => {
    const analyzer = createAuthBruteForceAnalyzer({ bus: mockBus, config });
    const signal = { type: 'auth.failed', event: { request: { ip: '1.1.1.1' } } };

    analyzer(signal); // Intento 1
    analyzer(signal); // Intento 2

    // Verificamos que el bus NO ha emitido ninguna amenaza aún
    expect(mockBus.emit).not.toHaveBeenCalled();
  });

  test('debe emitir threat.auth_bruteforce al alcanzar el umbral', () => {
    const analyzer = createAuthBruteForceAnalyzer({ bus: mockBus, config });
    const signal = { type: 'auth.failed', event: { request: { ip: '1.1.1.1' } } };

    analyzer(signal); // 1
    analyzer(signal); // 2
    analyzer(signal); // 3 -> Aquí debe dispararse

    expect(mockBus.emit).toHaveBeenCalledTimes(1);
    expect(mockBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'threat.auth_bruteforce' })
    );
  });

  test('debe resetear el contador después de detectar una amenaza', () => {
    const analyzer = createAuthBruteForceAnalyzer({ bus: mockBus, config });
    const signal = { type: 'auth.failed', event: { request: { ip: '1.1.1.1' } } };

    // Primer ciclo de ataque
    analyzer(signal); analyzer(signal); analyzer(signal); 
    expect(mockBus.emit).toHaveBeenCalledTimes(1);

    // Si llega una señal más, debe empezar de 0 (o sea, ser el intento 1 del nuevo ciclo)
    analyzer(signal); 
    expect(mockBus.emit).toHaveBeenCalledTimes(1); // No sube a 2 porque el estado se borró
  });
});