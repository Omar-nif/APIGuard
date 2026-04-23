import { jest } from '@jest/globals';

// 1. MOCK de la función createSignal
jest.unstable_mockModule('../src/signals/createSignal.js', () => ({
  createSignal: jest.fn((data) => ({ ...data, id: 'mock-signal-id' }))
}));

// 2. Importación dinámica del detector
const { createAuthFailedDetector } = await import('../src/detectors/authFailed_Detector.js');

describe('AuthFailed Detector - Unit Tests', () => {
  let mockBus;
  let config;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBus = { emit: jest.fn() };
    config = {
      security: {
        detectors: {
          bruteForce: {
            enabled: true,
            authPaths: ['/api/login'],
            methods: ['POST'],
            failureStatusCodes: [401]
          }
        }
      }
    };
  });

  test('debe emitir una señal cuando detecta un login fallido (401)', () => {
    const detector = createAuthFailedDetector({ bus: mockBus, config });

    // Simulamos una señal de entrada del middleware
    const inputSignal = {
      type: 'request',
      event: {
        request: { path: '/api/login', method: 'POST', ip: '1.1.1.1', body: { username: 'admin' } },
        response: { statusCode: 401 }
      }
    };

    detector(inputSignal);

    // Verificamos que se emitió una señal al bus
    expect(mockBus.emit).toHaveBeenCalled();
    // Verificamos que los datos de la señal sean correctos
    expect(mockBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'auth.failed',
        data: expect.objectContaining({ username: 'admin', ip: '1.1.1.1' })
      })
    );
  });

  test('NO debe emitir señal si el login es exitoso (200)', () => {
    const detector = createAuthFailedDetector({ bus: mockBus, config });

    const inputSignal = {
      type: 'request',
      event: {
        request: { path: '/api/login', method: 'POST' },
        response: { statusCode: 200 } // Éxito
      }
    };

    detector(inputSignal);

    expect(mockBus.emit).not.toHaveBeenCalled();
  });

  test('NO debe emitir señal si la ruta no es de autenticación', () => {
    const detector = createAuthFailedDetector({ bus: mockBus, config });

    const inputSignal = {
      type: 'request',
      event: {
        request: { path: '/api/perfil', method: 'POST' },
        response: { statusCode: 401 }
      }
    };

    detector(inputSignal);

    expect(mockBus.emit).not.toHaveBeenCalled();
  });
});