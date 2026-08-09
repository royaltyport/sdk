import type { PaginationOptions } from './common.js';

export interface Writer {
  id: number;
  name: string;
  created_at: string;
  merged?: MergedWriter[];
}

export interface MergedWriter {
  id: number;
  name: string;
  merged_at: string;
}

export interface WriterListOptions extends PaginationOptions {
  includeMerged?: boolean;
}

export interface WriterGetOptions {
  includeMerged?: boolean;
}
