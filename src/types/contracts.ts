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
  | 'commitments'
  | 'recordings'
  | 'compositions'
  | 'relations';

export interface ContractCommitmentDeliverable {
  type: string;
  description: string;
  quantity: number;
  fulfilled: number;
  [key: string]: unknown;
}

export type ContractCitationStructure =
  | 'paragraph'
  | 'document_header'
  | 'document_footer'
  | 'table'
  | 'list_item'
  | 'schedule'
  | 'exhibit'
  | 'addendum'
  | 'other';

export interface ContractCitation {
  field: string | null;
  page: number | null;
  section_number: string | null;
  section_title: string | null;
  section_structure: ContractCitationStructure | null;
  citation: string | null;
}

/** @deprecated Use ContractCitation. */
export type ContractCommitmentCitation = ContractCitation;

export type ContractCommitmentLinkedAsset = {
  id: number;
  source?: string;
  created_at: string;
  updated_at?: string;
} & (
  | {
    type: 'recording';
    contract_recording_id: number;
    recording_id: number;
    contract_composition_id?: never;
    composition_id?: never;
  }
  | {
    type: 'composition';
    contract_composition_id: number;
    composition_id: number;
    contract_recording_id?: never;
    recording_id?: never;
  }
);

export interface ContractCommitment {
  id: number;
  title?: string;
  type?: string;
  description?: string;
  recurring_unit?: string;
  recurring_quantity?: string;
  linked_deliverables: ContractCommitmentDeliverable[];
  citations?: ContractCitation[];
  created_at?: string;
  updated_at?: string;
  linked_assets: ContractCommitmentLinkedAsset[];
}

export interface ContractExtractions {
  commitments?: ContractCommitment[];
  [key: string]: unknown;
}

export interface Contract {
  id: number;
  internal_uuid: string;
  file_name: string;
  file_type: string;
  created_at: string;
  extractions?: ContractExtractions;
  custom_extractions?: CustomExtraction[];
  score?: ResourceScore;
}

export interface CustomExtraction {
  extractor_id: number;
  extractor_name: string | null;
  data: unknown;
}

export interface ContractListOptions extends PaginationOptions {
  includes?: IncludeField[];
  extractorIds?: number[];
  score?: boolean;
  citations?: boolean;
}

export interface ContractGetOptions {
  includes?: IncludeField[];
  extractorIds?: number[];
  score?: boolean;
  citations?: boolean;
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
