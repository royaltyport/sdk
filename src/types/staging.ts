export type StagingAvailableAction = 'retry';

export interface StagingActionResult {
  staging_id: number;
  status: 'queued' | 'paused';
  enqueued?: number;
  usage_meter?: number | null;
  usage_limit?: number | null;
}

export interface StagingActionState {
  pause_reason: string | null;
}
