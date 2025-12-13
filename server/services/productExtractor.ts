/**
 * Product Extractor Service
 * Uses AI to intelligently extract product information from e-commerce URLs
 */

import OpenAI from 'openai';
import { fetchImageFromUrl, bufferToDataUrl, validateImageUrl } from './urlFetcher';
import { analyzeImageWithAI } from './imageAnalyzer';

// Dynamic import of puppeteer for fallback browser-based fetching
let puppeteerModule: typeof import('puppeteer') | null = null;

async function getPuppeteer(): Promise<typeof import('puppeteer') | null> {
  // If already loaded successfully, return cached module
  if (puppeteerModule) return puppeteerModule;

  try {
    // Use dynamic import to load puppeteer
    puppeteerModule = await import('puppeteer');
    console.log('[ProductExtractor] Puppeteer loaded successfully');
    return puppeteerModule;
  } catch (e) {
    // Log the actual error for debugging
    console.log('[ProductExtractor] Puppeteer import failed:', e instanceof Error ? e.message : e);
    return null;
  }
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ExtractedProduct {
  name: string;
  category: string;
  description: string;
  specifications: {
    material?: string;
    fit?: string;
    care?: string;
    color?: string;
    style?: string;
    [key: string]: string | undefined;
  };
  imageUrl: string;
  imageBase64: string;
  imageMimeType: string;
  sourceUrl: string;
  price?: {
    amount: number;
    currency: string;
  };
}

export interface ExtractionResult {
  success: boolean;
  product?: ExtractedProduct;
  error?: string;
}

// Maximum HTML length to send to AI (to avoid token limits)
const MAX_HTML_LENGTH = 50000;

// Common fashion categories mapping
const CATEGORY_MAPPING: Record<string, string> = {
  'shirt': 'Top',
  'blouse': 'Top',
  't-shirt': 'Top',
  'tshirt': 'Top',
  'top': 'Top',
  'sweater': 'Top',
  'hoodie': 'Top',
  'tank': 'Top',
  'polo': 'Top',
  'pants': 'Bottom',
  'jeans': 'Bottom',
  'trousers': 'Bottom',
  'shorts': 'Bottom',
  'skirt': 'Bottom',
  'leggings': 'Bottom',
  'dress': 'Dress',
  'gown': 'Dress',
  'romper': 'Dress',
  'jumpsuit': 'Dress',
  'jacket': 'Outerwear',
  'coat': 'Outerwear',
  'blazer': 'Outerwear',
  'cardigan': 'Outerwear',
  'vest': 'Outerwear',
  'shoes': 'Footwear',
  'sneakers': 'Footwear',
  'boots': 'Footwear',
  'heels': 'Footwear',
  'sandals': 'Footwear',
  'loafers': 'Footwear',
  'flats': 'Footwear',
  'bag': 'Accessories',
  'handbag': 'Accessories',
  'purse': 'Accessories',
  'belt': 'Accessories',
  'scarf': 'Accessories',
  'hat': 'Accessories',
  'jewelry': 'Accessories',
  'watch': 'Accessories',
  'sunglasses': 'Accessories',
  'necklace': 'Accessories',
  'bracelet': 'Accessories',
  'earrings': 'Accessories',
};

/**
 * Fetches webpage HTML using Puppeteer (for sites with bot protection)
 */
async function fetchWithPuppeteer(url: string): Promise<string> {
  const puppeteer = await getPuppeteer();
  if (!puppeteer) {
    throw new Error('Puppeteer not available for browser-based fetching');
  }

  console.log('[ProductExtractor] Using Puppeteer for browser-based fetching...');

  const browser = await puppeteer.default.launch({
    headless: 'new', // Use new headless mode which is harder to detect
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080',
      '--disable-blink-features=AutomationControlled', // Hide automation
      '--disable-features=IsolateOrigins,site-per-process',
      '--flag-switches-begin',
      '--flag-switches-end',
    ],
  });

  try {
    const page = await browser.newPage();

    // Remove webdriver property that reveals automation
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      // Override the chrome property
      (window as any).chrome = { runtime: {} };
      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters: any) =>
        parameters.name === 'notifications'
          ? Promise.resolve({ state: Notification.permission } as PermissionStatus)
          : originalQuery(parameters);
      // Override plugins to look more realistic
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
    });

    // Set realistic viewport and user agent
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

    // Set extra headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'max-age=0',
      'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    });

    // Navigate to the page - wait for full load
    console.log('[ProductExtractor] Navigating to URL...');
    await page.goto(url, {
      waitUntil: 'networkidle0', // Wait until no network activity for 500ms
      timeout: 45000,
    });

    // Wait for page to stabilize and render dynamic content
    console.log('[ProductExtractor] Waiting for page to render...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Try to scroll to trigger lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get the full HTML
    const html = await page.content();
    console.log(`[ProductExtractor] Puppeteer fetched HTML length: ${html.length}`);
    return html;
  } finally {
    await browser.close();
  }
}

