import type { ApiVersion } from '../versioning.js';

export interface RoyaltyportConfig {
  /** API key or OAuth access token */
  apiKey: string;
  /** Optional assertion of the fixed Birch release; other releases are rejected. */
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

export interface ApiLinks {
  self?: string;
  next?: string | null;
  agents?: string;
  [key: string]: string | null | undefined;
}

export interface ApiErrorDetails {
  code?: string;
  message?: string;
  links?: ApiLinks;
  decision_id?: string;
  [key: string]: unknown;
}

export interface ApiResponse<T, Meta = Record<string, unknown>> {
  /** Resolved API contract, checked against this client’s pin. */
  apiVersion: ApiVersion;
  meta?: Meta & { revision?: string };
  links?: ApiLinks;
  data: T;
  rateLimit: RateLimit;
}
