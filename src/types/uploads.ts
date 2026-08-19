export type UploadStatus = 'uploaded' | 'queued' | 'paused';

export interface UploadPeriod {
  value: string;
}

export type StatementTargetFamily =
  | 'recording_dsp_usage'
  | 'recording_distribution'
  | 'recording_contract_accounting'
  | 'recording_neighbouring_rights'
  | 'recording_direct_license'
  | 'recording_jv_profit_share'
  | 'publishing_collective_distribution'
  | 'publishing_digital_mechanical'
  | 'publishing_administration'
  | 'publishing_direct_license'
  | 'mixed_rights_settlement';

export type StatementScenarioFamily =
  | 'distribution.general'
  | 'distribution.label-services'
  | 'distribution.diy'
  | 'distribution.physical'
  | 'jv.waterfall'
  | 'license.recording-accounting'
  | 'license.publishing-accounting'
  | 'license.sync-sheet'
  | 'license.sync-invoice'
  | 'license.royalty-invoice'
  | 'license.recoupment-invoice'
  | 'dsp.general'
  | 'dsp.spotify'
  | 'dsp.soundcloud'
  | 'dsp.meta'
  | 'dsp.apple'
  | 'dsp.youtube'
  | 'dsp.tidal'
  | 'dsp.tiktok'
  | 'dsp.amazon'
  | 'dsp.deezer'
  | 'dsp.alibaba-taobao'
  | 'dsp.awa'
  | 'dsp.boomplay'
  | 'dsp.iheart'
  | 'dsp.kkbox'
  | 'dsp.netease'
  | 'dsp.pandora'
  | 'dsp.peloton'
  | 'dsp.resso'
  | 'dsp.saavn'
  | 'dsp.slacker'
  | 'dsp.tencent'
  | 'dsp.trebel'
  | 'dsp.twitch'
  | 'cmo.performance'
  | 'cmo.mechanical'
  | 'cmo.sync'
  | 'cmo.neighbouring'
  | 'cmo.publishing-aggregator'
  | 'cmo.publishing-direct';

export interface StatementUploadClassification {
  scenarioFamily: StatementScenarioFamily;
  targetFamily: StatementTargetFamily;
}

export interface StatementUploadContext {
  accountingPeriod?: UploadPeriod;
  targetPeriod?: UploadPeriod;
  currencyRoyalty?: string;
  currencyTransaction?: string;
  payee?: string;
  payor?: string;
  classification?: StatementUploadClassification;
  tags?: string[];
}

export interface ContractUploadContext {
  tags?: string[];
}

export interface UploadResult {
  staging_id: number;
  status: UploadStatus;
  file_path: string;
  context_applied: boolean;
  snapshot_hash?: string;
  enqueued?: number;
  paused?: number;
}
