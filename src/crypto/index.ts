import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from 'crypto';
import { Buffer } from 'node:buffer';

export class AesGcm {
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