/**
 * Fetches webpage HTML content with enhanced headers to avoid bot detection
 * Falls back to Puppeteer for sites with heavy bot protection
 */
async function fetchWebpageHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  // Parse URL to get the hostname for Referer header
  const parsedUrl = new URL(url);
  const origin = parsedUrl.origin;

  // Use Google as referrer for better acceptance
  const googleReferer = 'https://www.google.com/';

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Referer': googleReferer,
        'DNT': '1',
        'Connection': 'keep-alive',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      // If we get 403, try Puppeteer fallback
      if (response.status === 403) {
        const pptr = await getPuppeteer();
        if (pptr) {
          console.log('[ProductExtractor] Got 403, trying Puppeteer fallback...');
          clearTimeout(timeoutId);
          return await fetchWithPuppeteer(url);
        }
      }
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const html = await response.text();
    return html;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Cleans and truncates HTML for AI processing
 */
function cleanHtmlForAI(html: string): string {
  // Remove script tags and their content
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove style tags and their content
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

  // Remove SVG content
  cleaned = cleaned.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');

  // Remove noscript tags
  cleaned = cleaned.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');

  // Compress whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Truncate if too long
  if (cleaned.length > MAX_HTML_LENGTH) {
    cleaned = cleaned.substring(0, MAX_HTML_LENGTH) + '... [truncated]';
  }

  return cleaned;
}

/**
 * Pre-extract Amazon hiRes image URLs from raw HTML before cleaning
 */
