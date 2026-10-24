# Changelog

## 2.0.0

- Contract reads use dedicated paginated extraction collections.
- Use `contract-deduplication` and `contract-repair` when filtering downstream runs.

- Add `contracts.agents()`, `statements.agents()`, `agents.listRuns()` and `agents.getRun()` for downstream run status and reader readiness. Types use `agent_readiness` and `agent_runs`.
- Add `expectedRevision` to contract extraction options. Conditional recordings/compositions reads retain `meta.revision`; stale revisions raise `409 readiness_changed`.
- Preserve cursor pagination metadata and top-level response links.
- Rename contract ingestion split fields to `staging_split_processes` and `staging_split_manifest`, and add `resources[].links.agents`. Remove the earlier Birch field names without aliases.

- Rename contract/statement polling methods to `ingestion()` and types to `ContractIngestion` / `StatementIngestion`. Both call the Birch `/ingestion` endpoint. Replace calls to `processes()` when upgrading.


## 1.0.0

SDK 1.0 selects API release `2026-10-20.birch`. The API date and SDK package
version are independent.

### Breaking changes

- Document processing uses source-wide `status` and `terminal`, resulting
  `resources[]`, per-document `document_processes[]`, and nested `pause.actions`.
  The retired singleton IDs, completion flags, `extraction_processes`,
  `staging_terminal`, `requires_action`, and top-level pause fields are absent.
- Poll processing with the staging ID returned by the upload. Birch does not
  accept a canonical contract or statement ID as a fallback for that source.
- Replace admission retry with `resolveStaging`, using the current `pause.id`
  as `pause_id` and a stable caller-provided idempotency key. Reuse the same key
  and payload when retrying the same decision.
- Capacity details use `usage_meter` and `usage_limit`.
- Response declarations describe Birch only. An Aster release string cannot
  be used with this SDK's Birch types.

### Additions

- Exact API release headers remain pinned through polling and retries.
  Successful response headers must confirm the selected release.
- Contract split results expose all resulting documents and their extraction
  progress. Paused documents expose supported resolution actions.
- Resolution responses preserve decision metadata. If an old frozen reply
  returns `resolution_response_contract_changed`, poll its existing status URL;
  do not create a second decision.
- Signed Storage transfers receive neither API credentials nor release headers.

### Upgrade from 0.8

Install `@royaltyport/sdk@1.0.0`, update processing readers to the fields above,
and replace old admission retry calls with pause-bound resolution. Existing
installed SDK versions continue to use Aster. Keep SDK 0.8 when retaining that
integration contract; SDK 1.0 does not switch its types to Aster.
