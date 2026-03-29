import { vi } from 'vitest';
import type { HttpClient } from '../http.js';

export function createMockHttp() {
  return {
    get: vi.fn().mockResolvedValue({ data: {}, rateLimit: { limit: 100, remaining: 99, reset: 0 } }),
    post: vi.fn().mockResolvedValue({ data: {}, rateLimit: { limit: 100, remaining: 99, reset: 0 } }),
    postMultipart: vi.fn().mockResolvedValue({ data: {}, rateLimit: { limit: 100, remaining: 99, reset: 0 } }),
  } as unknown as HttpClient;
}
