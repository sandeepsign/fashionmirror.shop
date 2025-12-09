/**
 * Unit Tests for Widget Auth Middleware
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import type { Merchant } from '@shared/schema';

// Mock the storage module
const mockGetMerchantByApiKey = vi.fn();
const mockResetMerchantQuota = vi.fn();

vi.mock('../storage', () => ({
  getStorage: vi.fn().mockResolvedValue({
    getMerchantByApiKey: (key: string) => mockGetMerchantByApiKey(key),
    resetMerchantQuota: (id: number, date: Date) => mockResetMerchantQuota(id, date),
  }),
}));

// Import after mocking
import { widgetAuth, checkQuota, optionalWidgetAuth } from './widgetAuth';

describe('widgetAuth middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let responseJson: any;
  let responseStatus: number;

  const activeMerchant: Merchant = {
    id: 1,
    email: 'test@example.com',
    businessName: 'Test Business',
    passwordHash: 'hash',
    liveApiKey: 'mk_live_test123',
    testApiKey: 'mk_test_test123',
    webhookUrl: null,
    webhookSecret: null,
    allowedDomains: ['example.com', '*.myshop.com'],
    plan: 'growth',
    status: 'active',
    monthlyQuota: 1000,
    quotaUsed: 50,
    quotaResetAt: new Date(Date.now() + 86400000),
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerified: true,
    emailVerificationToken: null,
    emailVerificationExpires: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    responseJson = null;
    responseStatus = 200;

    mockRequest = {
      headers: {},
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' } as any,
    };

    mockResponse = {
      status: vi.fn().mockImplementation((code: number) => {
        responseStatus = code;
        return mockResponse;
      }),
      json: vi.fn().mockImplementation((data: any) => {
        responseJson = data;
        return mockResponse;
      }),
      setHeader: vi.fn(),
    };

    nextFunction = vi.fn();
    mockGetMerchantByApiKey.mockResolvedValue(null);
  });

  describe('missing API key', () => {
    it('should return 401 when X-Merchant-Key header is missing', async () => {
      await widgetAuth(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(responseStatus).toBe(401);
      expect(responseJson.success).toBe(false);
      expect(responseJson.error.code).toBe('MISSING_API_KEY');
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('invalid API key format', () => {
    it('should return 401 for invalid key format', async () => {
      mockRequest.headers = { 'x-merchant-key': 'invalid_key' };

      await widgetAuth(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(responseStatus).toBe(401);
      expect(responseJson.error.code).toBe('INVALID_API_KEY_FORMAT');
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('merchant not found', () => {
    it('should return 401 when merchant is not found', async () => {
      mockRequest.headers = { 'x-merchant-key': 'mk_test_nonexistent' };
      mockGetMerchantByApiKey.mockResolvedValue(null);

      await widgetAuth(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(responseStatus).toBe(401);
      expect(responseJson.error.code).toBe('INVALID_MERCHANT_KEY');
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('suspended merchant', () => {
    it('should return 403 when merchant is suspended', async () => {
      mockRequest.headers = { 'x-merchant-key': 'mk_test_test123' };
      mockGetMerchantByApiKey.mockResolvedValue({
        ...activeMerchant,
        status: 'suspended',
      });

      await widgetAuth(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(responseStatus).toBe(403);
      expect(responseJson.error.code).toBe('MERCHANT_SUSPENDED');
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('domain validation', () => {
    it('should allow requests from allowed domains', async () => {
      mockRequest.headers = {
        'x-merchant-key': 'mk_live_test123',
        origin: 'https://example.com',
      };
      mockGetMerchantByApiKey.mockResolvedValue(activeMerchant);

      await widgetAuth(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow wildcard subdomain matches', async () => {
      mockRequest.headers = {
        'x-merchant-key': 'mk_live_test123',
        origin: 'https://shop.myshop.com',
      };
      mockGetMerchantByApiKey.mockResolvedValue(activeMerchant);

      await widgetAuth(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should reject requests from non-allowed domains', async () => {
      mockRequest.headers = {
        'x-merchant-key': 'mk_live_test123',
        origin: 'https://evil.com',
      };
      mockGetMerchantByApiKey.mockResolvedValue(activeMerchant);

      await widgetAuth(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(responseStatus).toBe(403);
      expect(responseJson.error.code).toBe('DOMAIN_NOT_ALLOWED');
    });

    it('should allow localhost for test keys', async () => {
      mockRequest.headers = {
        'x-merchant-key': 'mk_test_test123',
        origin: 'http://localhost:3000',
      };
      mockGetMerchantByApiKey.mockResolvedValue(activeMerchant);

      await widgetAuth(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('successful authentication', () => {
    it('should attach merchant to request on success', async () => {
      mockRequest.headers = { 'x-merchant-key': 'mk_test_test123' };
      mockGetMerchantByApiKey.mockResolvedValue(activeMerchant);

      await widgetAuth(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect((mockRequest as any).merchant).toEqual(activeMerchant);
      expect((mockRequest as any).isTestMode).toBe(true);
    });

    it('should set rate limit headers', async () => {
      mockRequest.headers = { 'x-merchant-key': 'mk_test_test123' };
      mockGetMerchantByApiKey.mockResolvedValue(activeMerchant);

      await widgetAuth(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', expect.any(Number));
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(Number));
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(Number));
    });
  });
});

describe('checkQuota middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let responseJson: any;
  let responseStatus: number;

  beforeEach(() => {
    responseJson = null;
    responseStatus = 200;

    mockRequest = {};

    mockResponse = {
      status: vi.fn().mockImplementation((code: number) => {
        responseStatus = code;
        return mockResponse;
      }),
      json: vi.fn().mockImplementation((data: any) => {
        responseJson = data;
        return mockResponse;
      }),
    };

    nextFunction = vi.fn();
  });

  it('should return 401 when merchant is not attached', async () => {
    await checkQuota(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(responseStatus).toBe(401);
    expect(responseJson.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 402 when quota is exceeded', async () => {
    (mockRequest as any).merchant = {
      monthlyQuota: 100,
      quotaUsed: 100,
    };

    await checkQuota(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(responseStatus).toBe(402);
    expect(responseJson.error.code).toBe('QUOTA_EXCEEDED');
  });

  it('should call next when quota is available', async () => {
    (mockRequest as any).merchant = {
      monthlyQuota: 100,
      quotaUsed: 50,
    };

    await checkQuota(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalled();
  });
});

describe('optionalWidgetAuth middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest = {
      headers: {},
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' } as any,
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    };

    nextFunction = vi.fn();
  });

  it('should call next without validation when no API key', async () => {
    await optionalWidgetAuth(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalled();
    expect((mockRequest as any).merchant).toBeUndefined();
  });
});
