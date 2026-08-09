import type { PaginationOptions } from './common.js';

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
  processing_status?: string;
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
}

export type StatementProcessingStatus = 'processed' | 'processing' | 'errors' | 'failed' | 'warnings';

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
  processingStatus?: StatementProcessingStatus;
}

export interface StatementGetOptions {
  detailed?: boolean;
}

export interface StatementUploadOptions {
  fileName?: string;
  fileType?: string;
}

export interface StatementUploadResult {
  staging_id: number;
  status: 'uploaded';
  file_path: string;
}

export interface StatementDownloadResult {
  url: string;
  fileName: string;
  fileType: string;
  expiresIn: number;
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
  processing_processes: {
    status: string;
    stage: number;
    remarks: Record<string, unknown>;
  } | null;
}
