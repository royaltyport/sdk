import { describe, expectTypeOf, it } from 'vitest';
import type { ContractIngestion, Contract, ContractListOptions, ContractGetOptions } from './contracts.js';
import type { StatementIngestion } from './statements.js';

describe('Birch process types', () => {
  it('requires the replacement contract and exposes no legacy singleton fields', () => {
    expectTypeOf<Extract<keyof ContractIngestion, 'contract_id' | 'staging_done' | 'extraction_done' | 'extraction_processes' | 'split_manifest' | 'intermediate_processes'>>().toEqualTypeOf<never>();
    expectTypeOf<Extract<keyof StatementIngestion, 'statement_id' | 'staging_done' | 'extraction_done' | 'extraction_processes'>>().toEqualTypeOf<never>();
    expectTypeOf<ContractIngestion['terminal']>().toEqualTypeOf<boolean>();
    expectTypeOf<StatementIngestion['document_processes'][number]['step']>().toEqualTypeOf<number>();
    expectTypeOf<ContractIngestion['document_processes'][number]['extractions'][number]['name']>().toEqualTypeOf<string>();
  });
});


it('uses dedicated extraction collections in Birch contract types', () => {
  expectTypeOf<Extract<keyof Contract, 'extractions'>>().toEqualTypeOf<never>();
  expectTypeOf<Extract<keyof ContractListOptions, 'includes'>>().toEqualTypeOf<never>();
  expectTypeOf<Extract<keyof ContractGetOptions, 'includes'>>().toEqualTypeOf<never>();
});
