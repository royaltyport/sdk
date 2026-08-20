import type { PaginationOptions } from './common.js';
import type { AssetIdentifier } from './identifiers.js';

export interface Composition {
  id: number;
  name: string;
  type?: string;
  identifiers: AssetIdentifier<'iswc'>[];
  writers?: unknown[];
  artists?: unknown[];
  creators: CompositionWriter[];
  created_at: string;
  updated_at: string;
  products?: CompositionProduct[];
}

export interface CompositionWriter {
  name: string;
  role?: string;
}

export interface CompositionProduct {
  name: string;
  upc: string;
  release_date?: string;
  artists?: unknown[];
  store: string;
}

export interface CompositionListOptions extends PaginationOptions {
  includeProducts?: boolean;
}

export interface CompositionGetOptions {
  includeProducts?: boolean;
}
