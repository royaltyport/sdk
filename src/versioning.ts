/** API release pinned by this Birch-typed SDK; independent of package SemVer and /v1. */
export const API_RELEASE = '2026-10-20.birch' as const;
export const API_VERSION_HEADER = 'Royaltyport-Version' as const;
export type ApiVersion = typeof API_RELEASE;
