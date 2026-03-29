import type { PaginationOptions } from './common.js';

export interface Entity {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  shorthand?: string;
  division_of?: string;
  internal_uuid: string;
  created_at: string;
  updated_at: string;
  artists?: EntityArtist[];
  writers?: EntityWriter[];
  relations?: EntityRelation[];
  merged?: MergedEntity[];
}

export interface EntityArtist {
  id: number;
  name: string;
  role: string;
}

export interface EntityWriter {
  id: number;
  name: string;
  role: string;
}

export interface EntityRelation {
  id: number;
  name: string;
  role: string;
}

export interface MergedEntity {
  id: number;
  name: string;
  merged_at: string;
}

export interface EntityListOptions extends PaginationOptions {
  includeMerged?: boolean;
}

export interface EntityGetOptions {
  includeMerged?: boolean;
}
