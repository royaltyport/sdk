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
  | 'extract-language'
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
  | 'languages'
  | 'signatures'
  | 'control-areas'
  | 'creative-approvals'
  | 'commitments'
  | 'balances'
  | 'recordings'
  | 'compositions'
  | 'relations'
  | 'targets';

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

export interface ContractExtractionIdentity {
  id: number;
  internal_uuid: string;
  created_at: string | null;
  updated_at: string | null;
  citations?: ContractCitation[];
}

export interface ContractEntity extends ContractExtractionIdentity {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  shorthand: string | null;
  is_entity: boolean | null;
  identifiers: unknown | null;
  division_of: string | null;
  role: string | null;
  behalf_of: string | null;
}

export interface ContractArtist extends ContractExtractionIdentity {
  name: string;
  role: string | null;
  entity_id: number | null;
}

export interface ContractWriter extends ContractExtractionIdentity {
  name: string;
  role: string | null;
  entity_id: number | null;
}

export interface ContractRuleBase {
  type: string | null;
  definition: string | null;
  citations?: ContractCitation[];
}

export interface ContractRoyalty extends ContractExtractionIdentity {
  rule_id: string | null;
  rate: number | string | null;
  rate_type: string | null;
  title: string | null;
  description: string | null;
  selection: unknown | null;
  applies_to: string[];
  calculation_base: ContractRuleBase | null;
}

export interface ContractSplitParty {
  id: number;
  name?: string;
  percentage?: number | string;
  contract_entity_id?: number;
  entity_id?: number;
}

export type ContractSplitAsset = {
  id: number;
  coverage: string | null;
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

export interface ContractSplit extends ContractExtractionIdentity {
  source_key: string | null;
  source_ordinal: number | null;
  split_type: string | null;
  asset_identifier: string | null;
  rights_type: string | null;
  revenue_type: string | null;
  parties: ContractSplitParty[];
  assets: ContractSplitAsset[];
}

export interface ContractCost extends ContractExtractionIdentity {
  rule_id: string | null;
  title: string | null;
  description: string | null;
  recoupment_rate: number | string | null;
  requires_approval: boolean | null;
  cost_base: ContractRuleBase | null;
}

export interface ContractCompensation extends ContractExtractionIdentity {
  currency: string | null;
  currency_estimated: boolean | null;
  advances: unknown[] | null;
  fixed_fees: unknown[] | null;
  recurring_payment_type: string | null;
}

export interface ContractDate extends ContractExtractionIdentity {
  extracted_dates: unknown[] | null;
  extracted_terms: unknown[] | null;
  missing_dates: unknown[] | null;
  calculated_end_dates: unknown[] | null;
  calculated_end_date_formulas: unknown[] | null;
  calculated_dates_initialized: boolean;
}

export interface ContractAccountingPeriod extends ContractExtractionIdentity {
  accounting_period: string | null;
  reporting_delay_value: number | null;
  reporting_delay_unit: string | null;
  payment_period_value: number | null;
  payment_period_unit: string | null;
  payout_threshold_value: number | string | null;
  payout_threshold_currency: string | null;
  cross_collateralizes: boolean | null;
  audit_rights: boolean | null;
  audit_rights_condition: string | null;
}

export interface ContractTypeExtraction extends ContractExtractionIdentity {
  type: string | null;
  note: string | null;
}

export interface ContractLanguage extends ContractExtractionIdentity {
  language: string | null;
}

export interface ContractSignature extends ContractExtractionIdentity {
  effective_date: string | null;
  name: string | null;
  entity: string | null;
  signed: boolean | null;
  signing_date: string | null;
}

export interface ContractControlArea extends ContractExtractionIdentity {
  rule_id: string | null;
  description: string | null;
  control_type: string | null;
  exclusivity: string | null;
  rights_type: unknown | null;
  territories: unknown | null;
}

export interface ContractCreativeApproval extends ContractExtractionIdentity {
  approval_id: string | null;
  title: string | null;
  approval_party: string | null;
  description: string | null;
}

export interface ContractBalance extends ContractExtractionIdentity {
  title: string | null;
  description: string | null;
  reasoning: string | null;
}

/** @deprecated Use ContractCitation. */
export type ContractCommitmentCitation = ContractCitation;

export type ContractCommitmentLinkedAsset = {
  id: number;
  source?: string;
  created_at: string | null;
  updated_at: string | null;
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

export interface ContractCommitment extends ContractExtractionIdentity {
  title: string | null;
  type: string | null;
  description: string | null;
  recurring_unit: string | null;
  recurring_quantity: string | null;
  linked_deliverables: ContractCommitmentDeliverable[];
  linked_assets: ContractCommitmentLinkedAsset[];
}

export interface ContractAssetIdentifier {
  type: string;
  value: string;
  source: string;
}

export interface ContractRecording extends ContractExtractionIdentity {
  name: string | null;
  duration_ms: number | null;
  artists: unknown | null;
  work_type: string | null;
  creators: unknown | null;
  identifiers: ContractAssetIdentifier[];
  source: string | null;
  normalized: boolean | null;
  normalized_data: unknown | null;
  confidence: string | null;
  notes: string | null;
  contract_group_id: number | null;
}

export interface ContractComposition extends ContractExtractionIdentity {
  name: string | null;
  writers: unknown | null;
  artists: unknown | null;
  work_type: string | null;
  creators: unknown | null;
  identifiers: ContractAssetIdentifier[];
  source: string | null;
  normalized: boolean | null;
  normalized_data: unknown | null;
  linked_spotify: string;
  linked_chartmetric: string;
  linked_mlc: string | null;
  confidence: string | null;
  notes: string | null;
  contract_group_id: number | null;
}

export interface ContractRelation extends ContractExtractionIdentity {
  name: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  role: string | null;
  entity_id: number | null;
}

export interface ContractTarget extends ContractExtractionIdentity {
  composition_id: number | null;
  recording_id: number | null;
  album_id: string | null;
  number_of_tracks: unknown | null;
  sales_targets: unknown | null;
  price_targets: unknown | null;
}

export interface ContractExtractions {
  entities?: ContractEntity[];
  artists?: ContractArtist[];
  writers?: ContractWriter[];
  royalties?: ContractRoyalty[];
  splits?: ContractSplit[];
  costs?: ContractCost[];
  compensations?: ContractCompensation[];
  dates?: ContractDate[];
  'accounting-periods'?: ContractAccountingPeriod[];
  types?: ContractTypeExtraction[];
  commitments?: ContractCommitment[];
  languages?: ContractLanguage[];
  signatures?: ContractSignature[];
  'control-areas'?: ContractControlArea[];
  'creative-approvals'?: ContractCreativeApproval[];
  balances?: ContractBalance[];
  recordings?: ContractRecording[];
  compositions?: ContractComposition[];
  relations?: ContractRelation[];
  targets?: ContractTarget[];
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

export interface CustomExtraction extends ContractExtractionIdentity {
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

export interface ContractUpdateInput {
  /** Complete replacement tag-name list. Pass an empty array to clear all tags. */
  tags: string[];
}

export interface ContractUpdateResult {
  id: number;
  tags: string[];
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
