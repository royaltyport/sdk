import { Royaltyport } from '../../src/index.js';

const API_KEY = process.env.ROYALTYPORT_TEST_API_KEY;
const BASE_URL = process.env.ROYALTYPORT_TEST_BASE_URL ?? 'https://api.royaltyport.com';

if (!API_KEY) {
  throw new Error(
    'ROYALTYPORT_TEST_API_KEY is required for integration tests. ' +
    'Run with: ROYALTYPORT_TEST_API_KEY=rp_... npx vitest run --project integration',
  );
}

export const client = new Royaltyport({
  apiKey: API_KEY,
  baseUrl: BASE_URL,
});

export const PROJECT_ID = process.env.ROYALTYPORT_TEST_PROJECT_ID ?? '683351aa-c0da-49fd-8887-e97f04a6b5ae';
