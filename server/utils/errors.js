/**
 * Centralized Error Handling for Mirror.Me Widget API
 *
 * This module defines all error codes, messages, and error handling utilities
 * for consistent error responses across the API.
 */
// HTTP Status codes mapping
export const HttpStatus = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    PAYMENT_REQUIRED: 402,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    GONE: 410,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
};
// Error codes with their default messages and HTTP status
export const ErrorCodes = {
    // Authentication & Authorization (401, 403)
    INVALID_MERCHANT_KEY: {
        code: 'INVALID_MERCHANT_KEY',
        message: 'The merchant API key is invalid or has been revoked',
        httpStatus: HttpStatus.UNAUTHORIZED,
        userMessage: 'Authentication failed. Please check your API key.',
    },
    DOMAIN_NOT_ALLOWED: {
        code: 'DOMAIN_NOT_ALLOWED',
        message: 'Request origin is not in the merchant\'s allowed domains',
        httpStatus: HttpStatus.FORBIDDEN,
        userMessage: 'This domain is not authorized to use the widget.',
    },
    MERCHANT_SUSPENDED: {
        code: 'MERCHANT_SUSPENDED',
        message: 'Merchant account has been suspended',
        httpStatus: HttpStatus.FORBIDDEN,
        userMessage: 'Your account has been suspended. Please contact support.',
    },
    UNAUTHORIZED: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        httpStatus: HttpStatus.UNAUTHORIZED,
        userMessage: 'Please log in to continue.',
    },
    ACCESS_DENIED: {
        code: 'ACCESS_DENIED',
        message: 'Access denied to this resource',
        httpStatus: HttpStatus.FORBIDDEN,
        userMessage: 'You do not have permission to access this resource.',
    },
    INVALID_CREDENTIALS: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        httpStatus: HttpStatus.UNAUTHORIZED,
        userMessage: 'Invalid email or password. Please try again.',
    },
    // Rate Limiting & Quota (402, 429)
    RATE_LIMIT_EXCEEDED: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
        httpStatus: HttpStatus.TOO_MANY_REQUESTS,
        userMessage: 'Too many requests. Please wait a moment and try again.',
    },
    QUOTA_EXCEEDED: {
        code: 'QUOTA_EXCEEDED',
        message: 'Monthly try-on quota has been reached',
        httpStatus: HttpStatus.PAYMENT_REQUIRED,
        userMessage: 'Monthly limit reached. Please upgrade your plan.',
    },
    // Validation Errors (400)
    VALIDATION_ERROR: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        httpStatus: HttpStatus.BAD_REQUEST,
        userMessage: 'Please check your input and try again.',
    },
    MISSING_SESSION_ID: {
        code: 'MISSING_SESSION_ID',
        message: 'Session ID is required',
        httpStatus: HttpStatus.BAD_REQUEST,
        userMessage: 'Session information is missing.',
    },
    MISSING_PHOTO: {
        code: 'MISSING_PHOTO',
        message: 'Photo file or URL is required',
        httpStatus: HttpStatus.BAD_REQUEST,
        userMessage: 'Please provide a photo to try on.',
    },
    INVALID_DOMAIN: {
        code: 'INVALID_DOMAIN',
        message: 'Invalid domain format',
        httpStatus: HttpStatus.BAD_REQUEST,
        userMessage: 'Please enter a valid domain (e.g., example.com).',
    },
    INVALID_DOMAIN_FORMAT: {
        code: 'INVALID_DOMAIN_FORMAT',
        message: 'Domain format is invalid',
        httpStatus: HttpStatus.BAD_REQUEST,
        userMessage: 'Use format: example.com or *.example.com',
    },
    INVALID_KEY_TYPE: {
        code: 'INVALID_KEY_TYPE',
        message: 'Key type must be live, test, or both',
        httpStatus: HttpStatus.BAD_REQUEST,
        userMessage: 'Invalid key type specified.',
    },
    INVALID_WEBHOOK_URL: {
        code: 'INVALID_WEBHOOK_URL',
        message: 'Webhook URL format is invalid',
        httpStatus: HttpStatus.BAD_REQUEST,
        userMessage: 'Please enter a valid URL starting with https://',
    },
    NO_UPDATES: {
        code: 'NO_UPDATES',
        message: 'No valid updates provided',
        httpStatus: HttpStatus.BAD_REQUEST,
        userMessage: 'No changes were provided.',
    },
    // Image Errors (400)
    INVALID_PRODUCT_IMAGE: {
        code: 'INVALID_PRODUCT_IMAGE',
        message: 'Product image URL is unreachable or invalid',
        httpStatus: HttpStatus.BAD_REQUEST,
        userMessage: 'Unable to load the product image. Please try a different image.',
    },
    INVALID_USER_IMAGE: {
        code: 'INVALID_USER_IMAGE',
        message: 'User photo is invalid or unprocessable',
        httpStatus: HttpStatus.BAD_REQUEST,
        userMessage: 'Unable to process your photo. Please try a different image.',
    },
    IMAGE_TOO_LARGE: {
        code: 'IMAGE_TOO_LARGE',
        message: 'Image file exceeds maximum size',
        httpStatus: HttpStatus.BAD_REQUEST,
        userMessage: 'Image is too large. Please use an image under 10MB.',
    },
    INVALID_IMAGE_TYPE: {
        code: 'INVALID_IMAGE_TYPE',
        message: 'Only image files are allowed',
        httpStatus: HttpStatus.BAD_REQUEST,
        userMessage: 'Please upload an image file (JPG, PNG, etc.).',
    },
    // Session Errors (404, 410)
    SESSION_NOT_FOUND: {
        code: 'SESSION_NOT_FOUND',
        message: 'Session not found',
        httpStatus: HttpStatus.NOT_FOUND,
        userMessage: 'Session not found. Please start a new try-on.',
    },
    SESSION_EXPIRED: {
        code: 'SESSION_EXPIRED',
        message: 'Session has expired',
        httpStatus: HttpStatus.GONE,
        userMessage: 'Your session has expired. Please start over.',
    },
    SESSION_ALREADY_COMPLETED: {
        code: 'SESSION_ALREADY_COMPLETED',
        message: 'Session has already been processed',
        httpStatus: HttpStatus.BAD_REQUEST,
        userMessage: 'This try-on has already been completed.',
    },
    SESSION_PROCESSING: {
        code: 'SESSION_PROCESSING',
        message: 'Session is currently being processed',
        httpStatus: HttpStatus.BAD_REQUEST,
        userMessage: 'Your try-on is still processing. Please wait.',
    },
    // Resource Not Found (404)
    MERCHANT_NOT_FOUND: {
        code: 'MERCHANT_NOT_FOUND',
        message: 'Merchant not found',
        httpStatus: HttpStatus.NOT_FOUND,
        userMessage: 'Account not found.',
    },
    RESULT_NOT_FOUND: {
        code: 'RESULT_NOT_FOUND',
        message: 'Result not available',
        httpStatus: HttpStatus.NOT_FOUND,
        userMessage: 'Result not available yet. Please wait.',
    },
    DOMAIN_NOT_FOUND: {
        code: 'DOMAIN_NOT_FOUND',
        message: 'Domain not found in whitelist',
        httpStatus: HttpStatus.NOT_FOUND,
        userMessage: 'Domain not found.',
    },
    // Conflict (409)
    EMAIL_EXISTS: {
        code: 'EMAIL_EXISTS',
        message: 'An account with this email already exists',
        httpStatus: HttpStatus.CONFLICT,
        userMessage: 'This email is already registered. Please log in instead.',
    },
    DOMAIN_EXISTS: {
        code: 'DOMAIN_EXISTS',
        message: 'Domain already in the whitelist',
        httpStatus: HttpStatus.CONFLICT,
        userMessage: 'This domain is already added.',
    },
    // Processing Errors (500)
    PROCESSING_FAILED: {
        code: 'PROCESSING_FAILED',
        message: 'Try-on generation failed',
        httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        userMessage: 'Unable to generate try-on. Please try again.',
    },
    FETCH_FAILED: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch external resource',
        httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        userMessage: 'Unable to load image. Please try again.',
    },
    DOWNLOAD_FAILED: {
        code: 'DOWNLOAD_FAILED',
        message: 'Failed to download result',
        httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        userMessage: 'Unable to download. Please try again.',
    },
    // Webhook Errors (400, 500)
    NO_WEBHOOK_URL: {
        code: 'NO_WEBHOOK_URL',
        message: 'No webhook URL configured',
        httpStatus: HttpStatus.BAD_REQUEST,
        userMessage: 'Please configure a webhook URL first.',
    },
    WEBHOOK_FAILED: {
        code: 'WEBHOOK_FAILED',
        message: 'Webhook delivery failed',
        httpStatus: HttpStatus.BAD_REQUEST,
        userMessage: 'Unable to reach your webhook endpoint.',
    },
    // Generic Errors
    INTERNAL_ERROR: {
        code: 'INTERNAL_ERROR',
        message: 'An internal server error occurred',
        httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        userMessage: 'Something went wrong. Please try again later.',
    },
    SERVICE_UNAVAILABLE: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service temporarily unavailable',
        httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
        userMessage: 'Service is temporarily unavailable. Please try again later.',
    },
};
/**
 * Custom error class for API errors
 */
