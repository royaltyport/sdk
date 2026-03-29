import type { PaginationOptions } from './common.js';

export interface Relation {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  internal_uuid: string;
  created_at: string;
  updated_at: string;
  merged?: MergedRelation[];
}

export interface MergedRelation {
  id: number;
  name: string;
  merged_at: string;
}

export interface RelationListOptions extends PaginationOptions {
  includeMerged?: boolean;
}

export interface RelationGetOptions {
  includeMerged?: boolean;
}
