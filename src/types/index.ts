export interface EncryptedMsg {
  timestamp: string;
  nonce: string;
  data: string;
  signature: string;
}
export enum ChainType {
  EVM = 'evm',
  SOL = 'sol',
  CKB = 'ckb',
}
export interface BaseRequest {
  uid: string;
  data?: string;
}
export interface BaseResponse {
  uid: string;
  data: string;
}
export interface TxRequest {
  uid: string;
  chainType: ChainType;
  from: string;
  data: string;
}
export interface TxResponse {
  uid: string;
  data: string;
}
