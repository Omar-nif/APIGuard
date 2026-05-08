import { jest } from '@jest/globals';

// 1. DEFINIMOS LOS MOCKS PRIMERO
jest.unstable_mockModule('../src/events/requestEvent.js', () => ({
  createRequestEvent: jest.fn((data) => data)
}));

jest.unstable_mockModule('../src/core/decision/applyDecision.js', () => ({
  applyDecision: jest.fn(({ res }) => res.status(403).json({ message: 'Blocked' }))
}));

jest.unstable_mockModule('../src/utils/generateRequestId.js', () => ({
  default: jest.fn(() => 'test-id-123')
}));

// 2. IMPORTACIÓN DINÁMICA 
const { default: createApiguardMiddleware } = await import('../src/middleware/middleware.js');

describe('APIGuard Middleware - Unit Tests', () => {
  let mockOnRequest;
  let mockDecisionStore;
  let mockConfig;
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks(); 

    mockOnRequest = jest.fn();
    mockDecisionStore = {
      match: jest.fn()
    };
    mockConfig = {
      http: { ignorePaths: ['/favicon.ico'], slowThreshold: 500 }
    };

    req = { 
      ip: '192.168.1.1', 
      path: '/api/test',
      on: jest.fn() 
    };
    res = {
      on: jest.fn((event, cb) => {
        if (event === 'finish') res.finishCallback = cb;
      }),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  test('debe lanzar error si falta onRequest o decisionStore', () => {
    expect(() => createApiguardMiddleware({ config: {} }))
      .toThrow('[APIGuard] onRequest callback is required');
    
    expect(() => createApiguardMiddleware({ onRequest: () => {}, config: {} }))
      .toThrow('[APIGuard] decisionStore is required');
  });

  test('debe bloquear la petición si hay una decisión previa en decisionStore', () => {
    mockDecisionStore.match.mockReturnValue({ action: 'block', reason: 'brute-force' });

    const middleware = createApiguardMiddleware({
      onRequest: mockOnRequest,
      config: mockConfig,
      decisionStore: mockDecisionStore
    });

    middleware(req, res, next);

    expect(mockDecisionStore.match).toHaveBeenCalledWith({ ip: req.ip, path: req.path });
    expect(next).not.toHaveBeenCalled();
  });

  test('debe llamar a onRequest con stage "request" y continuar con next()', () => {
    mockDecisionStore.match.mockReturnValue(null);

    const middleware = createApiguardMiddleware({
      onRequest: mockOnRequest,
      config: mockConfig,
      decisionStore: mockDecisionStore
    });

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(mockOnRequest).toHaveBeenCalledWith(
      expect.objectContaining({ stage: 'request' })
    );
  });
});