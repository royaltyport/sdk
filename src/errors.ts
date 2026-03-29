import type { RateLimit } from './types/common.js';

export class RoyaltyportError extends Error {
  readonly status: number;
  readonly rateLimit: RateLimit | undefined;

  constructor(message: string, status: number, rateLimit?: RateLimit) {
    super(message);
    this.name = 'RoyaltyportError';
    this.status = status;
    this.rateLimit = rateLimit;
  }
}

export class RoyaltyportAuthenticationError extends RoyaltyportError {
  constructor(message: string, rateLimit?: RateLimit) {
    super(message, 401, rateLimit);
    this.name = 'RoyaltyportAuthenticationError';
  }
}

export class RoyaltyportRateLimitError extends RoyaltyportError {
  readonly retryAfter: number | undefined;

  constructor(message: string, rateLimit?: RateLimit) {
    super(message, 429, rateLimit);
    this.name = 'RoyaltyportRateLimitError';
    this.retryAfter = rateLimit?.reset;
  }
}

export class RoyaltyportValidationError extends RoyaltyportError {
  constructor(message: string, rateLimit?: RateLimit) {
    super(message, 400, rateLimit);
    this.name = 'RoyaltyportValidationError';
  }
}
