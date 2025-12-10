import { Request, Response, NextFunction } from "express";
import { getStorage } from "../storage";
import {
  isValidApiKeyFormat,
  isTestKey,
  isDomainAllowed,
  extractDomain,
  isQuotaExceeded,
  shouldResetQuota,
  getNextQuotaResetDate,
} from "../services/merchantService";
import type { User } from "@shared/schema";

// Extend Express Request to include widget user (the API key owner)
declare global {
  namespace Express {
    interface Request {
      widgetUser?: User;
      isTestMode?: boolean;
      apiKeyId?: string;
      apiKeyName?: string;
    }
  }
}

// Rate limiting store (in-memory, should use Redis in production)
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore: Map<string, RateLimitEntry> = new Map();

// Rate limit configuration
const RATE_LIMITS = {
  perMerchant: { requests: 100, windowMs: 60000 }, // 100 requests per minute per merchant
  perIp: { requests: 20, windowMs: 60000 }, // 20 requests per minute per IP
};

/**
 * Clean up expired rate limit entries periodically
 */
function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every minute
setInterval(cleanupRateLimits, 60000);

/**
 * Check rate limit for a given key
 */
function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  let entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowMs };
    rateLimitStore.set(key, entry);
  }

  entry.count++;

  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}

/**
 * Get client IP address from request
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

/**
 * Middleware to authenticate widget requests using merchant API key
 */
export async function widgetAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract API key from header
    const apiKey = req.headers["x-merchant-key"] as string;

    if (!apiKey) {
      res.status(401).json({
        success: false,
        error: {
          code: "MISSING_API_KEY",
          message: "X-Merchant-Key header is required",
        },
      });
      return;
    }

    // Validate API key format
    if (!isValidApiKeyFormat(apiKey)) {
      res.status(401).json({
        success: false,
        error: {
          code: "INVALID_API_KEY_FORMAT",
          message: "Invalid API key format",
        },
      });
      return;
    }

    const isTestMode = isTestKey(apiKey);

    // Look up user by API key
    const storage = await getStorage();
    const user = await storage.getUserByApiKey(apiKey);

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: "INVALID_API_KEY",
          message: "The API key is invalid or has been revoked",
        },
      });
      return;
    }

    // Check if user account is verified
    if (user.isVerified !== "true") {
      res.status(403).json({
        success: false,
        error: {
          code: "ACCOUNT_NOT_VERIFIED",
          message: "Please verify your email before using the API",
        },
      });
      return;
    }

    // Validate origin domain
    const origin = req.headers.origin || req.headers.referer;
    if (origin) {
      const domain = extractDomain(origin);
      const allowedDomains = (user.allowedDomains as string[]) || [];

      if (domain && !isDomainAllowed(domain, allowedDomains, isTestMode)) {
        res.status(403).json({
          success: false,
          error: {
            code: "DOMAIN_NOT_ALLOWED",
            message: `Domain ${domain} is not in the allowed domains list`,
          },
        });
        return;
      }
    }

    // Check rate limits
    const clientIp = getClientIp(req);
    const userRateLimit = checkRateLimit(
      `user:${user.id}`,
      RATE_LIMITS.perMerchant.requests,
      RATE_LIMITS.perMerchant.windowMs
    );

    if (!userRateLimit.allowed) {
      res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Please slow down.",
        },
      });
      return;
    }

    const ipRateLimit = checkRateLimit(
      `ip:${clientIp}`,
      RATE_LIMITS.perIp.requests,
      RATE_LIMITS.perIp.windowMs
    );

    if (!ipRateLimit.allowed) {
      res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests from this IP. Please slow down.",
        },
      });
      return;
    }

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", RATE_LIMITS.perMerchant.requests);
    res.setHeader("X-RateLimit-Remaining", userRateLimit.remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(userRateLimit.resetAt / 1000));

    // Check and potentially reset quota (only for paid plans with monthly quota)
    if (shouldResetQuota(user)) {
      await storage.resetUserQuota(user.id, getNextQuotaResetDate());
      user.quotaUsed = 0;
      user.quotaResetAt = getNextQuotaResetDate();
    }

    // Find the API key ID and name from user's apiKeys
    let apiKeyId: string | undefined;
    let apiKeyName: string | undefined;

    if (user.apiKeys && Array.isArray(user.apiKeys)) {
      const matchingKey = (user.apiKeys as Array<{ id: string; key: string; name: string }>)
        .find(k => k.key === apiKey);
      if (matchingKey) {
        apiKeyId = matchingKey.id;
        apiKeyName = matchingKey.name;
      }
    }

    // Fallback: if using legacy liveKey, create a default name
    if (!apiKeyId && user.liveKey === apiKey) {
      apiKeyId = 'legacy';
      apiKeyName = 'Default Key';
    }

    // Attach user and test mode flag to request
    req.widgetUser = user;
    req.isTestMode = isTestMode;
    req.apiKeyId = apiKeyId;
    req.apiKeyName = apiKeyName;

    next();
  } catch (error) {
    console.error("Widget auth error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Authentication failed due to an internal error",
      },
    });
  }
}

/**
 * Middleware to check if user has available quota
 * Should be used after widgetAuth for endpoints that consume quota
 */
export async function checkQuota(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.widgetUser) {
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "API key authentication required",
      },
    });
    return;
  }

  if (isQuotaExceeded(req.widgetUser)) {
    const hasMonthlyQuota = req.widgetUser.monthlyQuota !== null;
    res.status(402).json({
      success: false,
      error: {
        code: "QUOTA_EXCEEDED",
        message: hasMonthlyQuota
          ? "Monthly try-on limit reached. Please upgrade your plan."
          : "Try-on limit reached. Please upgrade to a paid plan for more try-ons.",
      },
    });
    return;
  }

  next();
}

/**
 * Increment quota after successful try-on (legacy - increments combined total only)
 * Should be called after successful processing
 */
export async function incrementQuota(userId: string): Promise<void> {
  try {
    const storage = await getStorage();
    await storage.incrementUserQuota(userId);
  } catch (error) {
    console.error("Error incrementing user quota:", error);
  }
}

/**
 * Increment studio quota after successful Studio try-on
 * Increments both studioQuotaUsed and combined quotaUsed
 */
export async function incrementStudioQuota(userId: string): Promise<void> {
  try {
    const storage = await getStorage();
    await storage.incrementStudioQuota(userId);
  } catch (error) {
    console.error("Error incrementing studio quota:", error);
  }
}

/**
 * Increment widget quota after successful Widget try-on
 * Increments both widgetQuotaUsed and combined quotaUsed
 */
export async function incrementWidgetQuota(userId: string): Promise<void> {
  try {
    const storage = await getStorage();
    await storage.incrementWidgetQuota(userId);
  } catch (error) {
    console.error("Error incrementing widget quota:", error);
  }
}

/**
 * Optional widget auth - attaches merchant if key is provided, continues otherwise
 */
export async function optionalWidgetAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKey = req.headers["x-merchant-key"] as string;

  if (!apiKey) {
    next();
    return;
  }

  // If API key is provided, validate it
  return widgetAuth(req, res, next);
}
