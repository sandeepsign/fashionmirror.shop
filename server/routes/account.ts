import { Router, Request, Response } from "express";
import { getStorage } from "../storage";
import { requireAuth } from "../middleware/auth";
import {
  generateUserApiKeys,
  generateWebhookSecret,
  toPublicUser,
  getNextQuotaResetDate,
  getEffectiveQuota,
} from "../services/merchantService";
import { sendTestWebhook } from "../services/webhookService";
import type { User } from "@shared/schema";
import { planLimits, type PlanType } from "@shared/schema";

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/account/profile
 * Get current user profile with API info
 */
router.get("/profile", async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const quota = getEffectiveQuota(user);
    const plan = (user.plan as PlanType) || "free";
    const limits = planLimits[plan] || planLimits.free;

    res.json({
      success: true,
      user: toPublicUser(user),
      quota: {
        plan: plan,
        totalQuota: user.totalQuota ?? 100,
        monthlyQuota: user.monthlyQuota ?? null,
        quotaUsed: quota.used,
        studioQuotaUsed: user.studioQuotaUsed ?? 0,
        widgetQuotaUsed: user.widgetQuotaUsed ?? 0,
        quotaResetAt: user.quotaResetAt ? user.quotaResetAt.toISOString() : null,
      },
      planLimits: limits,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to get profile",
      },
    });
  }
});

/**
 * API Key structure stored in user.apiKeys JSON field
 */
interface StoredApiKey {
  id: string;
  key: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
}

/**
 * GET /api/account/keys
 * Get user API keys (multiple keys format)
 */
router.get("/keys", async (req: Request, res: Response) => {
  try {
    const user = req.user as User;

    // Get keys from new apiKeys field, or migrate from old liveKey
    let keys: StoredApiKey[] = [];

    if (user.apiKeys && Array.isArray(user.apiKeys)) {
      keys = user.apiKeys as StoredApiKey[];
    } else if (user.liveKey) {
      // Migration: convert old liveKey to new format
      keys = [{
        id: crypto.randomUUID(),
        key: user.liveKey,
        name: 'Default Key',
        createdAt: new Date().toISOString(),
      }];

      // Save migrated keys
      const storage = await getStorage();
      await storage.updateUser(user.id, { apiKeys: keys });
    }

    res.json({
      success: true,
      keys,
    });
  } catch (error) {
    console.error("Get keys error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to get API keys",
      },
    });
  }
});

/**
 * POST /api/account/keys
 * Create a new API key
 */
router.post("/keys", async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const user = req.user as User;

    if (!name || typeof name !== "string" || name.trim().length < 1) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_NAME",
          message: "Key name is required",
        },
      });
    }

    const storage = await getStorage();
    const currentKeys: StoredApiKey[] = (user.apiKeys as StoredApiKey[]) || [];

    // Limit number of keys (e.g., max 10)
    if (currentKeys.length >= 10) {
      return res.status(400).json({
        success: false,
        error: {
          code: "KEY_LIMIT_REACHED",
          message: "Maximum number of API keys (10) reached. Please delete an existing key first.",
        },
      });
    }

    // Generate new key
    const { liveKey } = generateUserApiKeys();
    const newKey: StoredApiKey = {
      id: crypto.randomUUID(),
      key: liveKey,
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedKeys = [...currentKeys, newKey];

    // Also update liveKey for backwards compatibility
    await storage.updateUser(user.id, {
      apiKeys: updatedKeys,
      liveKey: updatedKeys[0]?.key || liveKey,
    });

    res.json({
      success: true,
      keys: updatedKeys,
      newKey,
      message: "API key created successfully",
    });
  } catch (error) {
    console.error("Create key error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to create API key",
      },
    });
  }
});

/**
 * DELETE /api/account/keys/:keyId
 * Delete an API key
 */
