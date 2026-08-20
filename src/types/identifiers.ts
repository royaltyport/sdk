export type AssetIdentifierType = 'isrc' | 'iswc';

export interface AssetIdentifier<T extends AssetIdentifierType = AssetIdentifierType> {
  type: T;
  value: string;
  source: string;
}
