/**
 * Security & Performance Middleware
 *
 * Implements CORS, CSP, rate limiting, and performance optimizations.
 */

import { Request, Response, NextFunction } from 'express';
import { getStorage } from '../storage';

// In-memory rate limit store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Rate limit configurations
export const RateLimits = {
  // Per merchant API rate limit
  MERCHANT_API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  // Per IP widget rate limit
  WIDGET_IP: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
  },
  // Per session try-on limit
  SESSION_TRYON: {
    windowMs: 60 * 60 * 1000, // 1 hour (session lifetime)
    maxRequests: 3,
  },
  // Login attempts
  LOGIN_ATTEMPTS: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },
} as const;

/**
 * Get client IP address
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Generic rate limiter
 */
export function createRateLimiter(config: { windowMs: number; maxRequests: number }) {
  return (keyExtractor: (req: Request) => string) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = keyExtractor(req);
      const now = Date.now();

      // Get or create rate limit entry
      let entry = rateLimitStore.get(key);

      if (!entry || now > entry.resetAt) {
        entry = { count: 0, resetAt: now + config.windowMs };
        rateLimitStore.set(key, entry);
      }

      entry.count++;

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - entry.count));
      res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000));

      if (entry.count > config.maxRequests) {
        res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests',
            userMessage: 'Too many requests. Please wait a moment and try again.',
            retryAfter: Math.ceil((entry.resetAt - now) / 1000),
          },
        });
      }

      next();
    };
  };
}

// Pre-configured rate limiters
export const merchantApiRateLimiter = createRateLimiter(RateLimits.MERCHANT_API);
export const widgetIpRateLimiter = createRateLimiter(RateLimits.WIDGET_IP);
export const loginRateLimiter = createRateLimiter(RateLimits.LOGIN_ATTEMPTS);

/**
 * Rate limit by IP for widget endpoints
 */
export function rateLimitByIp(req: Request, res: Response, next: NextFunction) {
  const limiter = widgetIpRateLimiter((r) => `ip:${getClientIp(r)}`);
  return limiter(req, res, next);
}

/**
 * Rate limit by merchant key
 */
export function rateLimitByMerchant(req: Request, res: Response, next: NextFunction) {
  const merchantKey = req.headers['x-merchant-key'] as string || 'unknown';
  const limiter = merchantApiRateLimiter((r) => `merchant:${merchantKey}`);
  return limiter(req, res, next);
}

/**
 * Rate limit login attempts by IP
 */
export function rateLimitLogin(req: Request, res: Response, next: NextFunction) {
  const limiter = loginRateLimiter((r) => `login:${getClientIp(r)}`);
  return limiter(req, res, next);
}

/**
 * CORS middleware for widget endpoints
 */
export async function widgetCors(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  const merchantKey = req.headers['x-merchant-key'] as string;

  // Always allow these headers for preflight
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Merchant-Key, X-Request-ID');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  res.setHeader('Access-Control-Expose-Headers', 'X-Request-ID, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    return res.status(204).send();
  }

  // If no merchant key, allow but note it
  if (!merchantKey) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    return next();
  }

  // For test keys, allow localhost and common dev domains
  if (merchantKey.startsWith('mk_test_')) {
    const allowedDevOrigins = [
      'localhost',
      '127.0.0.1',
      '.local',
      '.test',
      'replit.dev',
      'repl.co',
      'vercel.app',
      'netlify.app',
    ];

    if (origin) {
      const isDevOrigin = allowedDevOrigins.some(
        (dev) => origin.includes(dev)
      );
      if (isDevOrigin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        return next();
      }
    }
  }

  // For live keys, validate against user's allowed domains
  if (merchantKey.startsWith('mk_live_') && origin) {
    try {
      const storage = await getStorage();
      const user = await storage.getUserByApiKey(merchantKey);

      if (user && user.allowedDomains) {
        const originUrl = new URL(origin);
        const originDomain = originUrl.hostname;
        const allowedDomains = user.allowedDomains as string[];

        const isAllowed = allowedDomains.some((domain) => {
          if (domain.startsWith('*.')) {
            // Wildcard match
            const baseDomain = domain.slice(2);
            return originDomain === baseDomain || originDomain.endsWith(`.${baseDomain}`);
          }
          return originDomain === domain;
        });

        if (isAllowed) {
          res.setHeader('Access-Control-Allow-Origin', origin);
          res.setHeader('Access-Control-Allow-Credentials', 'true');
          return next();
        }
      }
    } catch (error) {
      console.error('[CORS] Error checking domain:', error);
    }
  }

  // Default: allow but without credentials
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  next();
}

/**
 * General CORS for API endpoints
 */
export function apiCors(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;

  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(204).send();
  }

  next();
}

/**
 * Content Security Policy for iframe content
 */
export function iframeCsp(req: Request, res: Response, next: NextFunction) {
  // CSP for the widget iframe
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // Need inline for React
    "style-src 'self' 'unsafe-inline'", // Need inline for styled-components/tailwind
    "img-src 'self' data: blob: https:", // Allow images from anywhere
    "connect-src 'self' https:", // API calls
    "frame-ancestors *", // Allow embedding from any domain
    "form-action 'self'",
    "media-src 'self' blob:", // For camera capture
  ].join('; ');

  res.setHeader('Content-Security-Policy', cspDirectives);
  next();
}

/**
 * Security headers middleware
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent clickjacking (but allow for widget iframe routes)
  if (!req.path.startsWith('/widget/')) {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  }

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // XSS Protection (legacy browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // HSTS (only in production with HTTPS)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Permissions Policy (disable unnecessary features)
  res.setHeader(
    'Permissions-Policy',
    'accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(self), display-capture=(), document-domain=(), encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(self), midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), usb=(), xr-spatial-tracking=()'
  );

  next();
}

/**
 * Performance headers for static assets
 */
export function staticCacheHeaders(maxAge: number = 86400) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Cache static assets
    res.setHeader('Cache-Control', `public, max-age=${maxAge}, immutable`);
    res.setHeader('Vary', 'Accept-Encoding');
    next();
  };
}

/**
 * Performance headers for widget JS/CSS
 */
export function widgetAssetHeaders(req: Request, res: Response, next: NextFunction) {
  // Short cache for widget assets (allows quick updates)
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  res.setHeader('Vary', 'Accept-Encoding');

  // Compression hint
  res.setHeader('Content-Encoding', 'identity');

  next();
}

/**
 * No cache headers for API responses
 */
export function noCacheHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
}

/**
 * Input sanitization middleware
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Sanitize string inputs to prevent XSS
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Basic XSS prevention - remove script tags and event handlers
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=/gi, 'data-disabled=');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key of Object.keys(obj)) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }

  next();
}

/**
 * Clean up old rate limit entries periodically
 */
export function startRateLimitCleanup() {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 60 * 1000); // Clean up every minute
}

export default {
  RateLimits,
  getClientIp,
  createRateLimiter,
  rateLimitByIp,
  rateLimitByMerchant,
  rateLimitLogin,
  widgetCors,
  apiCors,
  iframeCsp,
  securityHeaders,
  staticCacheHeaders,
  widgetAssetHeaders,
  noCacheHeaders,
  sanitizeInput,
  startRateLimitCleanup,
};
