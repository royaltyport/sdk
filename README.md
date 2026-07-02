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
| `royaltyport.projects` | `list`, `get` | Projects |
| `royaltyport.artists` | `list`, `get` | Artists (with merge history) |
| `royaltyport.writers` | `list`, `get` | Writers (with merge history) |
| `royaltyport.recordings` | `list`, `get` | Recordings (with products) |
| `royaltyport.compositions` | `list`, `get` | Compositions (with products) |
| `royaltyport.entities` | `list`, `get` | Entities (with merge history) |
| `royaltyport.relations` | `list`, `get` | Relations (with merge history) |
| `royaltyport.contracts` | `list`, `get`, `upload`, `download`, `processes` | Contracts with upload, download, and processing status |
| `royaltyport.statements` | `list`, `get`, `upload`, `download`, `processes` | Statements with upload, download, and processing status |
| `royaltyport.search()` | — | Cross-resource search |

## File Uploads

`upload()` accepts a file path, `Buffer`, `Uint8Array`, or `Blob`. Files must be PDFs of at most 50 MB — enforced locally before any request and re-validated server-side against the real bytes.

```js
// Statements
const { data } = await royaltyport.statements.upload(projectId, './statement.pdf');
console.log(data); // { staging_id: 123, status: 'uploaded', file_path: '...' }

// Contracts, with optional extractions
const { data: contract } = await royaltyport.contracts.upload(projectId, './contract.pdf', {
  extractions: ['extract-dates', 'extract-royalties'],
});
```

Behind a single `upload()` call the SDK mints a signed storage URL, PUTs the file bytes directly to storage, and completes the upload. Upload progress events are no longer emitted — poll `processes()` for staging progress instead:

```js
const { data: status } = await royaltyport.statements.processes(projectId, data.staging_id);
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

The SDK automatically retries `429` and `5xx` errors up to 3 times with exponential backoff.

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
