import { jest } from '@jest/globals';

// 1. MOCK de la creación de señal
jest.unstable_mockModule('../src/signals/createSignal.js', () => ({
  createSignal: jest.fn((data) => ({ ...data, id: 'scraping-threat-id' }))
}));

const { createScrapingAnalyzer } = await import('../src/analyzers/scrapingAnalyzer.js');

describe('Scraping Analyzer - Unit Tests', () => {
  let mockBus;
  let mockLogger;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBus = { emit: jest.fn() };
    mockLogger = { debug: jest.fn(), warn: jest.fn() };
  });

  test('debe emitir amenaza high cuando el score supera el umbral', () => {
    const analyzer = createScrapingAnalyzer({ bus: mockBus, logger: mockLogger });
    
    const suspicionSignal = {
      type: 'scraping.suspicion',
      data: { 
        score: 20, 
        threshold: 15, 
        detections: ['Python Bot', 'Missing User-Agent'] 
      },
      event: { request: { ip: '5.5.5.5', path: '/api/v1/products' } }
    };

    analyzer(suspicionSignal);

    expect(mockBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'threat.scraping',
        level: 'high',
        data: expect.objectContaining({
          score: 20,
          ip: '5.5.5.5'
        })
      })
    );
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  test('NO debe emitir amenaza si el score es inferior al umbral', () => {
    const analyzer = createScrapingAnalyzer({ bus: mockBus, logger: mockLogger });
    
    const suspicionSignal = {
      type: 'scraping.suspicion',
      data: { score: 5, threshold: 15, detections: ['Low confidence'] },
      event: { request: { ip: '5.5.5.5' } }
    };

    analyzer(suspicionSignal);

    expect(mockBus.emit).not.toHaveBeenCalled();
  });
});