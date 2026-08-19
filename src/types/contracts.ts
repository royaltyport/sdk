import type { PaginationOptions } from './common.js';
import type { ResourceScore } from './scores.js';
import type { StagingActionState } from './staging.js';
import type { ContractUploadContext, UploadResult } from './uploads.js';

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
  internal_uuid: string;
  file_name: string;
  file_type: string;
  created_at: string;
  extractions?: Record<string, unknown>;
  score?: ResourceScore;
}

export interface ContractListOptions extends PaginationOptions {
  includes?: IncludeField[];
  score?: boolean;
}

export interface ContractGetOptions {
  includes?: IncludeField[];
  score?: boolean;
}

export interface ContractUploadOptions {
  fileName?: string;
  fileType?: string;
  extractions?: ExtractionId[];
  folderName?: string | null;
  context?: ContractUploadContext;
}

export type ContractUploadResult = UploadResult;

export interface DownloadResult {
  url: string;
  fileName: string;
  fileType: string;
  expiresIn: number;
}

export interface ContractProcesses extends StagingActionState {
  staging_id: number;
  contract_id: number | null;
  staging_done: boolean;
  extraction_done: boolean;
  staging_processes: {
    stage: string;
    info: Record<string, unknown>;
  };
  extraction_processes: {
    stage: string;
    extractions: Array<{
      name: string;
      status: string;
      completed_at: string | null;
    }>;
  } | null;
}
