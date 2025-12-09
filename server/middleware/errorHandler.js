/**
 * Global Error Handling Middleware
 *
 * This middleware catches all errors and returns consistent API responses.
 */
import { AppError, ErrorCodes, logError } from '../utils/errors';
// Generate a unique request ID
function generateRequestId() {
    return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}
// Request ID middleware - adds unique ID to each request
export function requestIdMiddleware(req, res, next) {
    const requestId = req.headers['x-request-id'] || generateRequestId();
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
}
// Request logging middleware
export function requestLogger(req, res, next) {
    const startTime = Date.now();
    // Log request
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Request ID: ${req.requestId}`);
    // Log response on finish
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
        console[logLevel](`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - Request ID: ${req.requestId}`);
    });
    next();
}
// Not Found handler - for undefined routes
export function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`,
            userMessage: 'The requested resource was not found.',
            requestId: req.requestId,
        },
    });
}
// Global error handler
export const globalErrorHandler = (error, req, res, _next) => {
    // Log the error
    logError(error, {
        requestId: req.requestId,
        action: `${req.method} ${req.path}`,
        metadata: {
            body: req.body,
            query: req.query,
            params: req.params,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        },
    });
    // Handle known operational errors
    if (error instanceof AppError) {
        return res.status(error.httpStatus).json({
            success: false,
            error: {
                code: error.code,
                message: error.message,
                userMessage: error.userMessage,
                details: error.details,
                requestId: req.requestId,
            },
        });
    }
    // Handle Multer errors (file upload)
    if (error.name === 'MulterError') {
        const multerError = error;
        if (multerError.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: {
                    code: ErrorCodes.IMAGE_TOO_LARGE.code,
                    message: ErrorCodes.IMAGE_TOO_LARGE.message,
                    userMessage: ErrorCodes.IMAGE_TOO_LARGE.userMessage,
                    requestId: req.requestId,
                },
            });
        }
        return res.status(400).json({
            success: false,
            error: {
                code: 'FILE_UPLOAD_ERROR',
                message: multerError.message,
                userMessage: 'File upload failed. Please try again.',
                requestId: req.requestId,
            },
        });
    }
    // Handle JSON parsing errors
    if (error instanceof SyntaxError && 'body' in error) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_JSON',
                message: 'Invalid JSON in request body',
                userMessage: 'The request data is malformed.',
                requestId: req.requestId,
            },
        });
    }
    // Handle validation errors from Zod (if passed through)
    if (error.name === 'ZodError') {
        return res.status(400).json({
            success: false,
            error: {
                code: ErrorCodes.VALIDATION_ERROR.code,
                message: ErrorCodes.VALIDATION_ERROR.message,
                userMessage: ErrorCodes.VALIDATION_ERROR.userMessage,
                details: error.errors,
                requestId: req.requestId,
            },
        });
    }
    // For unknown errors in production, don't expose details
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(500).json({
        success: false,
        error: {
            code: ErrorCodes.INTERNAL_ERROR.code,
            message: isProduction ? ErrorCodes.INTERNAL_ERROR.message : error.message,
            userMessage: ErrorCodes.INTERNAL_ERROR.userMessage,
            ...(isProduction ? {} : { stack: error.stack }),
            requestId: req.requestId,
        },
    });
};
// Async handler wrapper - catches errors from async route handlers
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
// Graceful shutdown handler
export function setupGracefulShutdown(server) {
    const shutdown = (signal) => {
        console.log(`\n[${new Date().toISOString()}] ${signal} received. Shutting down gracefully...`);
        server.close(() => {
            console.log('[Server] HTTP server closed.');
            process.exit(0);
        });
        // Force close after 10 seconds
        setTimeout(() => {
            console.error('[Server] Could not close connections in time, forcefully shutting down.');
            process.exit(1);
        }, 10000);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        console.error('[Fatal] Uncaught Exception:', error);
        process.exit(1);
    });
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        console.error('[Fatal] Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1);
    });
}
export default {
    requestIdMiddleware,
    requestLogger,
    notFoundHandler,
    globalErrorHandler,
    asyncHandler,
    setupGracefulShutdown,
};
