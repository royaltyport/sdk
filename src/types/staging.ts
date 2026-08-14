export type StagingAvailableAction = 'retry';

export interface StagingActionResult {
  staging_id: number;
  status: 'queued' | 'paused';
  enqueued?: number;
  current_count?: number | null;
  limit?: number | null;
}

export interface StagingActionState {
  staging_terminal: boolean;
  requires_action: boolean;
  available_actions: StagingAvailableAction[];
  pause_reason: string | null;
}
