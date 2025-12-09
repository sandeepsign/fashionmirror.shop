/**
 * Unit Tests for Error Handling Utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  HttpStatus,
  ErrorCodes,
  AppError,
  createErrorResponse,
  createSuccessResponse,
  isOperationalError,
  getErrorDetails,
  getSafeErrorMessage,
  logError,
} from './errors';

describe('Error Handling Utilities', () => {
  describe('HttpStatus', () => {
    it('should have correct HTTP status codes', () => {
      expect(HttpStatus.OK).toBe(200);
      expect(HttpStatus.CREATED).toBe(201);
      expect(HttpStatus.BAD_REQUEST).toBe(400);
      expect(HttpStatus.UNAUTHORIZED).toBe(401);
      expect(HttpStatus.FORBIDDEN).toBe(403);
      expect(HttpStatus.NOT_FOUND).toBe(404);
      expect(HttpStatus.TOO_MANY_REQUESTS).toBe(429);
      expect(HttpStatus.INTERNAL_SERVER_ERROR).toBe(500);
    });
  });

  describe('ErrorCodes', () => {
    it('should have required properties for each error code', () => {
      Object.values(ErrorCodes).forEach((error) => {
        expect(error).toHaveProperty('code');
        expect(error).toHaveProperty('message');
        expect(error).toHaveProperty('httpStatus');
        expect(error).toHaveProperty('userMessage');
        expect(typeof error.code).toBe('string');
        expect(typeof error.message).toBe('string');
        expect(typeof error.httpStatus).toBe('number');
        expect(typeof error.userMessage).toBe('string');
      });
    });

    it('should have correct status codes for error types', () => {
      // Auth errors
      expect(ErrorCodes.INVALID_MERCHANT_KEY.httpStatus).toBe(401);
      expect(ErrorCodes.UNAUTHORIZED.httpStatus).toBe(401);
      expect(ErrorCodes.INVALID_CREDENTIALS.httpStatus).toBe(401);

      // Forbidden errors
      expect(ErrorCodes.DOMAIN_NOT_ALLOWED.httpStatus).toBe(403);
      expect(ErrorCodes.MERCHANT_SUSPENDED.httpStatus).toBe(403);

      // Not found errors
      expect(ErrorCodes.SESSION_NOT_FOUND.httpStatus).toBe(404);
      expect(ErrorCodes.MERCHANT_NOT_FOUND.httpStatus).toBe(404);

      // Rate limiting
      expect(ErrorCodes.RATE_LIMIT_EXCEEDED.httpStatus).toBe(429);

      // Quota
      expect(ErrorCodes.QUOTA_EXCEEDED.httpStatus).toBe(402);
    });
  });

  describe('AppError', () => {
    it('should create error with correct properties', () => {
      const error = new AppError('VALIDATION_ERROR');

      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.httpStatus).toBe(400);
      expect(error.message).toBe(ErrorCodes.VALIDATION_ERROR.message);
      expect(error.userMessage).toBe(ErrorCodes.VALIDATION_ERROR.userMessage);
      expect(error.isOperational).toBe(true);
    });

    it('should allow custom message override', () => {
      const error = new AppError('VALIDATION_ERROR', {
        message: 'Custom validation message',
      });

      expect(error.message).toBe('Custom validation message');
      expect(error.userMessage).toBe(ErrorCodes.VALIDATION_ERROR.userMessage);
    });

    it('should allow custom user message override', () => {
      const error = new AppError('VALIDATION_ERROR', {
        userMessage: 'Please fix the form errors.',
      });

      expect(error.userMessage).toBe('Please fix the form errors.');
    });

    it('should allow adding details', () => {
      const details = { field: 'email', reason: 'invalid format' };
      const error = new AppError('VALIDATION_ERROR', { details });

      expect(error.details).toEqual(details);
    });

    it('should allow marking as non-operational', () => {
      const error = new AppError('INTERNAL_ERROR', { isOperational: false });

      expect(error.isOperational).toBe(false);
    });

    it('should be an instance of Error', () => {
      const error = new AppError('VALIDATION_ERROR');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should have stack trace', () => {
      const error = new AppError('VALIDATION_ERROR');
      expect(error.stack).toBeDefined();
    });
  });

  describe('createErrorResponse', () => {
    it('should create properly formatted error response', () => {
      const response = createErrorResponse('VALIDATION_ERROR');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toBe(ErrorCodes.VALIDATION_ERROR.message);
      expect(response.body.error.userMessage).toBe(ErrorCodes.VALIDATION_ERROR.userMessage);
    });

    it('should include custom message', () => {
      const response = createErrorResponse('VALIDATION_ERROR', {
        message: 'Email is invalid',
      });

      expect(response.body.error.message).toBe('Email is invalid');
    });

    it('should include details', () => {
      const details = { field: 'email' };
      const response = createErrorResponse('VALIDATION_ERROR', { details });

      expect(response.body.error.details).toEqual(details);
    });

    it('should include request ID', () => {
      const response = createErrorResponse('VALIDATION_ERROR', {
        requestId: 'req_123',
      });

      expect(response.body.error.requestId).toBe('req_123');
    });
  });

  describe('createSuccessResponse', () => {
    it('should create success response without data', () => {
      const response = createSuccessResponse();

      expect(response.success).toBe(true);
      expect(response.data).toBeUndefined();
    });

    it('should create success response with data', () => {
      const data = { id: 1, name: 'Test' };
      const response = createSuccessResponse(data);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
    });

    it('should include message if provided', () => {
      const response = createSuccessResponse(null, 'Operation successful');

      expect(response.success).toBe(true);
      expect(response.message).toBe('Operation successful');
    });
  });

  describe('isOperationalError', () => {
    it('should return true for operational AppError', () => {
      const error = new AppError('VALIDATION_ERROR');
      expect(isOperationalError(error)).toBe(true);
    });

    it('should return false for non-operational AppError', () => {
      const error = new AppError('INTERNAL_ERROR', { isOperational: false });
      expect(isOperationalError(error)).toBe(false);
    });

    it('should return false for regular Error', () => {
      const error = new Error('Regular error');
      expect(isOperationalError(error)).toBe(false);
    });

    it('should return false for non-error values', () => {
      expect(isOperationalError(null)).toBe(false);
      expect(isOperationalError(undefined)).toBe(false);
      expect(isOperationalError('error string')).toBe(false);
      expect(isOperationalError({ code: 'ERROR' })).toBe(false);
    });
  });

  describe('getErrorDetails', () => {
    it('should return error details for valid code', () => {
      const details = getErrorDetails('VALIDATION_ERROR');

      expect(details.code).toBe('VALIDATION_ERROR');
      expect(details.httpStatus).toBe(400);
    });
  });

  describe('getSafeErrorMessage', () => {
    it('should return user message for AppError', () => {
      const error = new AppError('VALIDATION_ERROR');
      expect(getSafeErrorMessage(error)).toBe(ErrorCodes.VALIDATION_ERROR.userMessage);
    });

    it('should return generic message for regular Error', () => {
      const error = new Error('Internal details here');
      expect(getSafeErrorMessage(error)).toBe(ErrorCodes.INTERNAL_ERROR.userMessage);
    });

    it('should return generic message for non-error values', () => {
      expect(getSafeErrorMessage(null)).toBe(ErrorCodes.INTERNAL_ERROR.userMessage);
      expect(getSafeErrorMessage('string error')).toBe(ErrorCodes.INTERNAL_ERROR.userMessage);
    });
  });

  describe('logError', () => {
    it('should log error with context', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const error = new AppError('VALIDATION_ERROR');
      logError(error, {
        requestId: 'req_123',
        userId: 'user_456',
        action: 'createSession',
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][1]);
      expect(loggedData.requestId).toBe('req_123');
      expect(loggedData.userId).toBe('user_456');
      expect(loggedData.action).toBe('createSession');
      expect(loggedData.error.code).toBe('VALIDATION_ERROR');

      consoleErrorSpy.mockRestore();
    });

    it('should log regular errors', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const error = new Error('Something went wrong');
      logError(error);

      expect(consoleErrorSpy).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][1]);
      expect(loggedData.error.message).toBe('Something went wrong');

      consoleErrorSpy.mockRestore();
    });

    it('should log non-error values', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      logError('String error');

      expect(consoleErrorSpy).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][1]);
      expect(loggedData.error).toBe('String error');

      consoleErrorSpy.mockRestore();
    });
  });
});
