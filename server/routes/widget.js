import { Router } from "express";
import multer from "multer";
import { getStorage } from "../storage";
import { widgetAuth, checkQuota, incrementQuota } from "../middleware/widgetAuth";
import { generateSessionId, extractDomain, } from "../services/merchantService";
import { createWidgetSessionSchema, trackWidgetEventSchema, } from "@shared/schema";
import { generateVirtualTryOn, imageBufferToBase64 } from "../services/gemini";
import { triggerSessionCreated, triggerTryOnProcessing, triggerTryOnCompleted, triggerTryOnFailed, } from "../services/webhookService";
const router = Router();
// Configure multer for photo uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        }
        else {
            cb(new Error("Only image files are allowed"));
        }
    },
});
/**
 * POST /api/widget/verify
 * Verify API key and domain
 */
router.post("/verify", widgetAuth, async (req, res) => {
    try {
        const user = req.widgetUser;
        const quota = {
            used: user.quotaUsed ?? 0,
            limit: user.monthlyQuota ?? user.totalQuota ?? 100,
            isLifetime: !user.monthlyQuota,
        };
        res.json({
            success: true,
            account: {
                id: user.id,
                username: user.username,
                plan: user.plan,
                quotaUsed: quota.used,
                quotaLimit: quota.limit,
                isLifetimeQuota: quota.isLifetime,
            },
            isTestMode: req.isTestMode,
        });
    }
    catch (error) {
        console.error("Error verifying API key:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to verify API key",
            },
        });
    }
});
/**
 * POST /api/widget/session
 * Create a new try-on session
 */
router.post("/session", widgetAuth, async (req, res) => {
    try {
        const user = req.widgetUser;
        // Validate request body
        const validationResult = createWidgetSessionSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid request body",
                    details: validationResult.error.errors,
                },
            });
        }
        const { product, user: sessionUser, options } = validationResult.data;
        // Generate session ID
        const sessionId = generateSessionId();
        // Calculate expiration (1 hour from now)
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        // Extract origin domain
        const origin = req.headers.origin || req.headers.referer;
        const originDomain = origin ? extractDomain(origin) : null;
        // Create session in database
        const storage = await getStorage();
        const session = await storage.createWidgetSession({
            id: sessionId,
            userId: user.id,
            productImage: product.image,
            productName: product.name || null,
            productId: product.id || null,
            productCategory: product.category || null,
            productPrice: product.price?.toString() || null,
            productCurrency: product.currency || null,
            productUrl: product.url || null,
            externalUserId: sessionUser?.id || null,
            userImage: sessionUser?.image || null,
            status: sessionUser?.image && options?.skipPhotoStep ? "pending" : "pending",
            originDomain: originDomain || null,
            userAgent: req.headers["user-agent"] || null,
            ipAddress: req.ip || null,
            expiresAt,
        });
        // Track session creation event
        await storage.createWidgetAnalytics({
            userId: user.id,
            sessionId: session.id,
            eventType: "impression",
            eventData: {
                productId: product.id,
                productCategory: product.category,
                hasUserImage: !!sessionUser?.image,
            },
        });
        // Trigger session.created webhook
        triggerSessionCreated(user.id, session.id, {
            id: product.id,
            name: product.name,
            image: product.image,
            category: product.category,
            price: product.price,
            currency: product.currency,
        }, sessionUser ? { id: sessionUser.id } : undefined);
        // Build iframe URL
        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
        const iframeUrl = `${baseUrl}/widget/embed?session=${sessionId}`;
        res.status(201).json({
            success: true,
            session: {
                id: session.id,
                status: session.status,
                expiresAt: session.expiresAt,
                product: {
                    image: session.productImage,
                    name: session.productName,
                    id: session.productId,
                    category: session.productCategory,
                    price: session.productPrice,
                    currency: session.productCurrency,
                },
                iframeUrl,
            },
        });
    }
    catch (error) {
        console.error("Error creating session:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to create session",
            },
        });
    }
});
/**
 * GET /api/widget/session/:id
 * Get session status and result
 */
