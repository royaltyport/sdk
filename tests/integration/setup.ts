import { Royaltyport } from '../../src/index.js';

import {readIntegrationTarget} from '../helpers/integration-target.js';
const target = readIntegrationTarget(process.env);
export const BASE_URL = target.baseUrl;
export const PROJECT_ID = target.projectId;
const API_KEY = target.apiKey;

export const client = new Royaltyport({
  apiKey: API_KEY,
  baseUrl: BASE_URL,
});
