import type { ApiVersion } from '../versioning.js';

export interface RoyaltyportConfig {
  /** API key or OAuth access token */
  apiKey: string;
  /** Exact release supported by these result types. Older SDK releases retain Aster. */
  apiVersion?: ApiVersion;
  /** Base URL for the API. Defaults to 'https://api.royaltyport.com' */
  baseUrl?: string;
  /** Custom fetch implementation for testing or proxying */
  fetch?: typeof globalThis.fetch;
}

export interface PaginationOptions {
  /** Page number (default: 1) */
  page?: number;
  /** Items per page (default: 20, max: 100) */
  perPage?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total_count: number;
  page: number;
  per_page: number;
}

export interface RateLimit {
  limit: number;
  remaining: number;
  reset: number;
}

export interface ApiResponse<T> {
  /** Resolved API contract, checked against this client’s pin. */
  apiVersion: ApiVersion;
  meta?: Record<string, unknown>;
  data: T;
  rateLimit: RateLimit;
}
