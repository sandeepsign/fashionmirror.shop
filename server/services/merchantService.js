import { randomBytes, createHash } from "crypto";
import bcrypt from "bcrypt";
// API Key prefixes
const LIVE_KEY_PREFIX = "mk_live_";
const TEST_KEY_PREFIX = "mk_test_";
const WEBHOOK_SECRET_PREFIX = "whsec_";
/**
 * Generate a random API key with the given prefix
 */
export function generateApiKey(prefix) {
    const randomPart = randomBytes(24).toString("base64url");
    return `${prefix}${randomPart}`;
}
/**
 * Generate both live and test API keys for a user
 */
export function generateUserApiKeys() {
    return {
        liveKey: generateApiKey(LIVE_KEY_PREFIX),
        testKey: generateApiKey(TEST_KEY_PREFIX),
    };
}
/**
 * Generate a webhook secret
 */
export function generateWebhookSecret() {
    return generateApiKey(WEBHOOK_SECRET_PREFIX);
}
/**
 * Generate a unique session ID for widget sessions
 */
export function generateSessionId() {
    const timestamp = Date.now().toString(36);
    const randomPart = randomBytes(12).toString("base64url");
    return `ses_${timestamp}${randomPart}`;
}
/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password) {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
}
/**
 * Verify a password against a hash
 */
export async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}
/**
 * Check if an API key is a test key
 */
export function isTestKey(apiKey) {
    return apiKey.startsWith(TEST_KEY_PREFIX);
}
/**
 * Check if an API key is a live key
 */
export function isLiveKey(apiKey) {
    return apiKey.startsWith(LIVE_KEY_PREFIX);
}
/**
 * Validate API key format
 */
export function isValidApiKeyFormat(apiKey) {
    return isTestKey(apiKey) || isLiveKey(apiKey);
}
/**
 * Check if a domain is in the allowed domains list
 */
export function isDomainAllowed(domain, allowedDomains, isTestMode) {
    // In test mode, allow localhost and common development domains
    if (isTestMode) {
        const testDomains = [
            "localhost",
            "127.0.0.1",
            "0.0.0.0",
            "*.localhost",
            "*.local",
        ];
        // Check if domain matches any test domain pattern
        for (const testDomain of testDomains) {
            if (testDomain.startsWith("*")) {
                const suffix = testDomain.slice(1);
                if (domain.endsWith(suffix) || domain === suffix.slice(1)) {
                    return true;
                }
            }
            else if (domain === testDomain || domain.startsWith(`${testDomain}:`)) {
                return true;
            }
        }
    }
    // Check against merchant's allowed domains
    for (const allowed of allowedDomains) {
        if (allowed.startsWith("*.")) {
            // Wildcard subdomain matching
            const baseDomain = allowed.slice(2);
            if (domain === baseDomain || domain.endsWith(`.${baseDomain}`)) {
                return true;
            }
        }
        else if (domain === allowed) {
            return true;
        }
    }
    return false;
}
/**
 * Extract domain from origin or referer header
 */
export function extractDomain(urlString) {
    try {
        const url = new URL(urlString);
        return url.hostname;
    }
    catch {
        return null;
    }
}
/**
 * Remove sensitive fields from user object for public API responses
 */
export function toPublicUser(user) {
    const { password, verificationToken, webhookSecret, ...publicFields } = user;
    return publicFields;
}
/**
 * Calculate quota reset date (first of next month)
 */
export function getNextQuotaResetDate() {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth;
}
/**
 * Check if user has exceeded their quota
 * For free tier: checks totalQuota (lifetime limit)
 * For paid tiers: checks monthlyQuota
 */
export function isQuotaExceeded(user) {
    const used = user.quotaUsed ?? 0;
    // For paid plans with monthly quota
    if (user.monthlyQuota !== null && user.monthlyQuota !== undefined) {
        return used >= user.monthlyQuota;
    }
    // For free tier with total lifetime quota
    const totalQuota = user.totalQuota ?? 100;
    return used >= totalQuota;
}
/**
 * Check if quota should be reset (only for paid plans with monthly quota)
 */
export function shouldResetQuota(user) {
    // Free tier doesn't reset (lifetime quota)
    if (!user.monthlyQuota) {
        return false;
    }
    if (!user.quotaResetAt) {
        return true;
    }
    return new Date() >= user.quotaResetAt;
}
/**
 * Get the effective quota for a user
 */
export function getEffectiveQuota(user) {
    const used = user.quotaUsed ?? 0;
    if (user.monthlyQuota !== null && user.monthlyQuota !== undefined) {
        return { used, limit: user.monthlyQuota, isLifetime: false };
    }
    return { used, limit: user.totalQuota ?? 100, isLifetime: true };
}
/**
 * Generate HMAC signature for webhook payload
 */
export function generateWebhookSignature(payload, secret, timestamp) {
    const signedPayload = `${timestamp}.${payload}`;
    const signature = createHash("sha256")
        .update(signedPayload)
        .update(secret)
        .digest("hex");
    return `sha256=${signature}`;
}
/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(payload, signature, secret, timestamp, toleranceSeconds = 300 // 5 minutes
) {
    // Check timestamp tolerance
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > toleranceSeconds) {
        return false;
    }
    const expectedSignature = generateWebhookSignature(payload, secret, timestamp);
    // Constant-time comparison to prevent timing attacks
    if (signature.length !== expectedSignature.length) {
        return false;
    }
    let result = 0;
    for (let i = 0; i < signature.length; i++) {
        result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    return result === 0;
}