export class AppError extends Error {
    code;
    httpStatus;
    userMessage;
    details;
    isOperational;
    constructor(errorCode, options) {
        const errorDef = ErrorCodes[errorCode];
        super(options?.message || errorDef.message);
        this.code = errorDef.code;
        this.httpStatus = errorDef.httpStatus;
        this.userMessage = options?.userMessage || errorDef.userMessage;
        this.details = options?.details;
        this.isOperational = options?.isOperational ?? true;
        // Maintains proper stack trace for where error was thrown
        Error.captureStackTrace(this, this.constructor);
    }
}
/**
 * Create a standardized error response
 */
export function createErrorResponse(errorCode, options) {
    const errorDef = ErrorCodes[errorCode];
    return {
        status: errorDef.httpStatus,
        body: {
            success: false,
            error: {
                code: errorDef.code,
                message: options?.message || errorDef.message,
                userMessage: errorDef.userMessage,
                details: options?.details,
                requestId: options?.requestId,
            },
        },
    };
}
/**
 * Create a standardized success response
 */
export function createSuccessResponse(data, message) {
    return {
        success: true,
        ...(data !== undefined && { data }),
        ...(message && { message }),
    };
}
/**
 * Check if an error is an operational error (expected, handleable)
 * vs a programming error (unexpected, needs attention)
 */
export function isOperationalError(error) {
    if (error instanceof AppError) {
        return error.isOperational;
    }
    return false;
}
/**
 * Get error code details
 */
export function getErrorDetails(errorCode) {
    return ErrorCodes[errorCode];
}
/**
 * Safe error message for production (hides internal details)
 */
export function getSafeErrorMessage(error) {
    if (error instanceof AppError) {
        return error.userMessage;
    }
    return ErrorCodes.INTERNAL_ERROR.userMessage;
}
/**
 * Log error with context (for debugging)
 */
export function logError(error, context) {
    const timestamp = new Date().toISOString();
    const errorInfo = {
        timestamp,
        ...context,
        error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
            ...(error instanceof AppError && {
                code: error.code,
                httpStatus: error.httpStatus,
                isOperational: error.isOperational,
            }),
        } : error,
    };
    // In production, this would go to a logging service
    console.error('[Error]', JSON.stringify(errorInfo, null, 2));
}
export default {
    HttpStatus,
    ErrorCodes,
    AppError,
    createErrorResponse,
    createSuccessResponse,
    isOperationalError,
    getErrorDetails,
    getSafeErrorMessage,
    logError,
};
