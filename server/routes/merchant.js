import { Router } from "express";
import { getStorage } from "../storage";
import { generateMerchantKeys, generateWebhookSecret, hashPassword, verifyPassword, toPublicMerchant, getNextQuotaResetDate, getPlanLimits, } from "../services/merchantService";
import { sendTestWebhook } from "../services/webhookService";
import { registerMerchantSchema, loginMerchantSchema, } from "@shared/schema";
const router = Router();
/**
 * Middleware to require merchant authentication via session
 */
async function requireMerchantAuth(req, res, next) {
    const merchantId = req.session?.merchantId;
    if (!merchantId) {
        return res.status(401).json({
            success: false,
            error: {
                code: "UNAUTHORIZED",
                message: "Please log in to access this resource",
            },
        });
    }
    try {
        const storage = await getStorage();
        const merchant = await storage.getMerchant(merchantId);
        if (!merchant) {
            req.session.destroy(() => { });
            return res.status(401).json({
                success: false,
                error: {
                    code: "MERCHANT_NOT_FOUND",
                    message: "Merchant account not found",
                },
            });
        }
        if (merchant.status !== "active") {
            return res.status(403).json({
                success: false,
                error: {
                    code: "MERCHANT_SUSPENDED",
                    message: "Your account has been suspended",
                },
            });
        }
        req.merchantSession = { merchantId: merchant.id };
        next();
    }
    catch (error) {
        console.error("Merchant auth error:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Authentication failed",
            },
        });
    }
}
/**
 * POST /api/merchants/register
 * Register a new merchant account
 */
router.post("/register", async (req, res) => {
    try {
        // Validate request body
        const validationResult = registerMerchantSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid registration data",
                    details: validationResult.error.errors,
                },
            });
        }
        const { name, email, password, websiteUrl } = validationResult.data;
        const storage = await getStorage();
        // Check if email already exists
        const existingMerchant = await storage.getMerchantByEmail(email);
        if (existingMerchant) {
            return res.status(409).json({
                success: false,
                error: {
                    code: "EMAIL_EXISTS",
                    message: "An account with this email already exists",
                },
            });
        }
        // Hash password
        const passwordHash = await hashPassword(password);
        // Generate API keys
        const { liveKey, testKey } = generateMerchantKeys();
        // Generate webhook secret
        const webhookSecret = generateWebhookSecret();
        // Set initial allowed domains from website URL
        const allowedDomains = [];
        if (websiteUrl) {
            try {
                const url = new URL(websiteUrl);
                allowedDomains.push(url.hostname);
                allowedDomains.push(`*.${url.hostname}`);
            }
            catch {
                // Ignore invalid URL
            }
        }
        // Create merchant
        const merchant = await storage.createMerchant({
            name,
            email,
            passwordHash,
            liveKey,
            testKey,
            allowedDomains,
            plan: "free",
            monthlyQuota: 100,
            quotaUsed: 0,
            quotaResetAt: getNextQuotaResetDate(),
            settings: {},
            webhookUrl: null,
            webhookSecret,
            status: "active",
        });
        // Set session
        req.session.merchantId = merchant.id;
        req.session.merchantEmail = merchant.email;
        res.status(201).json({
            success: true,
            merchant: toPublicMerchant(merchant),
            message: "Account created successfully",
        });
    }
    catch (error) {
        console.error("Merchant registration error:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to create account",
            },
        });
    }
});
/**
 * POST /api/merchants/login
 * Log in to merchant account
 */
