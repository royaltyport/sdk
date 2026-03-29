import { describe, it, expect, vi } from 'vitest';
import { HttpClient } from './http.js';
import {
  RoyaltyportError,
  RoyaltyportAuthenticationError,
  RoyaltyportRateLimitError,
  RoyaltyportValidationError,
} from './errors.js';

function mockResponse(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}) {
  const status = init.status ?? 200;
  const headers = new Headers(init.headers);
  return new Response(JSON.stringify(body), { status, headers });
}

function createClient(fetchFn: typeof globalThis.fetch, options?: { retryDelay?: number }) {
  return new HttpClient({
    baseUrl: 'https://api.example.com',
    token: 'test-token',
    fetch: fetchFn,
    retryDelay: options?.retryDelay,
  });
}

describe('HttpClient', () => {
  describe('URL construction', () => {
    it('prepends /v1 to all paths', async () => {
      const fetchFn = vi.fn().mockResolvedValue(mockResponse({ data: {} }));
      const client = createClient(fetchFn);

      await client.get('/artists');

      expect(fetchFn).toHaveBeenCalledWith(
        'https://api.example.com/v1/artists',
        expect.any(Object),
      );
    });

    it('appends query parameters', async () => {
      const fetchFn = vi.fn().mockResolvedValue(mockResponse({ data: {} }));
      const client = createClient(fetchFn);

      await client.get('/artists', { projectId: 'abc', page: '2', perPage: '50' });

      const url = new URL(fetchFn.mock.calls[0]![0] as string);
      expect(url.searchParams.get('projectId')).toBe('abc');
      expect(url.searchParams.get('page')).toBe('2');
      expect(url.searchParams.get('perPage')).toBe('50');
    });

    it('skips undefined query values', async () => {
      const fetchFn = vi.fn().mockResolvedValue(mockResponse({ data: {} }));
      const client = createClient(fetchFn);

      await client.get('/artists', { projectId: 'abc', includeMerged: undefined });

      const url = new URL(fetchFn.mock.calls[0]![0] as string);
      expect(url.searchParams.get('projectId')).toBe('abc');
      expect(url.searchParams.has('includeMerged')).toBe(false);
    });

    it('strips trailing slash from base URL', async () => {
      const fetchFn = vi.fn().mockResolvedValue(mockResponse({ data: {} }));
      const client = new HttpClient({
        baseUrl: 'https://api.example.com/',
        token: 'test-token',
        fetch: fetchFn,
      });

      await client.get('/artists');

      expect(fetchFn.mock.calls[0]![0]).toBe('https://api.example.com/v1/artists');
    });
  });

  describe('authentication', () => {
    it('sends Bearer token in Authorization header', async () => {
      const fetchFn = vi.fn().mockResolvedValue(mockResponse({ data: {} }));
      const client = createClient(fetchFn);

      await client.get('/artists');

      const init = fetchFn.mock.calls[0]![1] as RequestInit;
      expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer test-token');
    });
  });

  describe('response parsing', () => {
    it('unwraps data from response envelope', async () => {
      const fetchFn = vi.fn().mockResolvedValue(
        mockResponse({ data: { items: [{ id: 1, name: 'Test' }], total_count: 1, page: 1, per_page: 20 } }),
      );
      const client = createClient(fetchFn);

      const result = await client.get('/artists');

      expect(result.data).toEqual({ items: [{ id: 1, name: 'Test' }], total_count: 1, page: 1, per_page: 20 });
    });

    it('parses rate limit headers', async () => {
      const fetchFn = vi.fn().mockResolvedValue(
        mockResponse({ data: {} }, {
          headers: {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '99',
            'X-RateLimit-Reset': '1700000000',
          },
        }),
      );
      const client = createClient(fetchFn);

      const result = await client.get('/artists');

      expect(result.rateLimit).toEqual({
        limit: 100,
        remaining: 99,
        reset: 1700000000,
      });
    });

    it('defaults rate limit to zeros when headers missing', async () => {
      const fetchFn = vi.fn().mockResolvedValue(mockResponse({ data: {} }));
      const client = createClient(fetchFn);

      const result = await client.get('/artists');

      expect(result.rateLimit).toEqual({ limit: 0, remaining: 0, reset: 0 });
    });
  });

  describe('error handling', () => {
    it('throws RoyaltyportValidationError on 400', async () => {
      const fetchFn = vi.fn().mockImplementation(() =>
        Promise.resolve(mockResponse({ error: { message: 'Invalid projectId' } }, { status: 400 })),
      );
      const client = createClient(fetchFn);

      await expect(client.get('/artists')).rejects.toThrow(RoyaltyportValidationError);
      await expect(client.get('/artists')).rejects.toThrow('Invalid projectId');
    });

    it('throws RoyaltyportAuthenticationError on 401', async () => {
      const fetchFn = vi.fn().mockResolvedValue(
        mockResponse({ error: { message: 'Unauthorized' } }, { status: 401 }),
      );
      const client = createClient(fetchFn);

      await expect(client.get('/artists')).rejects.toThrow(RoyaltyportAuthenticationError);
    });

    it('throws RoyaltyportRateLimitError on 429 after retries', async () => {
      const fetchFn = vi.fn().mockImplementation(() =>
        Promise.resolve(mockResponse({ error: { message: 'Rate limit exceeded' } }, { status: 429 })),
      );
      const client = createClient(fetchFn, { retryDelay: 0 });

      await expect(client.get('/artists')).rejects.toThrow(RoyaltyportRateLimitError);
      // 1 initial + 3 retries = 4 calls
      expect(fetchFn).toHaveBeenCalledTimes(4);
    });

    it('throws RoyaltyportError on 500 after retries', async () => {
      const fetchFn = vi.fn().mockImplementation(() =>
        Promise.resolve(mockResponse({ error: { message: 'Internal server error' } }, { status: 500 })),
      );
      const client = createClient(fetchFn, { retryDelay: 0 });

      await expect(client.get('/artists')).rejects.toThrow(RoyaltyportError);
      expect(fetchFn).toHaveBeenCalledTimes(4);
    });

    it('does not retry on 404', async () => {
      const fetchFn = vi.fn().mockResolvedValue(
        mockResponse({ error: { message: 'Not found' } }, { status: 404 }),
      );
      const client = createClient(fetchFn);

      await expect(client.get('/artists/999')).rejects.toThrow(RoyaltyportError);
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('includes rateLimit on error objects', async () => {
      const fetchFn = vi.fn().mockResolvedValue(
        mockResponse({ error: { message: 'Bad request' } }, {
          status: 400,
          headers: { 'X-RateLimit-Limit': '100', 'X-RateLimit-Remaining': '50', 'X-RateLimit-Reset': '123' },
        }),
      );
      const client = createClient(fetchFn);

      try {
        await client.get('/artists');
      } catch (err) {
        expect(err).toBeInstanceOf(RoyaltyportValidationError);
        expect((err as RoyaltyportValidationError).rateLimit).toEqual({
          limit: 100,
          remaining: 50,
          reset: 123,
        });
      }
    });

    it('handles string error body', async () => {
      const fetchFn = vi.fn().mockResolvedValue(
        mockResponse({ error: 'Something went wrong' }, { status: 400 }),
      );
      const client = createClient(fetchFn);

      await expect(client.get('/artists')).rejects.toThrow('Something went wrong');
    });
  });

  describe('retries', () => {
    it('retries and succeeds on transient 500', async () => {
      let callCount = 0;
      const fetchFn = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(mockResponse({ error: { message: 'Oops' } }, { status: 500 }));
        }
        return Promise.resolve(mockResponse({ data: { id: 1 } }));
      });
      const client = createClient(fetchFn, { retryDelay: 0 });

      const result = await client.get('/artists');
      expect(result.data).toEqual({ id: 1 });
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('POST', () => {
    it('sends JSON body with correct headers', async () => {
      const fetchFn = vi.fn().mockResolvedValue(mockResponse({ data: { id: 1 } }));
      const client = createClient(fetchFn);

      await client.post('/contracts', { name: 'test' }, { projectId: 'abc' });

      const [url, init] = fetchFn.mock.calls[0]!;
      expect(new URL(url as string).searchParams.get('projectId')).toBe('abc');
      expect((init as RequestInit).method).toBe('POST');
      expect((init as RequestInit).body).toBe('{"name":"test"}');
      expect(((init as RequestInit).headers as Record<string, string>)['Content-Type']).toBe('application/json');
    });
  });

  describe('SSE parsing', () => {
    it('parses progress and complete events', async () => {
      const sseBody = [
        'event: progress\ndata: {"bytesUploaded":500,"bytesTotal":1000,"percent":50}\n\n',
        'event: progress\ndata: {"bytesUploaded":1000,"bytesTotal":1000,"percent":100}\n\n',
        'event: complete\ndata: {"data":{"staging_id":42}}\n\n',
      ].join('');

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(sseBody));
          controller.close();
        },
      });

      const res = new Response(stream, {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      });

      const fetchFn = vi.fn().mockResolvedValue(res);
      const client = createClient(fetchFn);

      const progressEvents: unknown[] = [];
      const result = await client.postMultipart(
        '/contracts',
        new FormData(),
        { projectId: 'abc' },
        { onProgress: (e) => progressEvents.push(e) },
      );

      expect(progressEvents).toHaveLength(2);
      expect(progressEvents[0]).toEqual({ bytesUploaded: 500, bytesTotal: 1000, percent: 50 });
      expect(progressEvents[1]).toEqual({ bytesUploaded: 1000, bytesTotal: 1000, percent: 100 });
      expect(result.data).toEqual({ staging_id: 42 });
    });

    it('throws on SSE error event', async () => {
      const sseBody = 'event: error\ndata: {"message":"Upload failed"}\n\n';

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(sseBody));
          controller.close();
        },
      });

      const res = new Response(stream, {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      });

      const fetchFn = vi.fn().mockResolvedValue(res);
      const client = createClient(fetchFn);

      await expect(
        client.postMultipart('/contracts', new FormData(), {}, { onProgress: () => {} }),
      ).rejects.toThrow('Upload failed');
    });

    it('throws when stream ends without complete event', async () => {
      const sseBody = 'event: progress\ndata: {"bytesUploaded":500,"bytesTotal":1000,"percent":50}\n\n';

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(sseBody));
          controller.close();
        },
      });

      const res = new Response(stream, {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      });

      const fetchFn = vi.fn().mockResolvedValue(res);
      const client = createClient(fetchFn);

      await expect(
        client.postMultipart('/contracts', new FormData(), {}, { onProgress: () => {} }),
      ).rejects.toThrow('Stream ended without a complete event');
    });
  });

  describe('postMultipart without SSE', () => {
    it('returns parsed response when no onProgress', async () => {
      const fetchFn = vi.fn().mockResolvedValue(
        mockResponse({ data: { staging_id: 42 } }, { status: 201 }),
      );
      const client = createClient(fetchFn);

      const result = await client.postMultipart('/contracts', new FormData(), { projectId: 'abc' });

      expect(result.data).toEqual({ staging_id: 42 });
      const init = fetchFn.mock.calls[0]![1] as RequestInit;
      expect((init.headers as Record<string, string>)['Accept']).toBeUndefined();
    });

    it('sends Accept: text/event-stream when onProgress is set', async () => {
      const sseBody = 'event: complete\ndata: {"data":{"staging_id":1}}\n\n';
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(sseBody));
          controller.close();
        },
      });

      const res = new Response(stream, {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      });

      const fetchFn = vi.fn().mockResolvedValue(res);
      const client = createClient(fetchFn);

      await client.postMultipart('/contracts', new FormData(), {}, { onProgress: () => {} });

      const init = fetchFn.mock.calls[0]![1] as RequestInit;
      expect((init.headers as Record<string, string>)['Accept']).toBe('text/event-stream');
    });
  });
});
