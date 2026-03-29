import type { PaginationOptions } from './common.js';

export interface Artist {
  id: number;
  name: string;
  internal_uuid: string;
  created_at: string;
  merged?: MergedArtist[];
}

export interface MergedArtist {
  id: number;
  name: string;
  merged_at: string;
}

export interface ArtistListOptions extends PaginationOptions {
  includeMerged?: boolean;
}

export interface ArtistGetOptions {
  includeMerged?: boolean;
}
