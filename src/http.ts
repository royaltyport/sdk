import type { ApiResponse, RateLimit, SseProgressEvent } from './types/common.js';
import {
  RoyaltyportError,
  RoyaltyportAuthenticationError,
  RoyaltyportRateLimitError,
  RoyaltyportValidationError,
} from './errors.js';

const API_VERSION = '/v1';
const API_MAX_RETRIES = 3;
const API_MAX_RETRY_DELAY = 60_000;
const API_RETRY_DELAY = 500;

export interface HttpClientOptions {
  baseUrl: string;
  token: string;
  fetch: typeof globalThis.fetch;
  /** Override initial retry delay in ms (default: 500). Set to 0 for tests. */
  retryDelay?: number;
}

export interface UploadOptions {
  onProgress?: ((event: SseProgressEvent) => void) | undefined;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly _fetch: typeof globalThis.fetch;
  private readonly initialRetryDelay: number;

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.token = options.token;
    this._fetch = options.fetch;
    this.initialRetryDelay = options.retryDelay ?? API_RETRY_DELAY;
  }

  async get<T>(path: string, query?: Record<string, string | undefined>): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path, query);
    return this.requestWithRetry<T>(url, {
      method: 'GET',
      headers: this.buildHeaders(),
    });
  }

  async post<T>(path: string, body: unknown, query?: Record<string, string | undefined>): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path, query);
    return this.requestWithRetry<T>(url, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    });
  }

  async postMultipart<T>(
    path: string,
    formData: FormData,
    query?: Record<string, string | undefined>,
    options?: UploadOptions,
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path, query);
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.token}`,
    };

    if (options?.onProgress) {
      headers['Accept'] = 'text/event-stream';
    }

    const res = await this._fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const rateLimit = this.parseRateLimit(res.headers);

    if (!res.ok) {
      this.throwError(await this.parseBody(res), res.status, rateLimit);
    }

    if (options?.onProgress && res.headers.get('content-type')?.includes('text/event-stream')) {
      const data = await this.parseSseResponse<T>(res, options.onProgress);
      return { data, rateLimit };
    }

    const body = await this.parseBody(res);
    return { data: body.data as T, rateLimit };
  }

  private buildUrl(path: string, query?: Record<string, string | undefined>): string {
    const url = new URL(`${API_VERSION}${path}`, this.baseUrl);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, value);
        }
      }
    }

    return url.toString();
  }

  private buildHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  private parseRateLimit(headers: Headers): RateLimit {
    return {
      limit: Number(headers.get('X-RateLimit-Limit') ?? 0),
      remaining: Number(headers.get('X-RateLimit-Remaining') ?? 0),
      reset: Number(headers.get('X-RateLimit-Reset') ?? 0),
    };
  }

  private async parseBody(res: Response): Promise<Record<string, unknown>> {
    const text = await res.text();
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return { message: text };
    }
  }

  private throwError(body: Record<string, unknown>, status: number, rateLimit: RateLimit): never {
    const error = body.error as Record<string, unknown> | string | undefined;
    const message =
      (typeof error === 'object' ? (error?.message as string) : undefined) ??
      (typeof error === 'string' ? error : undefined) ??
      (body.message as string | undefined) ??
      `Request failed with status ${status}`;

    switch (status) {
      case 400:
        throw new RoyaltyportValidationError(message, rateLimit);
      case 401:
        throw new RoyaltyportAuthenticationError(message, rateLimit);
      case 429:
        throw new RoyaltyportRateLimitError(message, rateLimit);
      default:
        throw new RoyaltyportError(message, status, rateLimit);
    }
  }

  private async requestWithRetry<T>(url: string, init: RequestInit): Promise<ApiResponse<T>> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= API_MAX_RETRIES; attempt++) {
      try {
        const res = await this._fetch(url, init);
        const rateLimit = this.parseRateLimit(res.headers);

        if (!res.ok) {
          const body = await this.parseBody(res);

          if (attempt < API_MAX_RETRIES && (res.status === 429 || res.status >= 500)) {
            const delay = this.retryDelay(attempt, res.headers);
            await sleep(delay);
            continue;
          }

          this.throwError(body, res.status, rateLimit);
        }

        const body = await this.parseBody(res);
        return { data: body.data as T, rateLimit };
      } catch (err) {
        if (err instanceof RoyaltyportError) throw err;

        lastError = err;
        if (attempt < API_MAX_RETRIES) {
          await sleep(this.retryDelay(attempt));
          continue;
        }
      }
    }

    throw lastError;
  }

  private retryDelay(attempt: number, headers?: Headers): number {
    if (headers) {
      const retryAfter = headers.get('Retry-After');
      if (retryAfter) {
        const seconds = Number(retryAfter);
        if (!Number.isNaN(seconds)) return seconds * 1000;
      }
    }

    const delay = this.initialRetryDelay * Math.pow(2, attempt);
    const jitter = delay * 0.1 * Math.random();
    return Math.min(delay + jitter, API_MAX_RETRY_DELAY);
  }

  private async parseSseResponse<T>(res: Response, onProgress?: (event: SseProgressEvent) => void): Promise<T> {
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let result: T | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop()!;

      for (const part of parts) {
        let event = 'message';
        let data = '';

        for (const line of part.split('\n')) {
          if (line.startsWith('event: ')) event = line.slice(7);
          else if (line.startsWith('data: ')) data = line.slice(6);
        }

        if (!data) continue;

        const parsed = JSON.parse(data) as Record<string, unknown>;

        if (event === 'error') {
          throw new RoyaltyportError(
            (parsed.message as string) ?? 'Request failed',
            500,
          );
        }

        if (event === 'progress') {
          onProgress?.(parsed as unknown as SseProgressEvent);
        }

        if (event === 'complete') {
          result = (parsed.data ?? parsed) as T;
        }
      }
    }

    if (result === null) {
      throw new RoyaltyportError('Stream ended without a complete event', 500);
    }

    return result;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
