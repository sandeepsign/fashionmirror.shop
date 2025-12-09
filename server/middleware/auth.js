import { getStorage } from "../storage";
// Authentication middleware that checks if user is logged in
export async function requireAuth(req, res, next) {
    try {
        // Check if user is logged in via session
        const userId = req.session?.userId;
        if (!userId) {
            return res.status(401).json({
                error: "Authentication required. Please log in to access this resource."
            });
        }
        // Get user details from database
        const storage = await getStorage();
        const user = await storage.getUser(userId);
        if (!user) {
            // Clear invalid session
            req.session.destroy((err) => {
                if (err)
                    console.error("Session destroy error:", err);
            });
            return res.status(401).json({
                error: "Invalid session. Please log in again."
            });
        }
        // Check if user is verified
        if (user.isVerified !== "true") {
            return res.status(401).json({
                error: "Please verify your email address before accessing this resource."
            });
        }
        // Attach user to request object (excluding password)
        const { password: _, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;
        next();
    }
    catch (error) {
        console.error("Authentication middleware error:", error);
        res.status(500).json({
            error: "Authentication service temporarily unavailable."
        });
    }
}
// Optional authentication middleware that populates req.user if logged in
export async function optionalAuth(req, res, next) {
    try {
        const userId = req.session?.userId;
        if (userId) {
            const storage = await getStorage();
            const user = await storage.getUser(userId);
            if (user && user.isVerified === "true") {
                const { password: _, ...userWithoutPassword } = user;
                req.user = userWithoutPassword;
            }
        }
        next();
    }
    catch (error) {
        console.error("Optional auth middleware error:", error);
        // Don't fail the request if optional auth fails
        next();
    }
}
