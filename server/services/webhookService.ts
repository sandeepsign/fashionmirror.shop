import crypto from 'crypto';
import { getStorage } from '../storage';

// Webhook event types
export type WebhookEventType =
  | 'session.created'
  | 'try-on.processing'
  | 'try-on.completed'
  | 'try-on.failed';

// Webhook payload structure
export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: {
    sessionId: string;
    product?: {
      id?: string;
      name?: string;
      image: string;
      category?: string;
      price?: number;
      currency?: string;
    };
    user?: {
      id?: string;
    };
    result?: {
      imageUrl?: string;
      processingTime?: number;
    };
    error?: {
      code?: string;
      message?: string;
    };
  };
}

// Webhook delivery result
export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  error?: string;
  attemptNumber: number;
  timestamp: string;
}

// Webhook log entry for database
export interface WebhookLog {
  userId: string;
  sessionId: string;
  eventType: WebhookEventType;
  webhookUrl: string;
  payload: WebhookPayload;
  deliveryAttempts: WebhookDeliveryResult[];
  status: 'pending' | 'delivered' | 'failed';
  createdAt: Date;
  deliveredAt?: Date;
}

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
export function generateWebhookSignature(
  payload: string,
  timestamp: number,
  secret: string
): string {
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  return `sha256=${signature}`;
}

/**
 * Verify webhook signature (for merchants to use)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp: number,
  secret: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, timestamp, secret);

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Send webhook to merchant endpoint
 */
async function sendWebhook(
  url: string,
  payload: WebhookPayload,
  secret: string,
  attemptNumber: number = 1
): Promise<WebhookDeliveryResult> {
  const timestamp = Math.floor(Date.now() / 1000);
  const payloadString = JSON.stringify(payload);
  const signature = generateWebhookSignature(payloadString, timestamp, secret);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MirrorMe-Signature': signature,
        'X-MirrorMe-Timestamp': timestamp.toString(),
        'X-MirrorMe-Event': payload.event,
        'User-Agent': 'MirrorMe-Webhook/1.0',
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const success = response.status >= 200 && response.status < 300;

    return {
      success,
      statusCode: response.status,
      attemptNumber,
      timestamp: new Date().toISOString(),
      error: success ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      attemptNumber,
      timestamp: new Date().toISOString(),
      error: errorMessage,
    };
  }
}

/**
 * Deliver webhook with retries
 */
async function deliverWebhookWithRetries(
  url: string,
  payload: WebhookPayload,
  secret: string,
  maxAttempts: number = 3,
  retryDelays: number[] = [1000, 5000, 30000] // 1s, 5s, 30s
): Promise<{ success: boolean; attempts: WebhookDeliveryResult[] }> {
  const attempts: WebhookDeliveryResult[] = [];

  for (let i = 0; i < maxAttempts; i++) {
    const result = await sendWebhook(url, payload, secret, i + 1);
    attempts.push(result);

    if (result.success) {
      return { success: true, attempts };
    }

    // Wait before retrying (except on last attempt)
    if (i < maxAttempts - 1 && retryDelays[i]) {
      await new Promise(resolve => setTimeout(resolve, retryDelays[i]));
    }
  }

  return { success: false, attempts };
}

/**
 * Trigger a webhook event for a user
 */
