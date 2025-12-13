/**
 * URL Fetcher Service
 * Safely fetches images from URLs with security validations
 */

import { URL } from 'url';

export interface FetchedImage {
  buffer: Buffer;
  mimeType: string;
  size: number;
  originalUrl: string;
}

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
}

// Blocked IP ranges (private/internal networks)
const BLOCKED_IP_PATTERNS = [
  /^127\./,                    // Loopback
  /^10\./,                     // Private Class A
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private Class B
  /^192\.168\./,               // Private Class C
  /^169\.254\./,               // Link-local
  /^0\./,                      // Current network
  /^::1$/,                     // IPv6 loopback
  /^fc00:/i,                   // IPv6 unique local
  /^fe80:/i,                   // IPv6 link-local
];

// Blocked hostnames
const BLOCKED_HOSTNAMES = [
  'localhost',
  'localhost.localdomain',
  '0.0.0.0',
  'internal',
  'intranet',
];

// Allowed image MIME types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/heic',
  'image/heif',
];

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Fetch timeout (30 seconds)
const FETCH_TIMEOUT = 30000;

/**
 * Validates a URL for safety before fetching
 */
export function validateImageUrl(urlString: string): UrlValidationResult {
  try {
    // Parse the URL
    const url = new URL(urlString);

    // Must be HTTPS (or HTTP for development)
    if (!['https:', 'http:'].includes(url.protocol)) {
      return { valid: false, error: 'URL must use HTTPS or HTTP protocol' };
    }

    // Check for blocked hostnames
    const hostname = url.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.includes(hostname)) {
      return { valid: false, error: 'This hostname is not allowed' };
    }

    // Check for IP address patterns (block internal IPs)
    for (const pattern of BLOCKED_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return { valid: false, error: 'Internal IP addresses are not allowed' };
      }
    }

    // Check for suspicious patterns
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return { valid: false, error: 'Localhost URLs are not allowed' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Fetches an image from a URL with safety checks
 */
export async function fetchImageFromUrl(urlString: string): Promise<FetchedImage> {
  // Validate the URL first
  const validation = validateImageUrl(urlString);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid URL');
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  // Parse URL to get referer
  const parsedUrl = new URL(urlString);
  const origin = parsedUrl.origin;

  // Browser-like headers to avoid 403/404 from anti-hotlinking protection
  const browserHeaders = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': origin + '/',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"macOS"',
    'Sec-Fetch-Dest': 'image',
    'Sec-Fetch-Mode': 'no-cors',
    'Sec-Fetch-Site': 'cross-site',
  };

  try {
    // Try HEAD request first to check content type and size (some servers don't support HEAD)
    let contentLength: string | null = null;
    try {
      const headResponse = await fetch(urlString, {
        method: 'HEAD',
        signal: controller.signal,
        headers: browserHeaders,
      });

      if (headResponse.ok) {
        // Check content length if available
        contentLength = headResponse.headers.get('content-length');
        if (contentLength && parseInt(contentLength, 10) > MAX_FILE_SIZE) {
          throw new Error(`Image file is too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
        }
      }
      // If HEAD fails, we'll just proceed with GET and validate after download
    } catch (headError) {
      // HEAD request failed, continue with GET request
      console.log('HEAD request failed, proceeding with GET:', headError);
    }

    // Fetch the actual image
    const response = await fetch(urlString, {
      method: 'GET',
      signal: controller.signal,
      headers: browserHeaders,
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    // Get the response as array buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Verify the actual size
    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error(`Image file is too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
    }

    // Detect actual MIME type from buffer magic bytes
    const detectedMimeType = detectImageMimeType(buffer);
    if (!detectedMimeType) {
      // Debug: log first 100 bytes as hex and as string to see what we got
      const firstBytes = buffer.slice(0, 100);
      console.log('[URL Fetcher] Magic bytes (hex):', firstBytes.toString('hex').slice(0, 24));
      console.log('[URL Fetcher] Content starts with:', firstBytes.toString('utf8').slice(0, 100));
      throw new Error('The URL does not point to a valid image file');
    }

    return {
      buffer,
      mimeType: detectedMimeType,
      size: buffer.length,
      originalUrl: urlString,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Detects image MIME type from buffer magic bytes
 */
function detectImageMimeType(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;

  // Check magic bytes
  const bytes = buffer.slice(0, 12);

  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return 'image/png';
  }

  // GIF: 47 49 46 38
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return 'image/gif';
  }

  // WebP: 52 49 46 46 ... 57 45 42 50
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return 'image/webp';
  }

  // AVIF/HEIF/HEIC: Uses ISO Base Media File Format with "ftyp" box
  // Check for "ftyp" at bytes 4-7 (after the box size at bytes 0-3)
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    // Check the brand at bytes 8-11
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (brand === 'avif' || brand === 'avis') {
      return 'image/avif';
    }
    if (brand === 'heic' || brand === 'heix' || brand === 'hevc' || brand === 'hevx') {
      return 'image/heic';
    }
    if (brand === 'mif1' || brand === 'msf1') {
      // Generic HEIF - check minor_brand for avif
      // For now, treat mif1 as AVIF since that's what the eonline CDN returns
      return 'image/avif';
    }
  }

  return null;
}

/**
 * Converts a buffer to base64 data URL
 */
export function bufferToDataUrl(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}
