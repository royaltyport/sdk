import { describe, it, expect } from 'vitest';
import { Royaltyport, RoyaltyportAuthenticationError, RoyaltyportError } from '../../src/index.js';
import { PROJECT_ID } from './setup.js';

describe('Error handling (integration)', () => {
  it('throws RoyaltyportAuthenticationError with invalid token', async () => {
    const badClient = new Royaltyport({ apiKey: 'rp_invalid_token_12345' });

    await expect(badClient.projects.list()).rejects.toThrow(RoyaltyportAuthenticationError);
  });

  it('throws RoyaltyportError when project not found', async () => {
    const badClient = new Royaltyport({ apiKey: 'rp_invalid_token_12345' });

    await expect(
      badClient.artists.list('00000000-0000-0000-0000-000000000000'),
    ).rejects.toThrow(RoyaltyportError);
  });

  it('error includes status code and message', async () => {
    const badClient = new Royaltyport({ apiKey: 'rp_invalid_token_12345' });

    try {
      await badClient.projects.list();
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(RoyaltyportError);
      const error = err as RoyaltyportError;
      expect(error.status).toBe(401);
      expect(typeof error.message).toBe('string');
      expect(error.message.length).toBeGreaterThan(0);
    }
  });
});