function extractAmazonHiResImages(html: string): string[] {
  const hiResPattern = /"hiRes"\s*:\s*"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/g;
  const matches: string[] = [];
  let match;
  while ((match = hiResPattern.exec(html)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

/**
 * Extracts product data from HTML using GPT-4o
 */
async function extractProductDataFromHtml(html: string, sourceUrl: string): Promise<{
  name: string;
  description: string;
  specifications: Record<string, string>;
  imageUrl: string;
  category: string;
  price?: { amount: number; currency: string };
}> {
  // For Amazon, pre-extract hiRes image URLs before cleaning the HTML
  let amazonHiResImages: string[] = [];
  if (sourceUrl.includes('amazon.com')) {
    amazonHiResImages = extractAmazonHiResImages(html);
    console.log(`[ProductExtractor] Found ${amazonHiResImages.length} Amazon hiRes images`);
  }

  const cleanedHtml = cleanHtmlForAI(html);

  const prompt = `You are analyzing an e-commerce product page HTML. Extract ONLY the MAIN product being sold (ignore recommendations, related products, recently viewed items, etc.).

Source URL: ${sourceUrl}

Extract the following information and return as JSON:
{
  "name": "Product name (concise, 2-6 words)",
  "description": "Brief product description (1-2 sentences max)",
  "specifications": {
    "material": "fabric/material composition if mentioned",
    "fit": "fit type (slim, regular, loose, etc.) if mentioned",
    "care": "care instructions if mentioned",
    "color": "main color if mentioned",
    "style": "style type (casual, formal, etc.) if mentioned"
  },
  "imageUrl": "URL of the main product image",
  "category": "One of: Top, Bottom, Dress, Outerwear, Footwear, Accessories, Formal, Casual",
  "price": {
    "amount": 99.99,
    "currency": "USD"
  }
}

CRITICAL rules for imageUrl:
1. For Amazon (m.media-amazon.com images):
   - Look for images in "data-old-hires", "data-a-dynamic-image", or JSON in the HTML
   - Amazon images have format like: https://m.media-amazon.com/images/I/IMAGEID.jpg
   - The IMAGEID is typically 10-11 characters like "71ssCpjBRVL" or "81t2j+8b+FL"
   - Do NOT include size suffixes like "._AC_UL1500_" - these can cause 404 errors
   - Prefer URLs WITHOUT size modifiers. If you must use a size, prefer "._AC_SX679_" or just ".jpg"
   - Example valid URL: https://m.media-amazon.com/images/I/71ssCpjBRVL.jpg

2. For other sites: Look for <img> tags with src or data-src, prefer high-res images
3. If a field is not found, use null for that field
4. For category: Map the product type to one of the allowed categories
5. Focus ONLY on the main product, ignore sidebars, recommendations, ads
6. Ensure the imageUrl is a complete, valid URL (add domain if relative)

HTML Content:
${cleanedHtml}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 1000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from AI');
  }

  const parsed = JSON.parse(content);

  // Normalize category
  let category = parsed.category || 'Accessories';
  const lowerName = (parsed.name || '').toLowerCase();
  for (const [keyword, cat] of Object.entries(CATEGORY_MAPPING)) {
    if (lowerName.includes(keyword)) {
      category = cat;
      break;
    }
  }

  // Fix relative URLs
  let imageUrl = parsed.imageUrl || '';
  if (imageUrl && !imageUrl.startsWith('http')) {
    try {
      const baseUrl = new URL(sourceUrl);
      imageUrl = new URL(imageUrl, baseUrl.origin).href;
    } catch {
      // Keep as is if URL parsing fails
    }
  }

  // For Amazon: use pre-extracted hiRes URLs if available (these are known to work)
  if (amazonHiResImages.length > 0) {
    console.log(`[ProductExtractor] Using pre-extracted Amazon hiRes image: ${amazonHiResImages[0]}`);
    imageUrl = amazonHiResImages[0];
  }
  // Fallback: Fix Amazon image URLs - remove problematic size suffixes that cause 404s
  else if (imageUrl && imageUrl.includes('m.media-amazon.com/images/I/')) {
    // Extract the base image ID and reconstruct with a working suffix
    const amazonImageMatch = imageUrl.match(/m\.media-amazon\.com\/images\/I\/([A-Za-z0-9+%-]+)/);
    if (amazonImageMatch) {
      const imageId = amazonImageMatch[1];
      // Use a size suffix that's known to work, or none at all
      imageUrl = `https://m.media-amazon.com/images/I/${imageId}._AC_SX679_.jpg`;
    }
  }

  return {
    name: parsed.name || 'Fashion Item',
    description: parsed.description || '',
    specifications: parsed.specifications || {},
    imageUrl,
    category,
    price: parsed.price,
  };
}

/**
 * Try to extract product from protected sites using their APIs
 */
async function tryProtectedSiteExtraction(url: string): Promise<ExtractionResult | null> {
  const parsedUrl = new URL(url);
  const hostname = parsedUrl.hostname.toLowerCase();

  // Bergdorf Goodman / Neiman Marcus - try their product API
  if (hostname.includes('bergdorfgoodman.com') || hostname.includes('neimanmarcus.com')) {
    // Extract product ID from URL (format: -prod123456789)
    const prodMatch = url.match(/prod(\d+)/);
    if (prodMatch) {
      const productId = prodMatch[1];
      console.log(`[ProductExtractor] Detected Neiman Marcus Group site, trying API with product ID: ${productId}`);

      try {
        // Try the product API endpoint
        const apiUrl = `https://www.${hostname.includes('bergdorf') ? 'bergdorfgoodman' : 'neimanmarcus'}.com/product-detail-api/product/${productId}`;
        const response = await fetch(apiUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`[ProductExtractor] Got API response for product ${productId}`);

          // Extract relevant info from API response
          const productName = data.productName || data.name || 'Fashion Item';
          const imageUrl = data.mainImage?.url || data.images?.[0]?.url || '';

          if (imageUrl) {
            const fetchedImage = await fetchImageFromUrl(imageUrl);
            const imageBase64 = fetchedImage.buffer.toString('base64');

            return {
              success: true,
              product: {
                name: productName,
                category: 'Dress',
                description: data.description || '',
                specifications: {},
                imageUrl,
                imageBase64,
                imageMimeType: fetchedImage.mimeType,
                sourceUrl: url,
                price: data.price ? { amount: data.price.value, currency: data.price.currency || 'USD' } : undefined,
              },
            };
          }
        }
      } catch (apiError) {
        console.log(`[ProductExtractor] API extraction failed:`, apiError);
      }
    }

    // If API doesn't work, return a helpful error
    return {
      success: false,
      error: `This retailer has strong bot protection. Try right-clicking on the product image, selecting "Copy image address", and paste that direct image URL instead.`,
    };
  }

  return null; // Not a protected site we know about
}