router.get("/session/:id", widgetAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.widgetUser;
        const storage = await getStorage();
        const session = await storage.getWidgetSession(id);
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
        // Check if session has expired
        if (session.expiresAt && new Date() > session.expiresAt) {
            return res.status(410).json({
                success: false,
                error: {
                    code: "SESSION_EXPIRED",
                    message: "Session has expired",
                },
            });
        }
        res.json({
            success: true,
            session: {
                id: session.id,
                status: session.status,
                product: {
                    image: session.productImage,
                    name: session.productName,
                    id: session.productId,
                    category: session.productCategory,
                    price: session.productPrice,
                    currency: session.productCurrency,
                },
                result: session.resultImage
                    ? {
                        imageUrl: session.resultImage,
                        thumbnailUrl: session.resultThumbnail,
                        processingTime: session.processingTime,
                    }
                    : null,
                error: session.errorCode
                    ? {
                        code: session.errorCode,
                        message: session.errorMessage,
                    }
                    : null,
                createdAt: session.createdAt,
                completedAt: session.completedAt,
                expiresAt: session.expiresAt,
            },
        });
    }
    catch (error) {
        console.error("Error getting session:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to get session",
            },
        });
    }
});
/**
 * DELETE /api/widget/session/:id
 * Cancel/expire a session
 */
router.delete("/session/:id", widgetAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.widgetUser;
        const storage = await getStorage();
        const session = await storage.getWidgetSession(id);
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
        // Update session status to expired
        await storage.updateWidgetSession(id, {
            status: "expired",
            expiresAt: new Date(),
        });
        res.json({
            success: true,
            message: "Session cancelled successfully",
        });
    }
    catch (error) {
        console.error("Error deleting session:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to cancel session",
            },
        });
    }
});
/**
 * POST /api/widget/try-on
 * Submit photo and generate try-on
 */
