# @royaltyport/sdk

Official Node.js SDK for the Royaltyport API. List projects, query catalog data, upload contracts and statements, and search across project resources.

## Documentation

Full SDK reference available at [docs.royaltyport.com/sdk-reference](https://docs.royaltyport.com/sdk-reference).

## Requirements

- Node.js >= 18.0.0

## Installation

```bash
npm install @royaltyport/sdk
```

## Quick Start

```js
import { Royaltyport } from '@royaltyport/sdk';

const royaltyport = new Royaltyport({
  apiKey: 'rp_your_token_here',
});

// List all projects
const { data: projects } = await royaltyport.projects.list();
for (const project of projects) {
  console.log(project.name);
}

// List artists in a project
const { data } = await royaltyport.artists.list(projects[0].id, { perPage: 50 });
for (const artist of data.items) {
  console.log(artist.name);
}
```

## Authentication

The `apiKey` option accepts both **API tokens** (`rp_` prefix) and **OAuth access tokens**. API tokens are created in **Organizations > Settings > Tokens** in the Royaltyport platform.

The SDK does not auto-read environment variables. To use one, pass it explicitly:

```js
import { Royaltyport } from '@royaltyport/sdk';

const royaltyport = new Royaltyport({
  apiKey: process.env.ROYALTYPORT_TOKEN,
});
```

| Variable | Description |
|----------|-------------|
| `ROYALTYPORT_TOKEN` | API token or OAuth access token |
| `ROYALTYPORT_API_URL` | Custom API base URL (default: `https://api.royaltyport.com`) |

## Configuration

```js
import { Royaltyport } from '@royaltyport/sdk';

const royaltyport = new Royaltyport({
  apiKey: 'rp_your_token_here',       // Required
  baseUrl: 'https://api.example.com', // Optional — defaults to https://api.royaltyport.com
  fetch: customFetch,                 // Optional — custom fetch implementation
});
```

## Resources

| Resource | Methods | Description |
|----------|---------|-------------|
| `royaltyport.projects` | `list`, `get`, `create` | Projects |
| `royaltyport.artists` | `list`, `get` | Artists (with merge history) |
| `royaltyport.writers` | `list`, `get` | Writers (with merge history) |
| `royaltyport.recordings` | `list`, `get` | Recordings (with products) |
| `royaltyport.compositions` | `list`, `get` | Compositions (with products) |
| `royaltyport.entities` | `list`, `get` | Entities (with merge history) |
| `royaltyport.relations` | `list`, `get` | Relations (with merge history) |
| `royaltyport.contracts` | `list`, `get`, `listExtraction`, `update`, `upload`, `download`, `ingestion`, `resolveStaging` | Contracts with paginated extractions, tag updates, upload, download, scoring, and staging recovery |
| `royaltyport.statements` | `list`, `get`, `update`, `upload`, `download`, `ingestion`, `resolveStaging` | Statements with metadata updates, upload, download, scoring, and staging recovery |
| `royaltyport.tags` | `list`, `update` | Scoped contract and statement tags |
| `royaltyport.knowledge` | `search` | Governed organization knowledge applicable to a project |
| `royaltyport.search()` | — | Cross-resource search |

```js
const { data: knowledge } = await royaltyport.knowledge.search(
  projectId,
  'distribution approval policy',
  { limit: 5 },
);

for (const item of knowledge.results) {
  console.log(item.kind, item.name, item.claims);
}
```

## File Uploads

`upload()` accepts a file path, `Buffer`, `Uint8Array`, or `Blob`. Contracts must be PDFs. Statements accept extensionless files and `.csv`, `.tsv`, `.tab`, `.txt`, `.cat`, `.roy`, `.crd`, `.prt`, `.p01`, `.gdf`, `.021`, `.030`, `.303`, `.xlsx`, `.xltx`, `.xlsm`, `.xls`, `.xlsb`, `.ods`, `.xml`, `.gz`, `.pdf`, `.asc`, `.dat`, and `.cp9385146`. Files may be at most 50 MB; the SDK checks the name and size locally, while the server-side stager validates the stored bytes.

```js
// Statements with approved staging context. Existing tag names are reused and
// missing project statement tags are created automatically.
const { data } = await royaltyport.statements.upload(projectId, './statement.xlsx', {
  folderName: 'Ocean Wave/2026/Q1',
  context: {
    accountingPeriod: { value: '2026Q1' },
    targetPeriod: { value: '2026Q1' },
    currencyRoyalty: 'GBP',
    currencyTransaction: 'USD',
    payee: 'Ocean Wave Records Ltd',
    payor: 'Absolute Marketing & Distribution Ltd',
    classification: {
      scenarioFamily: 'distribution.general',
      targetFamily: 'recording_distribution',
    },
    tags: ['Priority', 'Quarterly'],
  },
});
console.log(data.status, data.context_applied); // 'queued', true

// Contracts, with optional extractions, folder, and tag names
const { data: contract } = await royaltyport.contracts.upload(projectId, './contract.pdf', {
  extractions: ['extract-dates', 'extract-language', 'extract-royalties'],
  folderName: 'Ocean Wave/Agreements',
  context: { tags: ['Priority', 'Artist agreement'] },
});
```

Period objects are value-only. Use `2026M1`–`2026M12`, `2026Q1`–`2026Q4`,
`2026H1`/`2026H2`, or `2026Y`; period labels and start/end date overrides are
not accepted. Tags are names, not IDs.

Behind a single `upload()` call the SDK mints a signed storage URL, PUTs the file bytes directly to storage, and completes the upload. Upload progress events are no longer emitted — poll `ingestion()` for staging progress instead:

Supplying `folderName` or `context` seals the metadata immediately and skips the
review step. Successful uploads return `status: 'uploaded'`. `processing_status`
reports admission as `queued`, `paused`, or null; poll the upload for current state.
Contextual results include `context_applied: true`, the immutable `snapshot_hash` and queue counts.

```js
const { data: status } = await royaltyport.statements.ingestion(projectId, data.staging_id);
```

When `status.status === 'paused'`, inspect `pause.actions`. Resolve a supported
capacity pause with its current UUID and a stable idempotency key:

```js
await royaltyport.statements.resolveStaging(projectId, stagingId, {
  pause_id: status.pause.id,
  action: 'retry',
  input: {},
}, { idempotencyKey: 'one-stable-key-for-this-decision' });
```

Use source-wide `status` and `terminal` for lifecycle decisions. Results live in
`resources[]`; each `document_processes[]` entry has its own extraction details.
Use source-wide ingestion and pause-bound resolution; this SDK exposes only Birch response types.

Score data is opt-in on contract and statement list/detail calls:

```js
const { data } = await royaltyport.contracts.list(projectId, { score: true });
```

Custom extractor results are also opt-in by numeric extractor ID. Each result
contains `id`, `internal_uuid`, `created_at`, `updated_at`, the extractor ID,
its current name, and the extracted data:

```js
const { data } = await royaltyport.contracts.list(projectId, {
  extractorIds: [201, 202],
});
console.log(data.items[0]?.custom_extractions);
```

## Contract Extractions

### Paginated extraction

For a large or complete extraction collection, use `listExtraction()` from
page 1. It supports every contract extraction key, defaults to 100 items per
page, and accepts up to 250:

```ts
const { data: recordings } = await royaltyport.contracts.listExtraction(
  projectId,
  contractId,
  'recordings',
  { page: 1, perPage: 250, citations: true },
);

console.log(recordings.items);
console.log(recordings.total_count);
console.log(recordings.page);
console.log(recordings.per_page);
```

The pagination envelope contains `items`, `total_count`, `page`, and
`per_page`. Payment extractions use the public key `compensations`. Only the
top-level extraction collection is paginated; nested arrays remain attached to
each item and are not independently capped or paginated.

With `citations: true`, extraction items include supporting citations.

## Updates and Tags

Update a contract's complete tag list, or patch selected statement metadata:

```ts
await royaltyport.contracts.update(projectId, contractId, {
  tags: ['Priority', 'Artist agreement'],
});

await royaltyport.statements.update(projectId, statementId, {
  tags: ['Priority', 'Quarterly'],
  payee: 'Ocean Wave Records Ltd',
  accountingPeriod: '2026Q1',
  currency: 'GBP',
});
```

Tags are scoped separately to contracts and statements. `update()` replaces the
complete list for one resource; pass an empty array to clear it.

```ts
const { data } = await royaltyport.tags.list(projectId, 'contracts', {
  search: 'priority',
  page: 1,
  perPage: 100,
});

await royaltyport.tags.update(projectId, {
  scope: 'contracts',
  resourceId: contractId,
  tags: ['Priority'],
});
```

If the flow fails after the file bytes reached storage, the SDK throws `RoyaltyportUploadError` with a `step` (`'put'` or `'complete'`) and the `stagingId`. On a `'complete'` failure the bytes are already stored — completion can be re-run manually via `POST /v1/{statements|contracts}/uploads/complete` with that `stagingId`.

## Error Handling

```js
import {
  Royaltyport,
  RoyaltyportAuthenticationError,
  RoyaltyportRateLimitError,
  RoyaltyportValidationError,
} from '@royaltyport/sdk';

const royaltyport = new Royaltyport({
  apiKey: 'rp_your_token_here',
});

try {
  const { data } = await royaltyport.projects.list();
} catch (error) {
  if (error instanceof RoyaltyportAuthenticationError) {
    // 401 — invalid or expired token
  } else if (error instanceof RoyaltyportRateLimitError) {
    // 429 — rate limit exceeded (auto-retried up to 3x)
  } else if (error instanceof RoyaltyportValidationError) {
    // 400 — invalid parameters
  }
}
```

The SDK automatically retries `429`, `5xx`, and network failures for idempotent requests. Upload mint and completion POSTs are not retried because an ambiguous failure may already have created or changed server state.

## TypeScript

The SDK is written in TypeScript and ships with full type definitions. You get autocomplete and type checking out of the box — no additional `@types` packages needed.

## Agent Skill

This repo includes a [skills.sh](https://skills.sh/)-compatible skill that teaches AI agents how to use the SDK to query and manage Royaltyport project data programmatically.

Install it into your agent:

```bash
npx skills add royaltyport/royaltyport-sdk
```

The skill covers client setup, resource queries, file uploads, search patterns, and error handling — everything an agent needs to interact with the Royaltyport API via the SDK.

## License

MIT


### Resolve a paused document

The document-resolution endpoints are additive and require the matching API update.
Read processing status first and submit its current `pause.id` (or `pause_id`).
Use one stable idempotency key per decision. If a request times out, retry the
same key and payload; a different payload under that key returns HTTP 409.
HTTP 202 means accepted for background dispatch; HTTP 200 can mean capacity
is still full. Continue reading the stable `/ingestion` URL and use the
source-wide `status`, `terminal`, and `poll_after_seconds` fields. A paused or
unknown source is not a signal to poll forever. Existing retry methods remain
available for older integrations.

```ts
const result = await royaltyport.contracts.resolveStaging(
  projectId,
  stagingId,
  { pause_id: pauseId, action: 'retry', input: {} },
  { idempotencyKey: 'juniper-capacity-decision-1' },
);
console.log(result.data.status, result.meta?.decision_id);

// Statements expose the same method for capacity retry.
await royaltyport.statements.resolveStaging(
  projectId, stagingId,
  { pause_id: pauseId, action: 'retry', input: {} },
  { idempotencyKey: 'juniper-statement-decision-1' },
);

// Contract-only split approval. Page numbers are inclusive and one-based.
await royaltyport.contracts.resolveStaging(
  projectId, stagingId,
  {
    pause_id: pauseId,
    action: 'approve_split',
    input: { agreements: [
      { title: 'Recording agreement', start_page: 1, end_page: 4, process: true },
      { title: 'Publishing agreement', start_page: 5, end_page: 8, process: true },
    ] },
  },
  { idempotencyKey: 'juniper-split-decision-1' },
);
```

Transport retries preserve the original key and JSON bytes. The SDK never
generates a replacement key. Resolution decision metadata is exposed through
`result.meta`, alongside the unchanged `data` and `rateLimit` properties.

## API release pin

This SDK supports only the fixed `2026-10-20.birch` contract. Its API pin is
independent of package SemVer and the `/v1` URL namespace.

```ts
import { Royaltyport, API_RELEASE } from '@royaltyport/sdk';

const royaltyport = new Royaltyport({
  apiKey: process.env.ROYALTYPORT_API_KEY!,
  apiVersion: API_RELEASE, // optional assertion of the fixed Birch contract
});
const response = await royaltyport.projects.list();
console.log(response.apiVersion);
```

Every API request, including retries and polling, sends `Royaltyport-Version`.
Successful responses must confirm the exact selected release; a missing or
mismatched response header raises `api_version_mismatch` without retrying.
Authentication and invalid-selector errors may precede release resolution.
Signed Storage requests carry neither the API release nor API credentials.

The optional `apiVersion` field asserts this exact pin; it cannot select another
release. Unsupported values fail before any request. There are no older response
types or route adapters in this SDK.


### Hosted integration environment

Client CI uses the GitHub `Staging` environment. Configure its `ROYALTYPORT_TEST_BASE_URL`
and `ROYALTYPORT_TEST_PROJECT_ID` variables and its `ROYALTYPORT_TEST_API_KEY` and
`ROYALTYPORT_TEST_PROTECTION_BYPASS` secrets. The API key is scoped to a synthetic
Staging project. Tests refuse missing configuration, Production targets and hosted
loopback fallbacks. Protection credentials are sent only to the Staging API origin;
Storage transfers receive no API credentials. Local integration tests require explicit
loopback URL, project and key. No Production fixture is a default.


## Check downstream processing and reader readiness

Use `contracts.agents()` or `statements.agents()` after ingestion creates a resource. Pass the canonical resource ID from `resources[]`; keep the staging ID for `ingestion()`.

Read the contract’s downstream state:

```typescript
const { data: agents } = await royaltyport.contracts.agents(projectId, contractId);
const recordings = agents.agent_readiness.find(item => item.key === 'recordings');
```

`agent_runs` summarizes processing runs. `agent_readiness` identifies which outputs you can fetch. A completed run alone does not prove that a reader reflects current inputs. Statement readiness reports processing milestones; it does not promise Data Room serving.

When recordings or compositions are ready, read each page with the same `revision`:

```typescript
if (recordings?.status === 'ready' && recordings.revision) {
  const { data, meta } = await royaltyport.contracts.listExtraction(
    projectId,
    contractId,
    'recordings',
    { expectedRevision: recordings.revision, page: 1, perPage: 100 },
  );
  console.log(data.items, meta?.revision);
}
```

If inputs or reader dependencies change, the API returns `409` with code `readiness_changed`. Fetch Agents again before restarting pagination. Inspect `quality.status` and `quality.issues` for metadata limitations even when the reader is ready. Follow `poll_after_seconds` when it contains a number.

List runs with cursor pagination, then inspect a run’s steps:

```typescript
const runs = await royaltyport.agents.listRuns(projectId, {
  resourceType: 'contract', resourceId: contractId, limit: 20,
});
if (runs.meta?.has_more && runs.meta.next_cursor) {
  const next = await royaltyport.agents.listRuns(projectId, {
    resourceType: 'contract', resourceId: contractId, limit: 20,
    cursor: runs.meta.next_cursor,
  });
  console.log(next.data);
}
if (runs.data[0]) {
  const { data: run } = await royaltyport.agents.getRun(projectId, runs.data[0].id);
  console.log(run.steps);
}
```

Keep the same project, filters and limit when reusing a cursor. Responses retain `meta` and `links.next`. These methods use the SDK’s Birch release pin.

Contract ingestion returns `staging_split_processes` and `staging_split_manifest`. Replace the earlier Birch names `intermediate_processes` and `split_manifest`. Each resulting resource includes `links.agents`.


## Following API links and recovering conflicts

Extraction responses expose `links.self` and `links.next` alongside `data` and
conditional `meta.revision`. Follow the returned link unchanged to preserve
project scope, citations, page size and revision:

```typescript
const page = await royaltyport.contracts.listExtraction(projectId, contractId, 'recordings');
if (page.links?.next) {
  const nextPage = await royaltyport.follow(page.links.next);
  console.log(nextPage.data);
}
```

`follow<T>()` sends a GET using the same credentials and Birch pin. It accepts
only this client's API origin under `/v1/`, rejects credential-bearing URLs and
fragments, and refuses redirects. Signed Storage links use the separate upload
transport, which carries neither API authorization nor the release header.

Upload results include `data.links.self` for live ingestion polling. Confirmation
`status` remains `uploaded`; `processing_status` describes admission by that call
and can be null. Capacity fields can be zero or unavailable. These fields, plus
response envelope metadata/links, survive the upload helper unchanged.

API errors retain structured information in `error.details`, including `links`
and `decision_id`. On `readiness_changed`, inspect `error.details.links.agents`
before restarting pagination. On `resolution_response_contract_changed`, poll
`error.details.links.self`, retain the decision reference and reuse the original
idempotency key. Conflicts are not automatically retried or turned into a new
decision. Upload-completion errors preserve the same details and original cause.
