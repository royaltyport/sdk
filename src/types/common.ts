export interface RoyaltyportConfig {
  /** API key or OAuth access token */
  apiKey: string;
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
  data: T;
  rateLimit: RateLimit;
}

export interface SseProgressEvent {
  bytesUploaded: number;
  bytesTotal: number;
  percent: number;
}