router.post("/try-on", widgetAuth, checkQuota, upload.single("photo"), async (req, res) => {
    const startTime = Date.now();
    try {
        const user = req.widgetUser;
        const { sessionId, photoUrl } = req.body;
        const photoFile = req.file;
        // Validate session ID
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "MISSING_SESSION_ID",
                    message: "Session ID is required",
                },
            });
        }
        // Validate photo source
        if (!photoFile && !photoUrl) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "MISSING_PHOTO",
                    message: "Either photo file or photoUrl is required",
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
        // Check if session has expired
        if (session.expiresAt && new Date() > session.expiresAt) {
            return res.status(410).json({
                success: false,
                error: {
                    code: "SESSION_EXPIRED",
                    message: "Session has expired",
                },
            });
        }
        // Check if session is already completed or processing
        if (session.status === "completed") {
            return res.status(400).json({
                success: false,
                error: {
                    code: "SESSION_ALREADY_COMPLETED",
                    message: "This session has already been processed",
                },
            });
        }
        if (session.status === "processing") {
            return res.status(400).json({
                success: false,
                error: {
                    code: "SESSION_PROCESSING",
                    message: "This session is currently being processed",
                },
            });
        }
        // Update session status to processing
        await storage.updateWidgetSession(sessionId, {
            status: "processing",
        });
        // Track processing start
        await storage.createWidgetAnalytics({
            userId: user.id,
            sessionId: sessionId,
            eventType: "processing_start",
            eventData: {
                photoSource: photoFile ? "upload" : "url",
            },
        });
        // Trigger try-on.processing webhook
        triggerTryOnProcessing(user.id, sessionId, {
            id: session.productId || undefined,
            name: session.productName || undefined,
            image: session.productImage,
            category: session.productCategory || undefined,
            price: session.productPrice ? parseFloat(session.productPrice) : undefined,
            currency: session.productCurrency || undefined,
        }, session.externalUserId ? { id: session.externalUserId } : undefined);
        // Get user photo as base64
        let userPhotoBase64;
        if (photoFile) {
            userPhotoBase64 = imageBufferToBase64(photoFile.buffer);
        }
        else if (photoUrl) {
            // Fetch photo from URL
            try {
                const response = await fetch(photoUrl);
                if (!response.ok) {
                    throw new Error(`Failed to fetch photo: ${response.status}`);
                }
                const buffer = await response.arrayBuffer();
                userPhotoBase64 = Buffer.from(buffer).toString("base64");
            }
            catch (fetchError) {
                await storage.updateWidgetSession(sessionId, {
                    status: "failed",
                    errorCode: "INVALID_USER_IMAGE",
                    errorMessage: "Failed to fetch user photo from URL",
                });
                // Trigger try-on.failed webhook
                triggerTryOnFailed(user.id, sessionId, {
                    id: session.productId || undefined,
                    name: session.productName || undefined,
                    image: session.productImage,
                    category: session.productCategory || undefined,
                }, {
                    code: "INVALID_USER_IMAGE",
                    message: "Failed to fetch user photo from URL",
                }, session.externalUserId ? { id: session.externalUserId } : undefined);
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "INVALID_USER_IMAGE",
                        message: "Failed to fetch user photo from URL",
                    },
                });
            }
        }
        else {
            return res.status(400).json({
                success: false,
                error: {
                    code: "MISSING_PHOTO",
                    message: "No photo provided",
                },
            });
        }
        // Fetch product image
        let productImageBase64;
        try {
            const response = await fetch(session.productImage);
            if (!response.ok) {
                throw new Error(`Failed to fetch product image: ${response.status}`);
            }
            const buffer = await response.arrayBuffer();
            productImageBase64 = Buffer.from(buffer).toString("base64");
        }
        catch (fetchError) {
            await storage.updateWidgetSession(sessionId, {
                status: "failed",
                errorCode: "INVALID_PRODUCT_IMAGE",
                errorMessage: "Failed to fetch product image",
            });
            // Trigger try-on.failed webhook
            triggerTryOnFailed(user.id, sessionId, {
                id: session.productId || undefined,
                name: session.productName || undefined,
                image: session.productImage,
                category: session.productCategory || undefined,
            }, {
                code: "INVALID_PRODUCT_IMAGE",
                message: "Failed to fetch product image",
            }, session.externalUserId ? { id: session.externalUserId } : undefined);
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_PRODUCT_IMAGE",
                    message: "Failed to fetch product image",
                },
            });
        }
        // Generate virtual try-on
        try {
            const result = await generateVirtualTryOn({
                modelImageBase64: userPhotoBase64,
                fashionImageBase64: productImageBase64,
                fashionItemName: session.productName || "Fashion Item",
                fashionCategory: session.productCategory || "clothing",
                userId: `widget_${user.id}`,
            });
            if (!result.success) {
                await storage.updateWidgetSession(sessionId, {
                    status: "failed",
                    errorCode: "PROCESSING_FAILED",
                    errorMessage: result.error || "Failed to generate try-on",
                });
                // Track error
                await storage.createWidgetAnalytics({
                    userId: user.id,
                    sessionId: sessionId,
                    eventType: "error",
                    eventData: {
                        errorCode: "PROCESSING_FAILED",
                        errorMessage: result.error,
                    },
                });
                // Trigger try-on.failed webhook
                triggerTryOnFailed(user.id, sessionId, {
                    id: session.productId || undefined,
                    name: session.productName || undefined,
                    image: session.productImage,
                    category: session.productCategory || undefined,
                }, {
                    code: "PROCESSING_FAILED",
                    message: result.error || "Failed to generate try-on",
                }, session.externalUserId ? { id: session.externalUserId } : undefined);
                return res.status(500).json({
                    success: false,
                    error: {
                        code: "PROCESSING_FAILED",
                        message: result.error || "Failed to generate try-on",
                    },
                });
            }
            const processingTime = Date.now() - startTime;
            // Update session with result
            await storage.updateWidgetSession(sessionId, {
                status: "completed",
                resultImage: result.resultImageUrl,
                resultThumbnail: result.resultImageUrl, // Same as result for now
                processingTime,
                completedAt: new Date(),
            });
            // Increment user quota
            await incrementQuota(user.id);
            // Track completion
            await storage.createWidgetAnalytics({
                userId: user.id,
                sessionId: sessionId,
                eventType: "completed",
                eventData: {
                    processingTime,
                },
            });
            // Trigger try-on.completed webhook
            triggerTryOnCompleted(user.id, sessionId, {
                id: session.productId || undefined,
                name: session.productName || undefined,
                image: session.productImage,
                category: session.productCategory || undefined,
                price: session.productPrice ? parseFloat(session.productPrice) : undefined,
                currency: session.productCurrency || undefined,
            }, {
                imageUrl: result.resultImageUrl,
                processingTime,
            }, session.externalUserId ? { id: session.externalUserId } : undefined);
            // Build download URL
            const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
            res.json({
                success: true,
                result: {
                    sessionId,
                    status: "completed",
                    imageUrl: result.resultImageUrl,
                    thumbnailUrl: result.resultImageUrl,
                    downloadUrl: `${baseUrl}/api/widget/download/${sessionId}`,
                    expiresAt: session.expiresAt,
                    processingTime,
                },
            });
        }
        catch (genError) {
            console.error("Try-on generation error:", genError);
            await storage.updateWidgetSession(sessionId, {
                status: "failed",
                errorCode: "PROCESSING_FAILED",
                errorMessage: genError instanceof Error ? genError.message : "Unknown error",
            });
            // Track error
            await storage.createWidgetAnalytics({
                userId: user.id,
                sessionId: sessionId,
                eventType: "error",
                eventData: {
                    errorCode: "PROCESSING_FAILED",
                    errorMessage: genError instanceof Error ? genError.message : "Unknown error",
                },
            });
            // Trigger try-on.failed webhook
            triggerTryOnFailed(user.id, sessionId, {
                id: session.productId || undefined,
                name: session.productName || undefined,
                image: session.productImage,
                category: session.productCategory || undefined,
            }, {
                code: "PROCESSING_FAILED",
                message: genError instanceof Error ? genError.message : "Unknown error",
            }, session.externalUserId ? { id: session.externalUserId } : undefined);
            return res.status(500).json({
                success: false,
                error: {
                    code: "PROCESSING_FAILED",
                    message: "Failed to generate try-on result",
                },
            });
        }
    }
    catch (error) {
        console.error("Error processing try-on:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to process try-on request",
            },
        });
    }
});
/**
 * GET /api/widget/result/:sessionId
 * Get the result image for a session
 */
