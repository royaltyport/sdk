import type { PaginationOptions, SseProgressEvent } from './common.js';

export type ExtractionId =
  | 'extract-accounting-period'
  | 'extract-assets'
  | 'extract-commitments'
  | 'extract-compensations'
  | 'extract-control-areas'
  | 'extract-costs'
  | 'extract-creative-approvals'
  | 'extract-dates'
  | 'extract-royalties'
  | 'extract-signatures'
  | 'extract-splits'
  | 'extract-targets'
  | 'extract-balances';

export type IncludeField =
  | 'entities'
  | 'artists'
  | 'writers'
  | 'royalties'
  | 'splits'
  | 'costs'
  | 'compensations'
  | 'dates'
  | 'accounting-periods'
  | 'types'
  | 'signatures'
  | 'control-areas'
  | 'creative-approvals'
  | 'balances'
  | 'recordings'
  | 'compositions';

export interface Contract {
  id: number;
  file_name: string;
  file_type: string;
  created_at: string;
  extractions?: Record<string, unknown>;
}

export interface ContractListOptions extends PaginationOptions {
  includes?: IncludeField[];
}

export interface ContractGetOptions {
  includes?: IncludeField[];
}

export interface ContractUploadOptions {
  fileName?: string;
  fileType?: string;
  extractions?: ExtractionId[];
  onProgress?: (event: SseProgressEvent) => void;
}

export interface ContractUploadResult {
  staging_id: number;
  staging_stage: string;
  staging_done: boolean;
  extractions_done: boolean;
  created_at: string;
}

export interface DownloadResult {
  url: string;
  expires_at?: string;
}

export interface ContractProcesses {
  staging_id: number;
  contract_id: number | null;
  staging_done: boolean;
  extraction_done: boolean;
  staging_processes: {
    stage: string;
    info: Record<string, { info: Record<string, unknown>; status: string }>;
  };
  extraction_processes: Record<string, unknown> | null;
}
