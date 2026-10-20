import type { DocumentProcessingState } from './resolutions.js';

export type StagingAvailableAction = 'retry';

export interface StagingActionResult {
  staging_id: number;
  status: 'queued' | 'paused';
  enqueued?: number;
  usage_meter?: number | null;
  usage_limit?: number | null;
}

export type StagingActionState = Pick<DocumentProcessingState, 'pause'>;