router.get("/result/:sessionId", async (req, res) => {
    try {
        const { sessionId } = req.params;
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
        if (!session.resultImage) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "RESULT_NOT_FOUND",
                    message: "Result not available yet",
                },
            });
        }
        // Check if session has expired
        if (session.expiresAt && new Date() > session.expiresAt) {
            return res.status(410).json({
                success: false,
                error: {
                    code: "SESSION_EXPIRED",
                    message: "Session has expired",
                },
            });
        }
        // If result is a local media path, read and serve the file directly
        if (session.resultImage.startsWith("/media/")) {
            const fs = await import("fs/promises");
            const path = await import("path");
            // Convert URL path to filesystem path
            const mediaRoot = process.env.MEDIA_ROOT || path.join(process.cwd(), "uploads");
            const relativePath = session.resultImage.replace("/media/", "");
            const filePath = path.join(mediaRoot, relativePath);
            try {
                const fileBuffer = await fs.readFile(filePath);
                res.setHeader("Content-Type", "image/jpeg");
                res.setHeader("Cache-Control", "public, max-age=3600");
                res.setHeader("Access-Control-Allow-Origin", "*");
                return res.send(fileBuffer);
            }
            catch (fileError) {
                console.error("Error reading result image file:", fileError);
                return res.status(404).json({
                    success: false,
                    error: {
                        code: "RESULT_NOT_FOUND",
                        message: "Result image file not found",
                    },
                });
            }
        }
        // If result is an external URL, fetch and serve it
        if (session.resultImage.startsWith("http")) {
            try {
                const response = await fetch(session.resultImage);
                if (!response.ok) {
                    throw new Error("Failed to fetch image");
                }
                const buffer = await response.arrayBuffer();
                const contentType = response.headers.get("content-type") || "image/jpeg";
                res.setHeader("Content-Type", contentType);
                res.setHeader("Cache-Control", "public, max-age=3600");
                res.setHeader("Access-Control-Allow-Origin", "*");
                return res.send(Buffer.from(buffer));
            }
            catch (fetchError) {
                console.error("Error fetching result image:", fetchError);
                return res.status(500).json({
                    success: false,
                    error: {
                        code: "FETCH_FAILED",
                        message: "Failed to fetch result image",
                    },
                });
            }
        }
        // If result is base64, serve it directly
        if (session.resultImage.startsWith("data:")) {
            const matches = session.resultImage.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
                const mimeType = matches[1];
                const base64Data = matches[2];
                const buffer = Buffer.from(base64Data, "base64");
                res.setHeader("Content-Type", mimeType);
                res.setHeader("Cache-Control", "public, max-age=3600");
                res.setHeader("Access-Control-Allow-Origin", "*");
                return res.send(buffer);
            }
        }
        res.status(404).json({
            success: false,
            error: {
                code: "RESULT_NOT_FOUND",
                message: "Result format not recognized",
            },
        });
    }
    catch (error) {
        console.error("Error getting result:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to get result",
            },
        });
    }
});
/**
 * GET /api/widget/download/:sessionId
 * Download the result image
 */
