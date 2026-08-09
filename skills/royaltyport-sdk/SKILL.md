---
name: royaltyport-sdk
description: Query and manage Royaltyport project data via the Node.js SDK. Use when working with music royalty contracts, statements, entities, artists, writers, relations, recordings, or compositions programmatically.
metadata:
  author: royaltyport
  version: "0.3.0"
---

# Skill: Royaltyport SDK

Access the Royaltyport API programmatically using the official Node.js SDK. List projects, query catalog data (artists, writers, recordings, compositions, entities, relations), upload and download contracts and statements, track processing status, and search across project resources.

## Prerequisites

Install the SDK:

```bash
npm install @royaltyport/sdk
```

Set your API token as an environment variable (preferred for agents):

```bash
export ROYALTYPORT_TOKEN=rp_your_token_here
```

API tokens are created in **Organizations > Settings > Tokens** in the Royaltyport platform. The SDK also accepts OAuth access tokens.

## Client Setup

```ts
import { Royaltyport } from '@royaltyport/sdk';

const royaltyport = new Royaltyport({
  apiKey: process.env.ROYALTYPORT_TOKEN,
});
```

The SDK does **not** auto-read environment variables — always pass `apiKey` explicitly.

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | — | Required. API token (`rp_` prefix) or OAuth access token |
| `baseUrl` | `string` | `https://api.royaltyport.com` | Custom API base URL |
| `fetch` | `typeof fetch` | `globalThis.fetch` | Custom fetch implementation |

## Resources

All resource methods return `ApiResponse<T>` which wraps data and rate-limit info:

```ts
interface ApiResponse<T> {
  data: T;
  rateLimit: { limit: number; remaining: number; reset: number };
}
```

Paginated methods return `ApiResponse<PaginatedResult<T>>`:

```ts
interface PaginatedResult<T> {
  items: T[];
  total_count: number;
  page: number;
  per_page: number;
}
```

### Projects

```ts
// List all projects
const { data: projects } = await royaltyport.projects.list();

// Get a single project
const { data: project } = await royaltyport.projects.get('project_id');
```

### Artists

```ts
// List artists (paginated)
const { data } = await royaltyport.artists.list('project_id', {
  page: 1,
  perPage: 50,
  includeMerged: true, // include dedup merge history
});

for (const artist of data.items) {
  console.log(artist.id, artist.name);
}

// Get a single artist
const { data: artist } = await royaltyport.artists.get('project_id', artistId, {
  includeMerged: true,
});
```

### Writers

```ts
// List writers
const { data } = await royaltyport.writers.list('project_id', {
  page: 1,
  perPage: 50,
  includeMerged: true,
});

// Get a single writer
const { data: writer } = await royaltyport.writers.get('project_id', writerId, {
  includeMerged: true,
});
```

### Recordings

```ts
// List recordings
const { data } = await royaltyport.recordings.list('project_id', {
  page: 1,
  perPage: 50,
  includeProducts: true, // include associated products
});

for (const recording of data.items) {
  console.log(recording.name, recording.isrc, recording.type); // type: 'original' | 'derivative'
}

// Get a single recording
const { data: recording } = await royaltyport.recordings.get('project_id', recordingId, {
  includeProducts: true,
});
```

### Compositions

```ts
// List compositions
const { data } = await royaltyport.compositions.list('project_id', {
  page: 1,
  perPage: 50,
  includeProducts: true,
});

for (const composition of data.items) {
  console.log(composition.name, composition.type);
}

// Get a single composition
const { data: composition } = await royaltyport.compositions.get('project_id', compositionId, {
  includeProducts: true,
});
```

### Entities

```ts
// List entities (companies, labels, publishers)
const { data } = await royaltyport.entities.list('project_id', {
  page: 1,
  perPage: 50,
  includeMerged: true,
  roles: ['assignor'],
});

for (const entity of data.items) {
  console.log(entity.name, entity.email, entity.shorthand);
}

// Get a single entity (includes related artists, writers, relations)
const { data: entity } = await royaltyport.entities.get('project_id', entityId, {
  includeMerged: true,
});
```

### Relations