router.delete("/keys/:keyId", async (req: Request, res: Response) => {
  try {
    const { keyId } = req.params;
    const user = req.user as User;

    const storage = await getStorage();
    const currentKeys: StoredApiKey[] = (user.apiKeys as StoredApiKey[]) || [];

    // Find the key to delete
    const keyIndex = currentKeys.findIndex(k => k.id === keyId);
    if (keyIndex === -1) {
      return res.status(404).json({
        success: false,
        error: {
          code: "KEY_NOT_FOUND",
          message: "API key not found",
        },
      });
    }

    // Remove the key
    const updatedKeys = currentKeys.filter(k => k.id !== keyId);

    // Update liveKey for backwards compatibility (use first remaining key or null)
    await storage.updateUser(user.id, {
      apiKeys: updatedKeys,
      liveKey: updatedKeys[0]?.key || null,
    });

    res.json({
      success: true,
      keys: updatedKeys,
      message: "API key deleted successfully",
    });
  } catch (error) {
    console.error("Delete key error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to delete API key",
      },
    });
  }
});

/**
 * POST /api/account/keys/regenerate
 * Regenerate API keys (legacy endpoint for backwards compatibility)
 */
router.post("/keys/regenerate", async (req: Request, res: Response) => {
  try {
    const { keyType } = req.body; // 'live', 'test', or 'both'
    const user = req.user as User;

    if (!keyType || !["live", "test", "both"].includes(keyType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_KEY_TYPE",
          message: "keyType must be 'live', 'test', or 'both'",
        },
      });
    }

    const storage = await getStorage();
    const { liveKey, testKey } = generateUserApiKeys();

    const updates: Partial<User> = {};
    if (keyType === "live" || keyType === "both") {
      updates.liveKey = liveKey;
    }
    if (keyType === "test" || keyType === "both") {
      updates.testKey = testKey;
    }

    const updatedUser = await storage.updateUser(user.id, updates);

    res.json({
      success: true,
      keys: {
        liveKey: updatedUser!.liveKey,
        testKey: updatedUser!.testKey,
      },
      message: `${keyType === "both" ? "Both keys" : `${keyType} key`} regenerated successfully`,
    });
  } catch (error) {
    console.error("Regenerate keys error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to regenerate API keys",
      },
    });
  }
});

/**
 * GET /api/account/domains
 * Get allowed domains
 */
router.get("/domains", async (req: Request, res: Response) => {
  try {
    const user = req.user as User;

    res.json({
      success: true,
      domains: user.allowedDomains || [],
    });
  } catch (error) {
    console.error("Get domains error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to get domains",
      },
    });
  }
});

/**
 * POST /api/account/domains
 * Add an allowed domain
 */
router.post("/domains", async (req: Request, res: Response) => {
  try {
    const { domain } = req.body;
    const user = req.user as User;

    if (!domain || typeof domain !== "string") {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_DOMAIN",
          message: "Domain is required",
        },
      });
    }

    // Validate domain format
    const domainRegex = /^(\*\.)?[a-zA-Z0-9][a-zA-Z0-9-]*(\.[a-zA-Z0-9][a-zA-Z0-9-]*)*$/;
    if (!domainRegex.test(domain)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_DOMAIN_FORMAT",
          message: "Invalid domain format. Use format: example.com or *.example.com",
        },
      });
    }

    const storage = await getStorage();
    const currentDomains = (user.allowedDomains as string[]) || [];

    // Check if domain already exists
    if (currentDomains.includes(domain)) {
      return res.status(409).json({
        success: false,
        error: {
          code: "DOMAIN_EXISTS",
          message: "Domain already in the list",
        },
      });
    }

    // Add domain
    const updatedDomains = [...currentDomains, domain];
    await storage.updateUser(user.id, {
      allowedDomains: updatedDomains,
    });

    res.json({
      success: true,
      domains: updatedDomains,
      message: "Domain added successfully",
    });
  } catch (error) {
    console.error("Add domain error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to add domain",
      },
    });
  }
});

/**
 * DELETE /api/account/domains/:domain
 * Remove an allowed domain
 */