router.get("/download/:sessionId", async (req, res) => {
    try {
        const { sessionId } = req.params;
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
        if (!session.resultImage) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "RESULT_NOT_FOUND",
                    message: "Result not available yet",
                },
            });
        }
        // Check if session has expired
        if (session.expiresAt && new Date() > session.expiresAt) {
            return res.status(410).json({
                success: false,
                error: {
                    code: "SESSION_EXPIRED",
                    message: "Session has expired",
                },
            });
        }
        // Track download
        if (session.userId) {
            await storage.createWidgetAnalytics({
                userId: session.userId,
                sessionId: sessionId,
                eventType: "download",
                eventData: {},
            });
        }
        // Generate filename
        const productName = session.productName?.replace(/[^a-zA-Z0-9]/g, "_") || "try-on";
        const filename = `mirror-me-${productName}-${sessionId.slice(0, 8)}.jpg`;
        // If result is a local media path, read and serve directly
        if (session.resultImage.startsWith("/media/")) {
            const fs = await import("fs/promises");
            const pathModule = await import("path");
            const mediaRoot = process.env.MEDIA_ROOT || pathModule.join(process.cwd(), "uploads");
            const relativePath = session.resultImage.replace("/media/", "");
            const filePath = pathModule.join(mediaRoot, relativePath);
            try {
                const fileBuffer = await fs.readFile(filePath);
                res.setHeader("Content-Type", "image/jpeg");
                res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
                res.setHeader("Access-Control-Allow-Origin", "*");
                return res.send(fileBuffer);
            }
            catch (fileError) {
                console.error("Error reading result image file:", fileError);
                return res.status(404).json({
                    success: false,
                    error: {
                        code: "RESULT_NOT_FOUND",
                        message: "Result image file not found",
                    },
                });
            }
        }
        // If result is an external URL, fetch and serve with download headers
        if (session.resultImage.startsWith("http")) {
            try {
                const response = await fetch(session.resultImage);
                if (!response.ok) {
                    throw new Error("Failed to fetch image");
                }
                const buffer = await response.arrayBuffer();
                const contentType = response.headers.get("content-type") || "image/jpeg";
                res.setHeader("Content-Type", contentType);
                res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
                res.setHeader("Access-Control-Allow-Origin", "*");
                return res.send(Buffer.from(buffer));
            }
            catch (fetchError) {
                console.error("Error fetching result image:", fetchError);
                return res.status(500).json({
                    success: false,
                    error: {
                        code: "DOWNLOAD_FAILED",
                        message: "Failed to download result image",
                    },
                });
            }
        }
        // If result is base64, serve it directly
        if (session.resultImage.startsWith("data:")) {
            const matches = session.resultImage.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
                const mimeType = matches[1];
                const base64Data = matches[2];
                const buffer = Buffer.from(base64Data, "base64");
                res.setHeader("Content-Type", mimeType);
                res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
                res.setHeader("Access-Control-Allow-Origin", "*");
                return res.send(buffer);
            }
        }
        res.status(404).json({
            success: false,
            error: {
                code: "RESULT_NOT_FOUND",
                message: "Result format not recognized",
            },
        });
    }
    catch (error) {
        console.error("Error downloading result:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to download result",
            },
        });
    }
});
/**
 * POST /api/widget/analytics
 * Track widget events
 */
router.post("/analytics", widgetAuth, async (req, res) => {
    try {
        const user = req.widgetUser;
        // Validate request body
        const validationResult = trackWidgetEventSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid request body",
                    details: validationResult.error.errors,
                },
            });
        }
        const { sessionId, eventType, eventData } = validationResult.data;
        // If sessionId provided, verify it belongs to this user
        if (sessionId) {
            const storage = await getStorage();
            const session = await storage.getWidgetSession(sessionId);
            if (session && session.userId !== user.id) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: "ACCESS_DENIED",
                        message: "You do not have access to this session",
                    },
                });
            }
        }
        // Create analytics entry
        const storage = await getStorage();
        await storage.createWidgetAnalytics({
            userId: user.id,
            sessionId: sessionId || null,
            eventType,
            eventData: eventData || {},
        });
        res.json({
            success: true,
            message: "Event tracked successfully",
        });
    }
    catch (error) {
        console.error("Error tracking analytics:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to track event",
            },
        });
    }
});
export default router;