router.post("/login", async (req, res) => {
    try {
        // Validate request body
        const validationResult = loginMerchantSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid login credentials",
                    details: validationResult.error.errors,
                },
            });
        }
        const { email, password } = validationResult.data;
        const storage = await getStorage();
        // Find merchant by email
        const merchant = await storage.getMerchantByEmail(email);
        if (!merchant) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "INVALID_CREDENTIALS",
                    message: "Invalid email or password",
                },
            });
        }
        // Verify password
        const isValid = await verifyPassword(password, merchant.passwordHash);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "INVALID_CREDENTIALS",
                    message: "Invalid email or password",
                },
            });
        }
        // Check merchant status
        if (merchant.status !== "active") {
            return res.status(403).json({
                success: false,
                error: {
                    code: "MERCHANT_SUSPENDED",
                    message: "Your account has been suspended",
                },
            });
        }
        // Regenerate session for security (prevent session fixation)
        req.session.regenerate((err) => {
            if (err) {
                console.error("Session regeneration error:", err);
                return res.status(500).json({
                    success: false,
                    error: {
                        code: "INTERNAL_ERROR",
                        message: "Failed to create session",
                    },
                });
            }
            // Set session
            req.session.merchantId = merchant.id;
            req.session.merchantEmail = merchant.email;
            res.json({
                success: true,
                merchant: toPublicMerchant(merchant),
                message: "Logged in successfully",
            });
        });
    }
    catch (error) {
        console.error("Merchant login error:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to log in",
            },
        });
    }
});
/**
 * POST /api/merchants/logout
 * Log out of merchant account
 */
router.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Session destroy error:", err);
            return res.status(500).json({
                success: false,
                error: {
                    code: "INTERNAL_ERROR",
                    message: "Failed to log out",
                },
            });
        }
        res.clearCookie("connect.sid");
        res.json({
            success: true,
            message: "Logged out successfully",
        });
    });
});
/**
 * GET /api/merchants/me
 * Get current merchant profile
 */
router.get("/me", requireMerchantAuth, async (req, res) => {
    try {
        const storage = await getStorage();
        const merchant = await storage.getMerchant(req.merchantSession.merchantId);
        if (!merchant) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "MERCHANT_NOT_FOUND",
                    message: "Merchant not found",
                },
            });
        }
        // Get plan limits
        const planLimits = getPlanLimits(merchant.plan || "free");
        res.json({
            success: true,
            merchant: {
                ...toPublicMerchant(merchant),
                planLimits,
            },
        });
    }
    catch (error) {
        console.error("Get merchant error:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to get merchant profile",
            },
        });
    }
});
/**
 * GET /api/merchants/keys
 * Get merchant API keys (with masked versions)
 */
