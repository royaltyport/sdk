export { API_RELEASE, API_VERSION_HEADER } from './versioning.js';
export type { ApiVersion } from './versioning.js';
export { Royaltyport } from './client.js';

export {
  RoyaltyportError,
  RoyaltyportAuthenticationError,
  RoyaltyportRateLimitError,
  RoyaltyportValidationError,
  RoyaltyportUploadError,
} from './errors.js';
export type { UploadStep } from './errors.js';

export type * from './types/index.js';
