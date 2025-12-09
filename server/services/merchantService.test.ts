/**
 * Unit Tests for Merchant Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateApiKey,
  generateMerchantKeys,
  generateWebhookSecret,
  generateSessionId,
  hashPassword,
  verifyPassword,
  isTestKey,
  isLiveKey,
  isValidApiKeyFormat,
  isDomainAllowed,
  extractDomain,
  toPublicMerchant,
  getNextQuotaResetDate,
  isQuotaExceeded,
  shouldResetQuota,
  getPlanLimits,
  generateWebhookSignature,
  verifyWebhookSignature,
} from './merchantService';
import type { Merchant } from '@shared/schema';

describe('merchantService', () => {
  describe('generateApiKey', () => {
    it('should generate a key with the given prefix', () => {
      const key = generateApiKey('test_');
      expect(key).toMatch(/^test_/);
    });

    it('should generate unique keys', () => {
      const key1 = generateApiKey('prefix_');
      const key2 = generateApiKey('prefix_');
      expect(key1).not.toBe(key2);
    });

    it('should generate keys of appropriate length', () => {
      const key = generateApiKey('mk_');
      // Prefix (3) + base64url encoded 24 bytes (32 chars)
      expect(key.length).toBeGreaterThan(30);
    });
  });

  describe('generateMerchantKeys', () => {
    it('should generate both live and test keys', () => {
      const keys = generateMerchantKeys();
      expect(keys.liveKey).toMatch(/^mk_live_/);
      expect(keys.testKey).toMatch(/^mk_test_/);
    });

    it('should generate unique keys on each call', () => {
      const keys1 = generateMerchantKeys();
      const keys2 = generateMerchantKeys();
      expect(keys1.liveKey).not.toBe(keys2.liveKey);
      expect(keys1.testKey).not.toBe(keys2.testKey);
    });
  });

  describe('generateWebhookSecret', () => {
    it('should generate a webhook secret with correct prefix', () => {
      const secret = generateWebhookSecret();
      expect(secret).toMatch(/^whsec_/);
    });
  });

  describe('generateSessionId', () => {
    it('should generate a session ID with correct prefix', () => {
      const sessionId = generateSessionId();
      expect(sessionId).toMatch(/^ses_/);
    });

    it('should generate unique session IDs', () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('password hashing', () => {
    it('should hash and verify passwords correctly', async () => {
      const password = 'securePassword123!';
      const hash = await hashPassword(password);

      expect(hash).not.toBe(password);
      expect(await verifyPassword(password, hash)).toBe(true);
    });

    it('should reject incorrect passwords', async () => {
      const password = 'correctPassword';
      const hash = await hashPassword(password);

      expect(await verifyPassword('wrongPassword', hash)).toBe(false);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'samePassword';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('API key validation', () => {
    it('should correctly identify test keys', () => {
      expect(isTestKey('mk_test_abc123')).toBe(true);
      expect(isTestKey('mk_live_abc123')).toBe(false);
      expect(isTestKey('invalid_key')).toBe(false);
    });

    it('should correctly identify live keys', () => {
      expect(isLiveKey('mk_live_abc123')).toBe(true);
      expect(isLiveKey('mk_test_abc123')).toBe(false);
      expect(isLiveKey('invalid_key')).toBe(false);
    });

    it('should validate API key format', () => {
      expect(isValidApiKeyFormat('mk_live_abc123')).toBe(true);
      expect(isValidApiKeyFormat('mk_test_abc123')).toBe(true);
      expect(isValidApiKeyFormat('invalid')).toBe(false);
      expect(isValidApiKeyFormat('')).toBe(false);
    });
  });

  describe('isDomainAllowed', () => {
    const allowedDomains = ['example.com', '*.myshop.com', 'store.io'];

    it('should allow exact domain matches', () => {
      expect(isDomainAllowed('example.com', allowedDomains, false)).toBe(true);
      expect(isDomainAllowed('store.io', allowedDomains, false)).toBe(true);
    });

    it('should allow wildcard subdomain matches', () => {
      expect(isDomainAllowed('app.myshop.com', allowedDomains, false)).toBe(true);
      expect(isDomainAllowed('shop.myshop.com', allowedDomains, false)).toBe(true);
      expect(isDomainAllowed('myshop.com', allowedDomains, false)).toBe(true);
    });

    it('should reject non-matching domains', () => {
      expect(isDomainAllowed('other.com', allowedDomains, false)).toBe(false);
      expect(isDomainAllowed('notexample.com', allowedDomains, false)).toBe(false);
    });

    it('should allow localhost in test mode', () => {
      expect(isDomainAllowed('localhost', [], true)).toBe(true);
      expect(isDomainAllowed('127.0.0.1', [], true)).toBe(true);
      expect(isDomainAllowed('localhost:3000', [], true)).toBe(true);
    });

    it('should reject localhost in live mode', () => {
      expect(isDomainAllowed('localhost', [], false)).toBe(false);
    });
  });

  describe('extractDomain', () => {
    it('should extract domain from valid URLs', () => {
      expect(extractDomain('https://example.com/path')).toBe('example.com');
      expect(extractDomain('http://subdomain.example.com:3000')).toBe('subdomain.example.com');
    });

    it('should return null for invalid URLs', () => {
      expect(extractDomain('not-a-url')).toBeNull();
      expect(extractDomain('')).toBeNull();
    });
  });

  describe('toPublicMerchant', () => {
    it('should remove sensitive fields', () => {
      const merchant: Merchant = {
        id: 1,
        email: 'test@example.com',
        businessName: 'Test Business',
        passwordHash: 'secret_hash',
        liveApiKey: 'mk_live_123',
        testApiKey: 'mk_test_123',
        webhookUrl: 'https://example.com/webhook',
        webhookSecret: 'whsec_secret',
        allowedDomains: ['example.com'],
        plan: 'free',
        status: 'active',
        monthlyQuota: 100,
        quotaUsed: 0,
        quotaResetAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      };

      const publicMerchant = toPublicMerchant(merchant);

      expect(publicMerchant).not.toHaveProperty('passwordHash');
      expect(publicMerchant).not.toHaveProperty('webhookSecret');
      expect(publicMerchant).toHaveProperty('email');
      expect(publicMerchant).toHaveProperty('businessName');
    });
  });

  describe('quota management', () => {
    it('should calculate next quota reset date', () => {
      const resetDate = getNextQuotaResetDate();
      const now = new Date();

      // Should be first of next month
      expect(resetDate.getDate()).toBe(1);
      expect(resetDate.getMonth()).toBe((now.getMonth() + 1) % 12);
    });

    it('should correctly check if quota is exceeded', () => {
      const merchantWithQuota: Partial<Merchant> = {
        monthlyQuota: 100,
        quotaUsed: 50,
      };
      expect(isQuotaExceeded(merchantWithQuota as Merchant)).toBe(false);

      const merchantExceeded: Partial<Merchant> = {
        monthlyQuota: 100,
        quotaUsed: 100,
      };
      expect(isQuotaExceeded(merchantExceeded as Merchant)).toBe(true);

      const merchantOverExceeded: Partial<Merchant> = {
        monthlyQuota: 100,
        quotaUsed: 150,
      };
      expect(isQuotaExceeded(merchantOverExceeded as Merchant)).toBe(true);
    });

    it('should check if quota should be reset', () => {
      const merchantNeedsReset: Partial<Merchant> = {
        quotaResetAt: new Date(Date.now() - 1000), // In the past
      };
      expect(shouldResetQuota(merchantNeedsReset as Merchant)).toBe(true);

      const merchantNoReset: Partial<Merchant> = {
        quotaResetAt: new Date(Date.now() + 86400000), // In the future
      };
      expect(shouldResetQuota(merchantNoReset as Merchant)).toBe(false);

      const merchantNoResetDate: Partial<Merchant> = {
        quotaResetAt: null,
      };
      expect(shouldResetQuota(merchantNoResetDate as Merchant)).toBe(true);
    });
  });

  describe('getPlanLimits', () => {
    it('should return correct limits for each plan', () => {
      const free = getPlanLimits('free');
      expect(free.monthlyQuota).toBe(100);

      const starter = getPlanLimits('starter');
      expect(starter.monthlyQuota).toBe(1000);

      const growth = getPlanLimits('growth');
      expect(growth.monthlyQuota).toBe(10000);

      const enterprise = getPlanLimits('enterprise');
      expect(enterprise.monthlyQuota).toBe(999999);
    });

    it('should return free plan for unknown plans', () => {
      const unknown = getPlanLimits('unknown');
      expect(unknown.monthlyQuota).toBe(100);
    });
  });

  describe('webhook signatures', () => {
    const secret = 'whsec_test_secret';
    const payload = '{"event": "test"}';
    const timestamp = Math.floor(Date.now() / 1000);

    it('should generate consistent signatures', () => {
      const sig1 = generateWebhookSignature(payload, secret, timestamp);
      const sig2 = generateWebhookSignature(payload, secret, timestamp);
      expect(sig1).toBe(sig2);
    });

    it('should generate different signatures for different payloads', () => {
      const sig1 = generateWebhookSignature(payload, secret, timestamp);
      const sig2 = generateWebhookSignature('{"event": "other"}', secret, timestamp);
      expect(sig1).not.toBe(sig2);
    });

    it('should verify valid signatures', () => {
      const signature = generateWebhookSignature(payload, secret, timestamp);
      const isValid = verifyWebhookSignature(payload, signature, secret, timestamp);
      expect(isValid).toBe(true);
    });

    it('should reject invalid signatures', () => {
      const isValid = verifyWebhookSignature(payload, 'sha256=invalid', secret, timestamp);
      expect(isValid).toBe(false);
    });

    it('should reject expired timestamps', () => {
      const oldTimestamp = Math.floor(Date.now() / 1000) - 400; // 400 seconds ago
      const signature = generateWebhookSignature(payload, secret, oldTimestamp);
      const isValid = verifyWebhookSignature(payload, signature, secret, oldTimestamp, 300);
      expect(isValid).toBe(false);
    });
  });
});