router.get("/keys", requireMerchantAuth, async (req, res) => {
    try {
        const storage = await getStorage();
        const merchant = await storage.getMerchant(req.merchantSession.merchantId);
        if (!merchant) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "MERCHANT_NOT_FOUND",
                    message: "Merchant not found",
                },
            });
        }
        res.json({
            success: true,
            keys: {
                liveKey: merchant.liveKey,
                testKey: merchant.testKey,
                liveKeyMasked: `${merchant.liveKey.slice(0, 12)}...${merchant.liveKey.slice(-4)}`,
                testKeyMasked: `${merchant.testKey.slice(0, 12)}...${merchant.testKey.slice(-4)}`,
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
 * POST /api/merchants/keys/regenerate
 * Regenerate API keys
 */
router.post("/keys/regenerate", requireMerchantAuth, async (req, res) => {
    try {
        const { keyType } = req.body; // 'live', 'test', or 'both'
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
        const { liveKey, testKey } = generateMerchantKeys();
        const updates = {};
        if (keyType === "live" || keyType === "both") {
            updates.liveKey = liveKey;
        }
        if (keyType === "test" || keyType === "both") {
            updates.testKey = testKey;
        }
        await storage.updateMerchant(req.merchantSession.merchantId, updates);
        const merchant = await storage.getMerchant(req.merchantSession.merchantId);
        res.json({
            success: true,
            keys: {
                liveKey: merchant.liveKey,
                testKey: merchant.testKey,
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
 * GET /api/merchants/domains
 * Get allowed domains
 */
router.get("/domains", requireMerchantAuth, async (req, res) => {
    try {
        const storage = await getStorage();
        const merchant = await storage.getMerchant(req.merchantSession.merchantId);
        if (!merchant) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "MERCHANT_NOT_FOUND",
                    message: "Merchant not found",
                },
            });
        }
        res.json({
            success: true,
            domains: merchant.allowedDomains || [],
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
 * POST /api/merchants/domains
 * Add an allowed domain
 */
router.post("/domains", requireMerchantAuth, async (req, res) => {
    try {
        const { domain } = req.body;
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
        const merchant = await storage.getMerchant(req.merchantSession.merchantId);
        if (!merchant) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "MERCHANT_NOT_FOUND",
                    message: "Merchant not found",
                },
            });
        }
        const currentDomains = merchant.allowedDomains || [];
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
        await storage.updateMerchant(req.merchantSession.merchantId, {
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
 * DELETE /api/merchants/domains/:domain
 * Remove an allowed domain
 */
router.delete("/domains/:domain", requireMerchantAuth, async (req, res) => {
    try {
        const domain = decodeURIComponent(req.params.domain);
        const storage = await getStorage();
        const merchant = await storage.getMerchant(req.merchantSession.merchantId);
        if (!merchant) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "MERCHANT_NOT_FOUND",
                    message: "Merchant not found",
                },
            });
        }
        const currentDomains = merchant.allowedDomains || [];
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
        await storage.updateMerchant(req.merchantSession.merchantId, {
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
 * GET /api/merchants/analytics/overview
 * Get analytics overview (stats for dashboard)
 */
router.get("/analytics/overview", requireMerchantAuth, async (req, res) => {
    try {
        const storage = await getStorage();
        const merchantId = req.merchantSession.merchantId;
        // Get merchant for quota info
        const merchant = await storage.getMerchant(merchantId);
        if (!merchant) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "MERCHANT_NOT_FOUND",
                    message: "Merchant not found",
                },
            });
        }
        // Get analytics data
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const analytics = await storage.getWidgetAnalyticsByMerchant(merchantId, thirtyDaysAgo);
        const sessions = await storage.getWidgetSessionsByMerchant(merchantId, 100);
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
        const stats = {
            totalSessions,
            completedSessions,
            failedSessions,
            conversionRate: parseFloat(conversionRate),
            sessionsByDay,
        };
        res.json({
            success: true,
            analytics: {
                quota: {
                    used: merchant.quotaUsed || 0,
                    limit: merchant.monthlyQuota || 100,
                    resetAt: merchant.quotaResetAt,
                },
                ...stats,
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
 * GET /api/merchants/sessions
 * Get recent widget sessions
 */
router.get("/sessions", requireMerchantAuth, async (req, res) => {
    try {
        const { limit = "20", offset = "0", status } = req.query;
        const storage = await getStorage();
        const allSessions = await storage.getWidgetSessionsByMerchant(req.merchantSession.merchantId, 100 // Get more sessions for filtering
        );
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
 * PUT /api/merchants/settings
 * Update merchant settings
 */
router.put("/settings", requireMerchantAuth, async (req, res) => {
    try {
        const { name, webhookUrl, settings } = req.body;
        const updates = {};
        if (name && typeof name === "string" && name.trim().length >= 2) {
            updates.name = name.trim();
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
            const storage = await getStorage();
            const merchant = await storage.getMerchant(req.merchantSession.merchantId);
            updates.settings = { ...(merchant?.settings || {}), ...settings };
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
        updates.updatedAt = new Date();
        const storage = await getStorage();
        await storage.updateMerchant(req.merchantSession.merchantId, updates);
        const merchant = await storage.getMerchant(req.merchantSession.merchantId);
        res.json({
            success: true,
            merchant: toPublicMerchant(merchant),
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
 * POST /api/merchants/webhook/regenerate-secret
 * Regenerate webhook secret
 */
router.post("/webhook/regenerate-secret", requireMerchantAuth, async (req, res) => {
    try {
        const webhookSecret = generateWebhookSecret();
        const storage = await getStorage();
        await storage.updateMerchant(req.merchantSession.merchantId, {
            webhookSecret,
            updatedAt: new Date(),
        });
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
 * POST /api/merchants/webhook/test
 * Send a test webhook to the configured URL
 */
router.post("/webhook/test", requireMerchantAuth, async (req, res) => {
    try {
        const storage = await getStorage();
        const merchant = await storage.getMerchant(req.merchantSession.merchantId);
        if (!merchant) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "MERCHANT_NOT_FOUND",
                    message: "Merchant not found",
                },
            });
        }
        if (!merchant.webhookUrl) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "NO_WEBHOOK_URL",
                    message: "No webhook URL configured. Please configure a webhook URL first.",
                },
            });
        }
        const result = await sendTestWebhook(merchant.id);
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
