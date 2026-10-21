import { API_RELEASE, API_VERSION_HEADER, type ApiVersion } from './versioning.js';
import type { ApiResponse, RateLimit } from './types/common.js';
import {
  RoyaltyportError,
  RoyaltyportAuthenticationError,
  RoyaltyportRateLimitError,
  RoyaltyportValidationError,
} from './errors.js';

const API_PATH_PREFIX = '/v1';
const API_MAX_RETRIES = 3;
const API_MAX_RETRY_DELAY = 60_000;
const API_RETRY_DELAY = 500;

export interface HttpClientOptions {
  apiVersion?: ApiVersion;
  baseUrl: string;
  token: string;
  fetch: typeof globalThis.fetch;
  /** Override initial retry delay in ms (default: 500). Set to 0 for tests. */
  retryDelay?: number;
}

export interface PostOptions {
  /** Stable caller-provided key for durable decision replay. */
  idempotencyKey?: string;
  /**
   * When false, neither response nor network failures are retried.
   * Use for requests that create state without an idempotency key.
   */
  retry?: boolean;
}

export class HttpClient {
  readonly apiVersion: ApiVersion;
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly _fetch: typeof globalThis.fetch;
  private readonly initialRetryDelay: number;

  constructor(options: HttpClientOptions) {
    if (options.apiVersion !== undefined && options.apiVersion !== API_RELEASE) {
      throw new RoyaltyportError(`This SDK supports only ${API_RELEASE}. Use the SDK release for the requested API family.`, 0, undefined, 'unsupported_api_version');
    }
    this.apiVersion = options.apiVersion ?? API_RELEASE;
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

  async post<T>(
    path: string,
    body: unknown,
    query?: Record<string, string | undefined>,
    options?: PostOptions,
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path, query);
    return this.requestWithRetry<T>(
      url,
      {
        method: 'POST',
        headers: { ...this.buildHeaders(), ...(options?.idempotencyKey ? { 'Idempotency-Key': options.idempotencyKey } : {}) },
        body: JSON.stringify(body),
      },
      options?.retry ?? true,
    );
  }

  async put<T>(
    path: string,
    body: unknown,
    query?: Record<string, string | undefined>,
    options?: PostOptions,
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path, query);
    return this.requestWithRetry<T>(
      url,
      {
        method: 'PUT',
        headers: this.buildHeaders(),
        body: JSON.stringify(body),
      },
      options?.retry ?? false,
    );
  }

  /**
   * PUT to an absolute external URL (e.g. a signed storage URL). Bypasses
   * buildUrl and sends no Authorization header — the URL authorizes itself.
   * Retries like get/post; callers must only pass idempotent requests.
   */
  async putExternal(url: string, opts: { headers: Record<string, string>; body: BodyInit }): Promise<void> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= API_MAX_RETRIES; attempt++) {
      try {
        const res = await this._fetch(url, {
          method: 'PUT',
          headers: opts.headers,
          body: opts.body,
        });

        if (res.ok) return;

        if (attempt < API_MAX_RETRIES && (res.status === 429 || res.status >= 500)) {
          await sleep(this.retryDelay(attempt, res.headers));
          continue;
        }

        const text = await res.text();
        throw new RoyaltyportError(text || `Upload failed with status ${res.status}`, res.status);
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

  private buildUrl(path: string, query?: Record<string, string | undefined>): string {
    const url = new URL(`${API_PATH_PREFIX}${path}`, this.baseUrl);

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
      [API_VERSION_HEADER]: this.apiVersion,
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

    // Zod validation failures arrive as { error: { <field>: ["msg", …] } } with no .message
    let fields: Record<string, string[]> | undefined;
    if (typeof error === 'object' && error !== null && error.message === undefined) {
      fields = error as Record<string, string[]>;
    }

    const message =
      (typeof error === 'object' ? (error?.message as string | undefined) : undefined) ??
      (fields
        ? Object.entries(fields)
            .map(([field, messages]) => `${field}: ${(Array.isArray(messages) ? messages : [messages]).join(', ')}`)
            .join('; ')
        : undefined) ??
      (typeof error === 'string' ? error : undefined) ??
      (body.message as string | undefined) ??
      `Request failed with status ${status}`;

    const code = typeof error === 'object' && typeof error?.code === 'string' ? error.code : undefined;

    switch (status) {
      case 400:
        throw new RoyaltyportValidationError(message, rateLimit, fields, code);
      case 401:
        throw new RoyaltyportAuthenticationError(message, rateLimit, code);
      case 429:
        throw new RoyaltyportRateLimitError(message, rateLimit, code);
      default:
        throw new RoyaltyportError(message, status, rateLimit, code);
    }
  }

  private async requestWithRetry<T>(url: string, init: RequestInit, retry = true): Promise<ApiResponse<T>> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= API_MAX_RETRIES; attempt++) {
      try {
        const res = await this._fetch(url, init);
        const rateLimit = this.parseRateLimit(res.headers);
        const resolvedVersion = res.headers.get(API_VERSION_HEADER);
        // Invalid-selector/authentication errors can precede version resolution.
        if ((res.ok || resolvedVersion !== null) && resolvedVersion !== this.apiVersion) {
          throw new RoyaltyportError(`Expected API release ${this.apiVersion}, received ${resolvedVersion ?? 'no release header'}.`, res.status, rateLimit, 'api_version_mismatch');
        }

        if (!res.ok) {
          const body = await this.parseBody(res);

          if (retry && attempt < API_MAX_RETRIES && (res.status === 429 || res.status >= 500)) {
            const delay = this.retryDelay(attempt, res.headers);
            await sleep(delay);
            continue;
          }

          this.throwError(body, res.status, rateLimit);
        }

        const body = await this.parseBody(res);
        return { apiVersion: this.apiVersion, data: body.data as T, rateLimit, ...(body.meta && typeof body.meta === 'object' ? { meta: body.meta as Record<string, unknown> } : {}) };
      } catch (err) {
        if (err instanceof RoyaltyportError) throw err;

        lastError = err;
        if (retry && attempt < API_MAX_RETRIES) {
          await sleep(this.retryDelay(attempt));
          continue;
        }

        throw lastError;
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

}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
