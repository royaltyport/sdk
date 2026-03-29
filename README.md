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
