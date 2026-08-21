import type { PaginationOptions } from './common.js';

export type TagScope = 'contracts' | 'statements';

export interface Tag {
  id: number;
  tag: string;
  scope: TagScope;
  usage_count: number;
}

export interface TagListOptions extends PaginationOptions {
  /** Case-insensitive substring of the tag name. */
  search?: string;
}

export interface TagUpdateInput {
  scope: TagScope;
  resourceId: number | string;
  /** Complete replacement tag-name list. Pass an empty array to clear all tags. */
  tags: string[];
}

export interface UpdatedTag {
  id: number;
  tag: string;
}

export interface TagUpdateResult {
  resource_id: number;
  scope: TagScope;
  tags: UpdatedTag[];
}