/**
 * Main function to extract product from a URL
 */
export async function extractProductFromUrl(url: string): Promise<ExtractionResult> {
  try {
    // Validate URL
    const validation = validateImageUrl(url);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Try protected site extraction first
    const protectedResult = await tryProtectedSiteExtraction(url);
    if (protectedResult) {
      return protectedResult;
    }

    console.log(`[ProductExtractor] Fetching webpage: ${url}`);

    // Fetch the webpage HTML
    const html = await fetchWebpageHtml(url);

    console.log(`[ProductExtractor] HTML fetched, length: ${html.length}`);

    // If HTML is too short, the site likely blocked us
    if (html.length < 5000) {
      console.log(`[ProductExtractor] HTML too short (${html.length}), site likely blocked the request`);
      return {
        success: false,
        error: `This site appears to have bot protection. Try right-clicking on the product image, selecting "Copy image address", and paste that direct image URL instead.`,
      };
    }

    // Extract product data using AI
    const productData = await extractProductDataFromHtml(html, url);

    console.log(`[ProductExtractor] Product data extracted:`, {
      name: productData.name,
      category: productData.category,
      imageUrl: productData.imageUrl?.substring(0, 100),
    });

    if (!productData.imageUrl) {
      return { success: false, error: 'Could not find product image on the page' };
    }

    // Fetch the product image
    console.log(`[ProductExtractor] Fetching product image...`);
    const fetchedImage = await fetchImageFromUrl(productData.imageUrl);

    // Convert to base64
    const imageBase64 = fetchedImage.buffer.toString('base64');

    // Build the result
    const product: ExtractedProduct = {
      name: productData.name,
      category: productData.category,
      description: productData.description,
      specifications: productData.specifications,
      imageUrl: productData.imageUrl,
      imageBase64,
      imageMimeType: fetchedImage.mimeType,
      sourceUrl: url,
      price: productData.price,
    };

    console.log(`[ProductExtractor] Successfully extracted product: ${product.name}`);

    return { success: true, product };
  } catch (error) {
    console.error('[ProductExtractor] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract product from URL',
    };
  }
}

/**
 * Simpler extraction: just fetch an image URL and analyze it
 * Used when the URL is a direct image link
 */
export async function extractFromDirectImageUrl(imageUrl: string): Promise<ExtractionResult> {
  try {
    // Fetch the image
    const fetchedImage = await fetchImageFromUrl(imageUrl);

    // Analyze with existing AI service
    const analysis = await analyzeImageWithAI(fetchedImage.buffer);

    const imageBase64 = fetchedImage.buffer.toString('base64');

    const product: ExtractedProduct = {
      name: analysis.name,
      category: analysis.category,
      description: analysis.description || `Fashion item from URL`,
      specifications: {},
      imageUrl,
      imageBase64,
      imageMimeType: fetchedImage.mimeType,
      sourceUrl: imageUrl,
    };

    return { success: true, product };
  } catch (error) {
    console.error('[ProductExtractor] Direct image error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch image from URL',
    };
  }
}

/**
 * Smart extraction that determines if URL is direct image or product page
 */
export async function smartExtractProduct(url: string): Promise<ExtractionResult> {
  // Check if URL looks like a direct image link
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const urlLower = url.toLowerCase();
  const isLikelyImage = imageExtensions.some(ext => urlLower.includes(ext));

  if (isLikelyImage) {
    console.log(`[ProductExtractor] URL appears to be direct image, using simple extraction`);
    return extractFromDirectImageUrl(url);
  }

  // Otherwise, treat as product page
  console.log(`[ProductExtractor] URL appears to be product page, using full extraction`);
  return extractProductFromUrl(url);
}