```ts
// List relations (contacts/people — managers, A&R, lawyers)
const { data } = await royaltyport.relations.list('project_id', {
  page: 1,
  perPage: 50,
  includeMerged: true,
});

// Get a single relation
const { data: relation } = await royaltyport.relations.get('project_id', relationId, {
  includeMerged: true,
});
```

### Contracts

```ts
// List contracts
const { data } = await royaltyport.contracts.list('project_id', {
  page: 1,
  perPage: 50,
  includes: ['entities', 'royalties', 'splits'], // include extracted data
});

// Get a single contract with extracted data
const { data: contract } = await royaltyport.contracts.get('project_id', contractId, {
  includes: ['entities', 'artists', 'writers', 'royalties', 'splits', 'dates'],
});

// Download a contract (returns a signed URL)
const { data: download } = await royaltyport.contracts.download('project_id', contractId);
console.log(download.url); // signed download URL

// Check processing status
const { data: processes } = await royaltyport.contracts.processes('project_id', contractId);
console.log(processes.staging_done, processes.extraction_done);
```

**Available include fields:** `entities`, `artists`, `writers`, `royalties`, `splits`, `costs`, `compensations`, `dates`, `accounting-periods`, `types`, `signatures`, `control-areas`, `creative-approvals`, `balances`, `recordings`, `compositions`.

### Contract Upload

Uploads are PDF-only, max 50 MB. Behind a single `upload()` call the SDK mints a signed storage URL, PUTs the file bytes directly to storage, and completes the upload — the result is `{ staging_id, status: 'uploaded', file_path }`. Poll `processes()` for staging/extraction progress.

```ts
// Upload from file path
const { data: result } = await royaltyport.contracts.upload('project_id', './contract.pdf', {
  extractions: ['extract-royalties', 'extract-splits', 'extract-dates'],
});
console.log(result.staging_id, result.status); // 123 'uploaded'

// Upload from Buffer/Uint8Array/Blob
const { data: result } = await royaltyport.contracts.upload('project_id', fileBuffer, {
  fileName: 'contract.pdf',
  extractions: ['extract-royalties'],
});
```

**Available extractions:** `extract-accounting-period`, `extract-assets`, `extract-commitments`, `extract-compensations`, `extract-control-areas`, `extract-costs`, `extract-creative-approvals`, `extract-dates`, `extract-royalties`, `extract-signatures`, `extract-splits`, `extract-targets`, `extract-balances`.

### Statements

```ts
// List statements
const { data } = await royaltyport.statements.list('project_id', {
  page: 1,
  perPage: 50,
});

for (const statement of data.items) {
  console.log(statement.file_name, statement.extraction_stage, statement.currency_royalty);
}

// Get a single statement with revenue totals, summary, and an optional detailed CSV
const { data: statement } = await royaltyport.statements.get('project_id', statementId, {
  detailed: true,
});
console.log(statement.financials?.licensor_revenue, statement.statement_summary?.summary);
console.log(statement.detailed?.csv_url);

// Upload a statement (PDF-only, max 50 MB)
const { data: result } = await royaltyport.statements.upload('project_id', './statement.pdf');
console.log(result.staging_id, result.status); // 123 'uploaded'

// Download a statement
const { data: download } = await royaltyport.statements.download('project_id', statementId);

// Check extraction status
const { data: processes } = await royaltyport.statements.processes('project_id', statementId);
```

### Search

Search across all resource types in a project:

```ts
const { data: results } = await royaltyport.search('project_id', 'search query');

// Results contain matches from each resource type
for (const match of results.artists) {
  console.log(match.id, match.name);
}
for (const match of results.contracts) {
  console.log(match.matched_file_name, match.matched_keywords, match.rank);
}
// Also: results.recordings, results.compositions, results.entities, results.writers
```

Search result fields differ by resource. Artists, writers, and entities return `id` and `name`; recordings and compositions include string `matched_keywords`, metadata flags, and rank; contracts use `matched_file_name` and `is_content_match`.

### Knowledge Search

Search governed graph knowledge that is organization-wide or applicable to a project:

```ts
const { data } = await royaltyport.knowledge.search(
  'project_id',
  'distribution approval policy',
  { limit: 5 },
);

for (const item of data.results) {
  console.log(item.kind, item.name, item.claims, item.relationships);
}
console.log(data.freshness.last_indexed_at);
```

## Error Handling

