import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from 'crypto';
import { Buffer } from 'node:buffer';
import { EncryptedMsg } from '../types';

export class AesGcm {
  static getTimeStamp() {
    return Math.floor(Date.now() / 1000).toString();
  }

  static randomIv() {
    return randomBytes(16).toString('hex');
  }

  static encrypt(iv: Buffer, key: Buffer, plaintext: string, aad = '') {
    const cipher = createCipheriv('aes-256-gcm', key, iv).setAAD(
      Buffer.from(aad),
    );

    return Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
      cipher.getAuthTag(),
    ]).toString('base64');
  }

  static decrypt(iv: Buffer, key: Buffer, ciphertext: string, aad = '') {
    const buf = Buffer.from(ciphertext, 'base64');
    const tag = buf.slice(-16);
    const payload = buf.slice(0, -16);

    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag).setAAD(Buffer.from(aad));

    return Buffer.concat([decipher.update(payload), decipher.final()]).toString(
      'utf8',
    );
  }
}

export function SHA1(content: string) {
  return createHash('sha1').update(content).digest('hex');
}

export function safeJsonParse(data: string): any {
  try {
    return JSON.parse(data);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return {};
  }
}

export function getSignature(
  token: string,
  timestamp: string,
  nonce: string,
  data: string,
) {
  return SHA1([token, timestamp, nonce, data].sort().join(''));
}

export function encryptMsg(
  token: string,
  aesKey: string,
  data: string,
): EncryptedMsg {
  const timestamp = AesGcm.getTimeStamp();
  const nonce = AesGcm.randomIv();
  const encryptedData = AesGcm.encrypt(
    Buffer.from(nonce, 'hex'),
    Buffer.from(aesKey, 'hex'),
    data,
  );
  const signature = getSignature(token, timestamp, nonce, encryptedData);
  return {
    timestamp,
    nonce,
    data: encryptedData,
    signature,
  };
}

export function decryptMsg(
  token: string,
  aesKey: string,
  msgStr: string,
): EncryptedMsg {
  const msg = safeJsonParse(msgStr) as EncryptedMsg;
  const signature = getSignature(token, msg.timestamp, msg.nonce, msg.data);
  if (signature !== msg.signature) {
    throw new Error('Invalid signature');
  }
  return {
    timestamp: msg.timestamp,
    nonce: msg.nonce,
    data: AesGcm.decrypt(
      Buffer.from(msg.nonce, 'hex'),
      Buffer.from(aesKey, 'hex'),
      msg.data,
    ),
    signature,
  };
}
