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
  readonly fields: Record<string, string[]> | undefined;

  constructor(message: string, rateLimit?: RateLimit, fields?: Record<string, string[]>) {
    super(message, 400, rateLimit);
    this.name = 'RoyaltyportValidationError';
    this.fields = fields;
  }
}

export type UploadStep = 'create' | 'put' | 'complete';

export class RoyaltyportUploadError extends RoyaltyportError {
  readonly step: UploadStep;
  readonly stagingId: number | undefined;
  readonly filePath: string | undefined;

  constructor(
    message: string,
    options: { step: UploadStep; status: number; stagingId?: number; filePath?: string; rateLimit?: RateLimit; cause?: unknown },
  ) {
    super(message, options.status, options.rateLimit);
    this.name = 'RoyaltyportUploadError';
    this.step = options.step;
    this.stagingId = options.stagingId;
    this.filePath = options.filePath;
    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}