```ts
import {
  Royaltyport,
  RoyaltyportAuthenticationError,
  RoyaltyportRateLimitError,
  RoyaltyportValidationError,
  RoyaltyportUploadError,
  RoyaltyportError,
} from '@royaltyport/sdk';

try {
  const { data } = await royaltyport.projects.list();
} catch (error) {
  if (error instanceof RoyaltyportAuthenticationError) {
    // 401 — invalid or expired token
  } else if (error instanceof RoyaltyportRateLimitError) {
    // 429 — rate limited (auto-retried up to 3x before throwing)
    console.log(error.retryAfter); // Unix timestamp from X-RateLimit-Reset
  } else if (error instanceof RoyaltyportValidationError) {
    // 400 — invalid request parameters (error.fields has per-field messages when available)
  } else if (error instanceof RoyaltyportUploadError) {
    // Upload flow failure: error.step is 'put' or 'complete'.
    // On 'complete' the file bytes are already in storage — re-run completion
    // via POST /v1/{contracts|statements}/uploads/complete with error.stagingId.
    console.log(error.step, error.stagingId);
  } else if (error instanceof RoyaltyportError) {
    // Other API error
    console.log(error.status, error.message);
  }
}
```

The SDK automatically retries `429`, `5xx`, and network failures for idempotent requests. Upload mint and completion POSTs are deliberately single-attempt because an ambiguous failure may already have changed server state.

## Common Data Access Patterns

### Get a project overview

```ts
const { data: projects } = await royaltyport.projects.list();
const projectId = projects[0].id;

// Fetch key resources in parallel
const [artists, contracts, recordings] = await Promise.all([
  royaltyport.artists.list(projectId, { perPage: 100 }),
  royaltyport.contracts.list(projectId, { perPage: 100 }),
  royaltyport.recordings.list(projectId, { perPage: 100 }),
]);

console.log(`Artists: ${artists.data.total_count}`);
console.log(`Contracts: ${contracts.data.total_count}`);
console.log(`Recordings: ${recordings.data.total_count}`);
```

### Find an artist and their entities

```ts
const { data: results } = await royaltyport.search(projectId, 'Artist Name');
const artistMatch = results.artists[0];

const { data: artist } = await royaltyport.artists.get(projectId, artistMatch.id, {
  includeMerged: true,
});
```

### Read a contract with all extracted terms

```ts
const { data: contract } = await royaltyport.contracts.get(projectId, contractId, {
  includes: [
    'entities', 'artists', 'writers',
    'royalties', 'splits', 'costs', 'compensations',
    'dates', 'accounting-periods', 'signatures',
    'control-areas', 'creative-approvals', 'balances',
    'recordings', 'compositions',
  ],
});
```

### Paginate through all records

```ts
let page = 1;
const allArtists = [];

while (true) {
  const { data } = await royaltyport.artists.list(projectId, { page, perPage: 100 });
  allArtists.push(...data.items);
  if (allArtists.length >= data.total_count) break;
  page++;
}
```

### Upload a contract and poll until processed

```ts
const { data: upload } = await royaltyport.contracts.upload(projectId, './contract.pdf', {
  extractions: ['extract-royalties', 'extract-splits', 'extract-dates'],
});

// Poll processing status
let done = false;
while (!done) {
  const { data: status } = await royaltyport.contracts.processes(projectId, upload.staging_id);
  done = status.staging_done && status.extraction_done;
  if (!done) await new Promise((r) => setTimeout(r, 3000));
}
```

## Tips

- **Always destructure `{ data }`** from responses — every method returns `ApiResponse<T>`.
- **Use `includes`** on contracts to fetch extracted data in a single call instead of separate requests.
- **Use `includeMerged`** on artists, writers, entities, and relations to get dedup history.
- **Use `includeProducts`** on recordings and compositions to get associated products.
- **Parallelize independent requests** with `Promise.all()` for faster data gathering.
- **Check `total_count`** in paginated results to know when you have all records.
- **The SDK auto-retries idempotent requests** on rate limits and server errors. Do not blindly retry upload mint/completion failures.
- **Rate-limit info** is available on every response via `rateLimit.remaining` to manage throughput.
- **Search first** when you need to find a specific record by name — it searches across all resource types.
