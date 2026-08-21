import type { PaginationOptions } from './common.js';
import type { ResourceScore } from './scores.js';
import type { StagingActionState } from './staging.js';
import type { StatementUploadContext, UploadResult } from './uploads.js';

export interface Statement {
  id: number;
  staging_id?: number;
  file_name: string;
  file_type: string;
  file_size?: number;
  statement_name?: string;
  statement_desc?: string;
  statement_type?: string;
  statement_category?: string;
  statement_subtype?: string;
  statement_producer?: string;
  statement_version?: string;
  extraction_stage?: StatementExtractionStage;
  upload_status?: string;
  approval_status?: string;
  has_revenues?: boolean;
  has_costs?: boolean;
  has_summary?: boolean;
  has_summary_lines?: boolean;
  currency_transaction?: string;
  currency_royalty?: string;
  entity_id?: number;
  created_at: string;
  processed_at?: string;
  modified_at?: string;
  accounting_period?: string;
  statement_summary?: StatementSummary;
  financials?: StatementFinancials;
  detailed?: StatementDetailedExport | null;
  detailed_error?: string | null;
  score?: ResourceScore;
}

export type StatementExtractionStage = 'queued' | 'processing' | 'completed' | 'failed' | 'paused' | 'timed_out' | 'skipped';

export interface StatementFinancials {
  currency: string;
  period: string;
  licensee_revenue: number;
  licensor_revenue: number;
}

export interface StatementSummary {
  meta?: {
    generated_at?: string;
    schema_version?: string;
    extraction_run_id?: string;
  };
  summary: string[];
}

export interface StatementDetailedExport {
  csv_url: string;
  file_name: string;
  row_count: number;
}

export interface StatementListOptions extends PaginationOptions {
  stagingIds?: number[];
  extractionStage?: StatementExtractionStage;
  score?: boolean;
}

export interface StatementGetOptions {
  detailed?: boolean;
  score?: boolean;
}

export interface StatementUpdateInput {
  /** Complete replacement tag-name list. Pass an empty array to clear all tags. */
  tags?: string[];
  /** Licensor name, or null to clear it. */
  payee?: string | null;
  /** Licensee name, or null to clear it. */
  payor?: string | null;
  /** Period such as 2026Y, 2026H1, 2026Q3, or 2026M11; null clears it. */
  accountingPeriod?: string | null;
  /** Target period in the same format as accountingPeriod; null clears it. */
  targetPeriod?: string | null;
  /** Three-letter transaction currency code, or null to clear it. */
  currencyTx?: string | null;
  /** Three-letter royalty currency code, or null to clear it. */
  currency?: string | null;
}

export interface StatementUpdateResult {
  id: number;
  tags: string[];
  payee: string | null;
  payor: string | null;
  accounting_period: string | null;
  target_period: string | null;
  currency_tx: string | null;
  currency: string | null;
  updated_at: string;
}

export interface StatementUploadOptions {
  fileName?: string;
  fileType?: string;
  folderName?: string | null;
  context?: StatementUploadContext;
}

export type StatementUploadResult = UploadResult;

export interface StatementDownloadResult {
  url: string;
  fileName: string;
  fileType: string;
  expiresIn: number;
}

export interface StatementProcesses extends StagingActionState {
  staging_id: number;
  statement_id: number | null;
  staging_done: boolean;
  extraction_done: boolean;
  staging_processes: {
    stage: string;
    info: Record<string, unknown>;
  };
  extraction_processes: {
    stage: string;
    step: number;
    remarks: Record<string, unknown>;
  } | null;
}
