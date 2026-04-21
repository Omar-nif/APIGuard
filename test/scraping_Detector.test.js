import { jest } from '@jest/globals';

// 1. MOCK de patrones de Scraping y creación de señal
jest.unstable_mockModule('../src/utils/scrapingPatterns.js', () => ({
  SCRAPING_PATTERNS: {
    BOT_AGENTS: [{ name: 'Python Bot', regex: /python-requests/i, score: 10 }],
    AUTOMATION_TOOLS: [{ name: 'Puppeteer', regex: /headless/i, score: 15 }],
    HUMAN_INDICATORS: ['accept-language', 'sec-ch-ua']
  }
}));

jest.unstable_mockModule('../src/signals/createSignal.js', () => ({
  createSignal: jest.fn((data) => ({ ...data, id: 'scraping-sig-123' }))
}));

const { createScrapingDetector } = await import('../src/detectors/scraping_Detector.js');

describe('Scraping Detector - Unit Tests', () => {
  let mockBus;
  let config;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBus = { emit: jest.fn() };
    config = {
      security: {
        detectors: {
          scraping: {
            enabled: true,
            threshold: 15
          }
        }
      }
    };
  });

  test('debe detectar un bot basado en el User-Agent', () => {
    const detector = createScrapingDetector({ bus: mockBus, config });
    const signal = {
      type: 'request',
      event: {
        request: {
          headers: { 'user-agent': 'python-requests/2.25.1', 'accept-language': 'es', 'sec-ch-ua': 'valid' }
        }
      }
    };

    detector(signal);

    expect(mockBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'scraping.suspicion',
        data: expect.objectContaining({
          detections: expect.arrayContaining(['Python Bot']),
          score: 10
        })
      })
    );
  });

  test('debe penalizar la ausencia total de User-Agent', () => {
    const detector = createScrapingDetector({ bus: mockBus, config });
    const signal = {
      type: 'request',
      event: { request: { headers: {} } } 
    };

    detector(signal);

    // Extraemos el argumento de la llamada para validar el score numéricamente
    const lastCall = mockBus.emit.mock.calls[0][0];
    expect(lastCall.data.score).toBeGreaterThanOrEqual(15);
  });

  test('debe acumular puntos si faltan cabeceras de navegación humana', () => {
    const detector = createScrapingDetector({ bus: mockBus, config });
    const signal = {
      type: 'request',
      event: {
        request: {
          headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0)' }
        }
      }
    };

    detector(signal);
    
    const lastCall = mockBus.emit.mock.calls[0][0];
    expect(lastCall.data.score).toBeGreaterThan(0);
  });
});