router.delete("/domains/:domain", async (req: Request, res: Response) => {
  try {
    const domain = decodeURIComponent(req.params.domain);
    const user = req.user as User;

    const storage = await getStorage();
    const currentDomains = (user.allowedDomains as string[]) || [];

    // Check if domain exists
    if (!currentDomains.includes(domain)) {
      return res.status(404).json({
        success: false,
        error: {
          code: "DOMAIN_NOT_FOUND",
          message: "Domain not found in the list",
        },
      });
    }

    // Remove domain
    const updatedDomains = currentDomains.filter((d) => d !== domain);
    await storage.updateUser(user.id, {
      allowedDomains: updatedDomains,
    });

    res.json({
      success: true,
      domains: updatedDomains,
      message: "Domain removed successfully",
    });
  } catch (error) {
    console.error("Remove domain error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to remove domain",
      },
    });
  }
});

/**
 * GET /api/account/analytics/overview
 * Get analytics overview (stats for dashboard)
 */
router.get("/analytics/overview", async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const storage = await getStorage();

    // Get analytics data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const analytics = await storage.getWidgetAnalyticsByUser(user.id, thirtyDaysAgo);
    const sessions = await storage.getWidgetSessionsByUser(user.id, 100);

    // Calculate stats from analytics data
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const failedSessions = sessions.filter(s => s.status === 'failed').length;
    const conversionRate = totalSessions > 0 ? (completedSessions / totalSessions * 100).toFixed(1) : '0';

    // Group sessions by day for chart data
    const sessionsByDay = sessions.reduce((acc, session) => {
      const date = new Date(session.createdAt).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Debug log
    console.log('[Analytics] Sessions count:', sessions.length);
    console.log('[Analytics] SessionsByDay:', sessionsByDay);
    if (sessions.length > 0) {
      console.log('[Analytics] First session createdAt:', sessions[0].createdAt);
    }

    const quota = getEffectiveQuota(user);

    res.json({
      success: true,
      analytics: {
        quota: {
          used: quota.used,
          limit: quota.limit,
          isLifetime: quota.isLifetime,
          resetAt: user.quotaResetAt,
        },
        totalSessions,
        completedSessions,
        failedSessions,
        conversionRate: parseFloat(conversionRate),
        sessionsByDay,
      },
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to get analytics",
      },
    });
  }
});

/**
 * GET /api/account/sessions
 * Get recent widget sessions
 */
router.get("/sessions", async (req: Request, res: Response) => {
  try {
    const { limit = "20", offset = "0", status } = req.query;
    const user = req.user as User;

    const storage = await getStorage();
    const allSessions = await storage.getWidgetSessionsByUser(user.id, 100);

    // Build a map of API key IDs to names
    const apiKeyMap = new Map<string, string>();
    if (user.apiKeys && Array.isArray(user.apiKeys)) {
      (user.apiKeys as StoredApiKey[]).forEach(k => {
        apiKeyMap.set(k.id, k.name);
      });
    }
    // Add legacy key fallback
    apiKeyMap.set('legacy', 'Default Key');

    // Filter by status if provided
    let sessions = status
      ? allSessions.filter(s => s.status === status)
      : allSessions;

    // Apply pagination
    const offsetNum = parseInt(offset as string, 10);
    const limitNum = parseInt(limit as string, 10);
    sessions = sessions.slice(offsetNum, offsetNum + limitNum);

    // Enrich sessions with API key name
    const enrichedSessions = sessions.map(session => ({
      ...session,
      apiKeyName: session.apiKeyId ? (apiKeyMap.get(session.apiKeyId) || 'Unknown Key') : null,
    }));

    res.json({
      success: true,
      sessions: enrichedSessions,
    });
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to get sessions",
      },
    });
  }
});

/**
 * PUT /api/account/settings
 * Update user settings
 */
