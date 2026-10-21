import { describe, expectTypeOf, it } from 'vitest';
import type { ContractProcesses } from './contracts.js';
import type { StatementProcesses } from './statements.js';

describe('Birch process types', () => {
  it('requires the replacement contract and exposes no legacy singleton fields', () => {
    expectTypeOf<Extract<keyof ContractProcesses, 'contract_id' | 'staging_done' | 'extraction_done' | 'extraction_processes'>>().toEqualTypeOf<never>();
    expectTypeOf<Extract<keyof StatementProcesses, 'statement_id' | 'staging_done' | 'extraction_done' | 'extraction_processes'>>().toEqualTypeOf<never>();
    expectTypeOf<ContractProcesses['terminal']>().toEqualTypeOf<boolean>();
    expectTypeOf<StatementProcesses['document_processes'][number]['step']>().toEqualTypeOf<number>();
    expectTypeOf<ContractProcesses['document_processes'][number]['extractions'][number]['name']>().toEqualTypeOf<string>();
  });
});
