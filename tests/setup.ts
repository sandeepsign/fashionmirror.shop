/**
 * Test Setup File
 *
 * This file runs before all tests to set up the test environment.
 */

import { beforeAll, afterAll, vi } from 'vitest';

// Set test environment
process.env.NODE_ENV = 'test';

// Mock environment variables
process.env.SESSION_SECRET = 'test-session-secret-12345';

// Mock console.error in tests to reduce noise
beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
});
