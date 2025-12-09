import { Router } from "express";
import { getStorage } from "../storage";
import { requireAuth } from "../middleware/auth";
import { generateUserApiKeys, generateWebhookSecret, toPublicUser, getEffectiveQuota, } from "../services/merchantService";
import { sendTestWebhook } from "../services/webhookService";
import { planLimits } from "@shared/schema";
const router = Router();
// All routes require authentication
router.use(requireAuth);
/**
 * GET /api/account/profile
 * Get current user profile with API info
 */
router.get("/profile", async (req, res) => {
    try {
        const user = req.user;
        const quota = getEffectiveQuota(user);
        const plan = user.plan || "free";
        const limits = planLimits[plan] || planLimits.free;
        res.json({
            success: true,
            user: toPublicUser(user),
            quota: {
                used: quota.used,
                limit: quota.limit,
                isLifetime: quota.isLifetime,
                resetAt: user.quotaResetAt,
            },
            planLimits: limits,
        });
    }
    catch (error) {
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
 * GET /api/account/keys
 * Get user API keys (with masked versions)
 */
router.get("/keys", async (req, res) => {
    try {
        const user = req.user;
        res.json({
            success: true,
            keys: {
                liveKey: user.liveKey,
                testKey: user.testKey,
                liveKeyMasked: user.liveKey ? `${user.liveKey.slice(0, 12)}...${user.liveKey.slice(-4)}` : null,
                testKeyMasked: user.testKey ? `${user.testKey.slice(0, 12)}...${user.testKey.slice(-4)}` : null,
            },
        });
    }
    catch (error) {
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
 * POST /api/account/keys/regenerate
 * Regenerate API keys
 */
router.post("/keys/regenerate", async (req, res) => {
    try {
        const { keyType } = req.body; // 'live', 'test', or 'both'
        const user = req.user;
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
        const updates = {};
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
                liveKey: updatedUser.liveKey,
                testKey: updatedUser.testKey,
            },
            message: `${keyType === "both" ? "Both keys" : `${keyType} key`} regenerated successfully`,
        });
    }
    catch (error) {
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
router.get("/domains", async (req, res) => {
    try {
        const user = req.user;
        res.json({
            success: true,
            domains: user.allowedDomains || [],
        });
    }
    catch (error) {
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
router.post("/domains", async (req, res) => {
    try {
        const { domain } = req.body;
        const user = req.user;
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
        const currentDomains = user.allowedDomains || [];
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
    }
    catch (error) {
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
router.delete("/domains/:domain", async (req, res) => {
    try {
        const domain = decodeURIComponent(req.params.domain);
        const user = req.user;
        const storage = await getStorage();
        const currentDomains = user.allowedDomains || [];
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
    }
    catch (error) {
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
router.get("/analytics/overview", async (req, res) => {
    try {
        const user = req.user;
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
        }, {});
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
    }
    catch (error) {
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
router.get("/sessions", async (req, res) => {
    try {
        const { limit = "20", offset = "0", status } = req.query;
        const user = req.user;
        const storage = await getStorage();
        const allSessions = await storage.getWidgetSessionsByUser(user.id, 100);
        // Filter by status if provided
        let sessions = status
            ? allSessions.filter(s => s.status === status)
            : allSessions;
        // Apply pagination
        const offsetNum = parseInt(offset, 10);
        const limitNum = parseInt(limit, 10);
        sessions = sessions.slice(offsetNum, offsetNum + limitNum);
        res.json({
            success: true,
            sessions,
        });
    }
    catch (error) {
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
router.put("/settings", async (req, res) => {
    try {
        const { username, webhookUrl, settings } = req.body;
        const user = req.user;
        const updates = {};
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
            }
            else if (typeof webhookUrl === "string") {
                try {
                    new URL(webhookUrl);
                    updates.webhookUrl = webhookUrl;
                }
                catch {
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
            updates.settings = { ...(user.settings || {}), ...settings };
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
            user: toPublicUser(updatedUser),
            message: "Settings updated successfully",
        });
    }
    catch (error) {
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
router.post("/webhook/regenerate-secret", async (req, res) => {
    try {
        const user = req.user;
        const webhookSecret = generateWebhookSecret();
        const storage = await getStorage();
        await storage.updateUser(user.id, { webhookSecret });
        res.json({
            success: true,
            webhookSecret,
            message: "Webhook secret regenerated successfully",
        });
    }
    catch (error) {
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
router.post("/webhook/test", async (req, res) => {
    try {
        const user = req.user;
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
        }
        else {
            res.status(400).json({
                success: false,
                error: {
                    code: "WEBHOOK_FAILED",
                    message: result.error || "Failed to send test webhook",
                    statusCode: result.statusCode,
                },
            });
        }
    }
    catch (error) {
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
export default router;
