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
| `royaltyport.contracts` | `list`, `get`, `upload`, `download`, `processes`, `retryStaging` | Contracts with upload, download, scoring, and staging recovery |
| `royaltyport.statements` | `list`, `get`, `upload`, `download`, `processes`, `retryStaging` | Statements with upload, download, scoring, and staging recovery |
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

Behind a single `upload()` call the SDK mints a signed storage URL, PUTs the file bytes directly to storage, and completes the upload. Upload progress events are no longer emitted — poll `processes()` for staging progress instead:

Supplying `folderName` or `context` seals the metadata immediately and skips the
review step. Contextual results have `status: 'queued' | 'paused'`,
`context_applied: true`, and include the immutable `snapshot_hash` plus queue
counts. Context-free uploads retain `status: 'uploaded'`.

```js
const { data: status } = await royaltyport.statements.processes(projectId, data.staging_id);
```

When `status.requires_action` is true, inspect `available_actions` and
`pause_reason`, then retry a capacity pause:

```js
await royaltyport.statements.retryStaging(projectId, stagingId);
```

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

Commitments are an opt-in contract include:

```ts
const { data: contractWithCommitments } = await royaltyport.contracts.get(projectId, contractId, {
  includes: ['commitments'],
  citations: true,
});

for (const commitment of contractWithCommitments.extractions?.commitments ?? []) {
  console.log(commitment.linked_deliverables);
  console.log(commitment.linked_assets);
  console.log(commitment.citations);
}
```

With `citations: true`, extraction items include supporting citations.

Contract languages, balances, and targets use the same include flow:

```ts
const { data: contract } = await royaltyport.contracts.get(projectId, contractId, {
  includes: ['languages', 'balances', 'targets'],
});

console.log(contract.extractions?.languages);
console.log(contract.extractions?.balances);
console.log(contract.extractions?.targets);
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
