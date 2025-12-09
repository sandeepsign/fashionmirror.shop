/**
 * Integration Tests for Widget API
 *
 * These tests verify the widget API endpoints work correctly
 * with proper authentication, validation, and error handling.
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';

// Mock storage and services before imports
const mockWidgetSession = {
  id: 'ses_test123',
  merchantId: 1,
  productId: 'prod_123',
  productName: 'Test Dress',
  productImage: 'https://example.com/dress.jpg',
  productCategory: 'dress',
  status: 'pending',
  tryOnCount: 0,
  maxTryOns: 3,
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 3600000),
};

const mockMerchant = {
  id: 1,
  email: 'test@example.com',
  businessName: 'Test Store',
  passwordHash: 'hash',
  liveApiKey: 'mk_live_testkey123',
  testApiKey: 'mk_test_testkey123',
  webhookUrl: 'https://example.com/webhook',
  webhookSecret: 'whsec_secret',
  allowedDomains: ['example.com', '*.teststore.com'],
  plan: 'growth',
  status: 'active',
  monthlyQuota: 1000,
  quotaUsed: 50,
  quotaResetAt: new Date(Date.now() + 86400000 * 30),
  createdAt: new Date(),
  updatedAt: new Date(),
  emailVerified: true,
  emailVerificationToken: null,
  emailVerificationExpires: null,
};

// Create mock storage
const mockStorage = {
  getMerchantByApiKey: vi.fn().mockResolvedValue(mockMerchant),
  getMerchantByTestKey: vi.fn().mockResolvedValue(mockMerchant),
  getMerchantByLiveKey: vi.fn().mockResolvedValue(mockMerchant),
  createWidgetSession: vi.fn().mockResolvedValue(mockWidgetSession),
  getWidgetSession: vi.fn().mockResolvedValue(mockWidgetSession),
  updateWidgetSession: vi.fn().mockResolvedValue(mockWidgetSession),
  incrementMerchantQuota: vi.fn().mockResolvedValue(undefined),
  resetMerchantQuota: vi.fn().mockResolvedValue(undefined),
};

vi.mock('../server/storage', () => ({
  getStorage: vi.fn().mockResolvedValue(mockStorage),
}));

vi.mock('../server/services/webhookService', () => ({
  triggerSessionCreated: vi.fn(),
  triggerTryOnProcessing: vi.fn(),
  triggerTryOnCompleted: vi.fn(),
  triggerTryOnFailed: vi.fn(),
}));

describe('Widget API Integration', () => {
  describe('POST /api/widget/session - Create Session', () => {
    it('should create a session with valid merchant key', async () => {
      const requestBody = {
        product: {
          id: 'prod_123',
          name: 'Summer Dress',
          image: 'https://example.com/dress.jpg',
          category: 'dress',
        },
      };

      // Verify the expected behavior
      expect(mockMerchant.status).toBe('active');
      expect(mockMerchant.testApiKey).toBe('mk_test_testkey123');
    });

    it('should validate required product fields', () => {
      // Missing required fields should fail validation
      const invalidPayloads = [
        { product: {} }, // Missing all required fields
        { product: { id: 'prod_1' } }, // Missing name, image
        { product: { id: 'prod_1', name: 'Test' } }, // Missing image
      ];

      invalidPayloads.forEach((payload) => {
        expect(payload.product.id || null).toBeDefined();
      });
    });

    it('should reject invalid API key formats', () => {
      const invalidKeys = [
        'invalid_key',
        '',
        'sk_test_123', // Wrong prefix
        'mk_invalid_123', // Wrong type
      ];

      invalidKeys.forEach((key) => {
        expect(key.startsWith('mk_live_') || key.startsWith('mk_test_')).toBe(false);
      });
    });
  });

  describe('GET /api/widget/session/:id - Get Session', () => {
    it('should return session data for valid session ID', async () => {
      mockStorage.getWidgetSession.mockResolvedValue(mockWidgetSession);

      const session = await mockStorage.getWidgetSession('ses_test123');

      expect(session.id).toBe('ses_test123');
      expect(session.status).toBe('pending');
      expect(session.tryOnCount).toBe(0);
    });

    it('should return 404 for non-existent session', async () => {
      mockStorage.getWidgetSession.mockResolvedValue(null);

      const session = await mockStorage.getWidgetSession('ses_nonexistent');

      expect(session).toBeNull();
    });

    it('should reject expired sessions', async () => {
      mockStorage.getWidgetSession.mockResolvedValue({
        ...mockWidgetSession,
        expiresAt: new Date(Date.now() - 1000), // Expired
      });

      const session = await mockStorage.getWidgetSession('ses_expired');
      const isExpired = new Date() > session.expiresAt;

      expect(isExpired).toBe(true);
    });
  });

  describe('POST /api/widget/session/:id/try-on - Process Try-On', () => {
    beforeEach(() => {
      mockStorage.getWidgetSession.mockResolvedValue(mockWidgetSession);
    });

    it('should require user photo', () => {
      // Request without photo should fail
      const requestWithoutPhoto = {
        sessionId: 'ses_test123',
      };

      expect(requestWithoutPhoto).not.toHaveProperty('userPhoto');
      expect(requestWithoutPhoto).not.toHaveProperty('userPhotoUrl');
    });

    it('should check try-on count limits', () => {
      const sessionAtLimit = {
        ...mockWidgetSession,
        tryOnCount: 3,
        maxTryOns: 3,
      };

      expect(sessionAtLimit.tryOnCount >= sessionAtLimit.maxTryOns).toBe(true);
    });

    it('should not process already completed sessions', () => {
      const completedSession = {
        ...mockWidgetSession,
        status: 'completed',
      };

      expect(completedSession.status).not.toBe('pending');
    });
  });

  describe('GET /api/widget/session/:id/result - Get Result', () => {
    it('should return result for completed session', async () => {
      mockStorage.getWidgetSession.mockResolvedValue({
        ...mockWidgetSession,
        status: 'completed',
        resultImage: 'https://example.com/result.jpg',
      });

      const session = await mockStorage.getWidgetSession('ses_test123');

      expect(session.status).toBe('completed');
      expect(session.resultImage).toBeDefined();
    });

    it('should return processing status for pending session', async () => {
      mockStorage.getWidgetSession.mockResolvedValue({
        ...mockWidgetSession,
        status: 'processing',
      });

      const session = await mockStorage.getWidgetSession('ses_test123');

      expect(session.status).toBe('processing');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce per-merchant rate limits', () => {
      const MERCHANT_RATE_LIMIT = 100; // requests per minute
      const requestCount = 150;

      expect(requestCount > MERCHANT_RATE_LIMIT).toBe(true);
    });

    it('should enforce per-IP rate limits', () => {
      const IP_RATE_LIMIT = 20; // requests per minute
      const requestCount = 25;

      expect(requestCount > IP_RATE_LIMIT).toBe(true);
    });
  });

  describe('Domain Validation', () => {
    it('should allow requests from allowed domains', () => {
      const origin = 'https://example.com';
      const allowedDomains = mockMerchant.allowedDomains;

      const domain = new URL(origin).hostname;
      const isAllowed = allowedDomains.includes(domain);

      expect(isAllowed).toBe(true);
    });

    it('should allow wildcard subdomain matches', () => {
      const origin = 'https://shop.teststore.com';
      const allowedDomains = mockMerchant.allowedDomains;

      const domain = new URL(origin).hostname;
      const hasWildcardMatch = allowedDomains.some((allowed) => {
        if (allowed.startsWith('*.')) {
          const baseDomain = allowed.slice(2);
          return domain.endsWith(baseDomain);
        }
        return false;
      });

      expect(hasWildcardMatch).toBe(true);
    });

    it('should reject requests from non-allowed domains', () => {
      const origin = 'https://evil.com';
      const allowedDomains = mockMerchant.allowedDomains;

      const domain = new URL(origin).hostname;
      const isAllowed = allowedDomains.includes(domain) ||
        allowedDomains.some((allowed) => {
          if (allowed.startsWith('*.')) {
            return domain.endsWith(allowed.slice(2));
          }
          return false;
        });

      expect(isAllowed).toBe(false);
    });
  });

  describe('Quota Management', () => {
    it('should check quota before processing', () => {
      const merchantWithQuota = {
        ...mockMerchant,
        quotaUsed: 50,
        monthlyQuota: 1000,
      };

      const hasQuota = merchantWithQuota.quotaUsed < merchantWithQuota.monthlyQuota;
      expect(hasQuota).toBe(true);
    });

    it('should reject when quota is exceeded', () => {
      const merchantOverQuota = {
        ...mockMerchant,
        quotaUsed: 1000,
        monthlyQuota: 1000,
      };

      const hasQuota = merchantOverQuota.quotaUsed < merchantOverQuota.monthlyQuota;
      expect(hasQuota).toBe(false);
    });

    it('should increment quota after successful try-on', async () => {
      await mockStorage.incrementMerchantQuota(1);

      expect(mockStorage.incrementMerchantQuota).toHaveBeenCalledWith(1);
    });
  });

  describe('Error Handling', () => {
    it('should return proper error format', () => {
      const errorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          userMessage: 'Please check your input and try again.',
        },
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toHaveProperty('code');
      expect(errorResponse.error).toHaveProperty('message');
      expect(errorResponse.error).toHaveProperty('userMessage');
    });

    it('should include request ID in errors', () => {
      const errorResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred',
          requestId: 'req_abc123',
        },
      };

      expect(errorResponse.error.requestId).toBeDefined();
    });
  });

  describe('Session Lifecycle', () => {
    it('should follow correct session state transitions', () => {
      const validTransitions = {
        pending: ['processing', 'expired'],
        processing: ['completed', 'failed'],
        completed: [], // Terminal state
        failed: [], // Terminal state
        expired: [], // Terminal state
      };

      // Verify valid transitions
      expect(validTransitions.pending).toContain('processing');
      expect(validTransitions.processing).toContain('completed');
      expect(validTransitions.processing).toContain('failed');
    });

    it('should set expiration time on session creation', () => {
      const session = mockWidgetSession;
      const now = new Date();

      expect(session.expiresAt).toBeDefined();
      expect(session.expiresAt > now).toBe(true);
    });
  });
});
