import type { PaginationOptions, SseProgressEvent } from './common.js';

export interface Statement {
  id: number;
  file_name: string;
  file_type: string;
  status: string;
  currency?: string;
  entity_id?: number;
  created_at: string;
}

export interface StatementListOptions extends PaginationOptions {}

export interface StatementUploadOptions {
  fileName?: string;
  fileType?: string;
  onProgress?: (event: SseProgressEvent) => void;
}

export interface StatementUploadResult {
  staging_id: number;
  staging_stage: string;
  staging_done: boolean;
  created_at: string;
}

export interface StatementDownloadResult {
  url: string;
  expires_at?: string;
}

export interface StatementProcesses {
  staging_id: number;
  statement_id: number | null;
  staging_done: boolean;
  processing_done: boolean;
  staging_processes: {
    stage: string;
    info: Record<string, { info: Record<string, unknown>; status: string }>;
  };
  processing_processes: Record<string, unknown> | null;
}