router.put("/settings", async (req: Request, res: Response) => {
  try {
    const { username, webhookUrl, settings } = req.body;
    const user = req.user as User;

    const updates: Partial<User> = {};

    if (username && typeof username === "string" && username.trim().length >= 2) {
      // Check if username is taken
      const storage = await getStorage();
      const existing = await storage.getUserByUsername(username.trim());
      if (existing && existing.id !== user.id) {
        return res.status(409).json({
          success: false,
          error: {
            code: "USERNAME_EXISTS",
            message: "Username already taken",
          },
        });
      }
      updates.username = username.trim();
    }

    if (webhookUrl !== undefined) {
      if (webhookUrl === null || webhookUrl === "") {
        updates.webhookUrl = null;
      } else if (typeof webhookUrl === "string") {
        try {
          new URL(webhookUrl);
          updates.webhookUrl = webhookUrl;
        } catch {
          return res.status(400).json({
            success: false,
            error: {
              code: "INVALID_WEBHOOK_URL",
              message: "Invalid webhook URL format",
            },
          });
        }
      }
    }

    if (settings && typeof settings === "object") {
      updates.settings = { ...(user.settings as object || {}), ...settings };
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "NO_UPDATES",
          message: "No valid updates provided",
        },
      });
    }

    const storage = await getStorage();
    const updatedUser = await storage.updateUser(user.id, updates);

    res.json({
      success: true,
      user: toPublicUser(updatedUser!),
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to update settings",
      },
    });
  }
});

/**
 * POST /api/account/webhook/regenerate-secret
 * Regenerate webhook secret
 */
router.post("/webhook/regenerate-secret", async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const webhookSecret = generateWebhookSecret();

    const storage = await getStorage();
    await storage.updateUser(user.id, { webhookSecret });

    res.json({
      success: true,
      webhookSecret,
      message: "Webhook secret regenerated successfully",
    });
  } catch (error) {
    console.error("Regenerate webhook secret error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to regenerate webhook secret",
      },
    });
  }
});

/**
 * POST /api/account/webhook/test
 * Send a test webhook to the configured URL
 */
router.post("/webhook/test", async (req: Request, res: Response) => {
  try {
    const user = req.user as User;

    if (!user.webhookUrl) {
      return res.status(400).json({
        success: false,
        error: {
          code: "NO_WEBHOOK_URL",
          message: "No webhook URL configured. Please configure a webhook URL first.",
        },
      });
    }

    // sendTestWebhook needs to be updated to work with user ID
    const result = await sendTestWebhook(user.id);

    if (result.success) {
      res.json({
        success: true,
        message: "Test webhook sent successfully",
        statusCode: result.statusCode,
      });
    } else {
      res.status(400).json({
        success: false,
        error: {
          code: "WEBHOOK_FAILED",
          message: result.error || "Failed to send test webhook",
          statusCode: result.statusCode,
        },
      });
    }
  } catch (error) {
    console.error("Test webhook error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to send test webhook",
      },
    });
  }
});

/**
 * DELETE /api/account/sessions
 * Delete multiple widget sessions and their associated images
 */
