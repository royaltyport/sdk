import { vi } from 'vitest';
import type { HttpClient } from '../http.js';

export function createMockHttp() {
  return {
    get: vi.fn().mockResolvedValue({ data: {}, rateLimit: { limit: 100, remaining: 99, reset: 0 } }),
    post: vi.fn().mockResolvedValue({ data: {}, rateLimit: { limit: 100, remaining: 99, reset: 0 } }),
    put: vi.fn().mockResolvedValue({ data: {}, rateLimit: { limit: 100, remaining: 99, reset: 0 } }),
    putExternal: vi.fn().mockResolvedValue(undefined),
  } as unknown as HttpClient;
}
