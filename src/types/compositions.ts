import type { PaginationOptions } from './common.js';

export interface Composition {
  id: number;
  name: string;
  iswc?: string;
  writers: CompositionWriter[];
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
  store: string;
}

export interface CompositionListOptions extends PaginationOptions {
  includeProducts?: boolean;
}

export interface CompositionGetOptions {
  includeProducts?: boolean;
}