export async function triggerWebhook(
  userId: string,
  eventType: WebhookEventType,
  sessionData: {
    sessionId: string;
    product?: WebhookPayload['data']['product'];
    user?: WebhookPayload['data']['user'];
    result?: WebhookPayload['data']['result'];
    error?: WebhookPayload['data']['error'];
  }
): Promise<{ sent: boolean; error?: string }> {
  try {
    const storage = await getStorage();
    const user = await storage.getUser(userId);

    if (!user) {
      console.log(`[Webhook] User ${userId} not found`);
      return { sent: false, error: 'User not found' };
    }

    // Check if user has webhook configured
    if (!user.webhookUrl) {
      console.log(`[Webhook] User ${userId} has no webhook URL configured`);
      return { sent: false, error: 'No webhook URL configured' };
    }

    if (!user.webhookSecret) {
      console.log(`[Webhook] User ${userId} has no webhook secret`);
      return { sent: false, error: 'No webhook secret configured' };
    }

    // Construct payload
    const payload: WebhookPayload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data: {
        sessionId: sessionData.sessionId,
        product: sessionData.product,
        user: sessionData.user,
        result: sessionData.result,
        error: sessionData.error,
      },
    };

    console.log(`[Webhook] Sending ${eventType} to ${user.webhookUrl} for session ${sessionData.sessionId}`);

    // Deliver webhook asynchronously (don't block the main flow)
    deliverWebhookWithRetries(user.webhookUrl, payload, user.webhookSecret)
      .then(({ success, attempts }) => {
        if (success) {
          console.log(`[Webhook] Successfully delivered ${eventType} to user ${userId} after ${attempts.length} attempt(s)`);
        } else {
          console.error(`[Webhook] Failed to deliver ${eventType} to user ${userId} after ${attempts.length} attempts`);
          // Log failed attempts for debugging
          attempts.forEach((attempt, idx) => {
            console.error(`  Attempt ${idx + 1}: ${attempt.error || 'Unknown error'}`);
          });
        }
      })
      .catch(err => {
        console.error(`[Webhook] Unexpected error delivering webhook:`, err);
      });

    return { sent: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Webhook] Error triggering webhook:`, errorMessage);
    return { sent: false, error: errorMessage };
  }
}

/**
 * Trigger session.created webhook
 */
export async function triggerSessionCreated(
  userId: string,
  sessionId: string,
  product: WebhookPayload['data']['product'],
  user?: WebhookPayload['data']['user']
): Promise<{ sent: boolean; error?: string }> {
  return triggerWebhook(userId, 'session.created', {
    sessionId,
    product,
    user,
  });
}

/**
 * Trigger try-on.processing webhook
 */
export async function triggerTryOnProcessing(
  userId: string,
  sessionId: string,
  product: WebhookPayload['data']['product'],
  user?: WebhookPayload['data']['user']
): Promise<{ sent: boolean; error?: string }> {
  return triggerWebhook(userId, 'try-on.processing', {
    sessionId,
    product,
    user,
  });
}

/**
 * Trigger try-on.completed webhook
 */
export async function triggerTryOnCompleted(
  userId: string,
  sessionId: string,
  product: WebhookPayload['data']['product'],
  result: WebhookPayload['data']['result'],
  user?: WebhookPayload['data']['user']
): Promise<{ sent: boolean; error?: string }> {
  return triggerWebhook(userId, 'try-on.completed', {
    sessionId,
    product,
    user,
    result,
  });
}

/**
 * Trigger try-on.failed webhook
 */
export async function triggerTryOnFailed(
  userId: string,
  sessionId: string,
  product: WebhookPayload['data']['product'],
  error: WebhookPayload['data']['error'],
  user?: WebhookPayload['data']['user']
): Promise<{ sent: boolean; error?: string }> {
  return triggerWebhook(userId, 'try-on.failed', {
    sessionId,
    product,
    user,
    error,
  });
}

/**
 * Test webhook endpoint - sends a test event
 */
export async function sendTestWebhook(
  userId: string
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  try {
    const storage = await getStorage();
    const user = await storage.getUser(userId);

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (!user.webhookUrl) {
      return { success: false, error: 'No webhook URL configured' };
    }

    if (!user.webhookSecret) {
      return { success: false, error: 'No webhook secret configured' };
    }

    // Create test payload
    const payload: WebhookPayload = {
      event: 'try-on.completed',
      timestamp: new Date().toISOString(),
      data: {
        sessionId: 'test_session_' + Date.now(),
        product: {
          id: 'test-product-123',
          name: 'Test Product',
          image: 'https://example.com/test-product.jpg',
          category: 'top',
          price: 49.99,
          currency: 'USD',
        },
        user: {
          id: 'test-user-123',
        },
        result: {
          imageUrl: 'https://fashionmirror.shop/test-result.jpg',
          processingTime: 2500,
        },
      },
    };

    // Send single attempt (no retries for test)
    const result = await sendWebhook(user.webhookUrl, payload, user.webhookSecret, 1);

    return {
      success: result.success,
      statusCode: result.statusCode,
      error: result.error,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

// Export helper for merchants to verify signatures on their end
export const webhookUtils = {
  /**
   * Example code for merchants to verify webhook signatures
   * This is documentation - merchants implement this on their servers
   */
  verificationExample: `
// Node.js example for verifying MirrorMe webhook signatures
const crypto = require('crypto');

function verifyMirrorMeWebhook(payload, signature, timestamp, secret) {
  // Check timestamp to prevent replay attacks (optional, within 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    throw new Error('Webhook timestamp too old');
  }

  // Generate expected signature
  const signedPayload = \`\${timestamp}.\${JSON.stringify(payload)}\`;
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  // Compare signatures using timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Express.js middleware example
app.post('/webhooks/mirrorme', express.json(), (req, res) => {
  const signature = req.headers['x-mirrorme-signature'];
  const timestamp = req.headers['x-mirrorme-timestamp'];
  const secret = process.env.MIRRORME_WEBHOOK_SECRET;

  try {
    if (!verifyMirrorMeWebhook(req.body, signature, timestamp, secret)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Process webhook
    const { event, data } = req.body;
    console.log(\`Received \${event} for session \${data.sessionId}\`);

    // Handle different event types
    switch (event) {
      case 'session.created':
        // New try-on session started
        break;
      case 'try-on.processing':
        // Photo submitted, processing started
        break;
      case 'try-on.completed':
        // Try-on completed successfully
        // data.result.imageUrl contains the generated image
        break;
      case 'try-on.failed':
        // Try-on failed
        // data.error contains the error details
        break;
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});
`,
};