router.delete("/sessions", async (req: Request, res: Response) => {
  try {
    const { sessionIds } = req.body;
    const user = req.user as User;

    if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_REQUEST",
          message: "sessionIds array is required",
        },
      });
    }

    // Limit batch size
    if (sessionIds.length > 50) {
      return res.status(400).json({
        success: false,
        error: {
          code: "BATCH_TOO_LARGE",
          message: "Maximum 50 sessions can be deleted at once",
        },
      });
    }

    const storage = await getStorage();
    const fs = await import("fs/promises");
    const path = await import("path");
    const mediaRoot = process.env.MEDIA_ROOT || path.join(process.cwd(), "uploads");

    let deletedCount = 0;
    const errors: string[] = [];

    for (const sessionId of sessionIds) {
      try {
        // Get the session first to verify ownership and get image paths
        const session = await storage.getWidgetSession(sessionId);

        if (!session) {
          errors.push(`Session ${sessionId} not found`);
          continue;
        }

        // Verify session belongs to this user
        if (session.userId !== user.id) {
          errors.push(`Session ${sessionId} access denied`);
          continue;
        }

        // Delete result image file if it's a local path
        if (session.resultImage?.startsWith("/media/")) {
          const relativePath = session.resultImage.replace("/media/", "");
          const filePath = path.join(mediaRoot, relativePath);
          try {
            await fs.unlink(filePath);
          } catch (fileError) {
            // File may already be deleted or not exist, continue
            console.warn(`Could not delete file ${filePath}:`, fileError);
          }
        }

        // Delete related analytics entries first (foreign key constraint)
        await storage.deleteWidgetAnalyticsBySession(sessionId);

        // Delete the session from database
        await storage.deleteWidgetSession(sessionId);
        deletedCount++;
      } catch (sessionError) {
        console.error(`Error deleting session ${sessionId}:`, sessionError);
        errors.push(`Session ${sessionId} failed to delete`);
      }
    }

    res.json({
      success: true,
      deletedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully deleted ${deletedCount} session(s)`,
    });
  } catch (error) {
    console.error("Delete sessions error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to delete sessions",
      },
    });
  }
});

/**
 * GET /api/account/sessions/:sessionId/image/:type
 * Serve session images (userImage or resultImage)
 * type can be: 'user' or 'result'
 */
router.get("/sessions/:sessionId/image/:type", async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const { sessionId, type } = req.params;

    if (!["user", "result"].includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_TYPE",
          message: "Image type must be 'user' or 'result'",
        },
      });
    }

    const storage = await getStorage();
    const session = await storage.getWidgetSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          code: "SESSION_NOT_FOUND",
          message: "Session not found",
        },
      });
    }

    // Verify session belongs to this user
    if (session.userId !== user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: "ACCESS_DENIED",
          message: "You do not have access to this session",
        },
      });
    }

    const imagePath = type === "user" ? session.userImage : session.resultImage;

    if (!imagePath) {
      return res.status(404).json({
        success: false,
        error: {
          code: "IMAGE_NOT_FOUND",
          message: `No ${type} image available for this session`,
        },
      });
    }

    // Handle local media paths
    if (imagePath.startsWith("/media/")) {
      const fs = await import("fs/promises");
      const path = await import("path");
      const { createReadStream } = await import("fs");

      const mediaRoot = process.env.MEDIA_ROOT || path.join(process.cwd(), "uploads");
      const relativePath = imagePath.replace("/media/", "");
      const fullPath = path.join(mediaRoot, relativePath);

      try {
        const stats = await fs.stat(fullPath);

        // Determine MIME type
        const ext = path.extname(fullPath).toLowerCase();
        const mimeTypes: Record<string, string> = {
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".png": "image/png",
          ".webp": "image/webp",
          ".gif": "image/gif",
        };
        const mimeType = mimeTypes[ext] || "image/jpeg";

        res.setHeader("Content-Type", mimeType);
        res.setHeader("Content-Length", stats.size.toString());
        res.setHeader("Cache-Control", "private, max-age=3600");

        const stream = createReadStream(fullPath);
        stream.pipe(res);
        return; // Important: prevent fallthrough to 404
      } catch (fileError) {
        return res.status(404).json({
          success: false,
          error: {
            code: "FILE_NOT_FOUND",
            message: "Image file not found",
          },
        });
      }
    } else if (imagePath.startsWith("http")) {
      // Proxy external URLs
      try {
        const response = await fetch(imagePath);
        if (!response.ok) {
          throw new Error("Failed to fetch image");
        }
        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get("content-type") || "image/jpeg";

        res.setHeader("Content-Type", contentType);
        res.setHeader("Cache-Control", "public, max-age=3600");
        return res.send(Buffer.from(buffer));
      } catch (fetchError) {
        return res.status(500).json({
          success: false,
          error: {
            code: "FETCH_FAILED",
            message: "Failed to fetch image",
          },
        });
      }
    } else if (imagePath.startsWith("data:")) {
      // Serve base64 directly
      const matches = imagePath.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");

        res.setHeader("Content-Type", mimeType);
        res.setHeader("Cache-Control", "public, max-age=3600");
        return res.send(buffer);
      }
    }

    res.status(404).json({
      success: false,
      error: {
        code: "IMAGE_NOT_FOUND",
        message: "Image format not recognized",
      },
    });
  } catch (error) {
    console.error("Error serving session image:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to serve image",
      },
    });
  }
});

export default router;
