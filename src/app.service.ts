import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AesGcm, SHA1 } from './crypto';
import { Buffer } from 'node:buffer';
import { EncryptedMsg } from './types';
import { BotService } from './bot/bot.service';
import { SocketService } from './socket/socket.service';

@Injectable()
export class AppService {
  constructor(
    private readonly configService: ConfigService,
    private readonly socketService: SocketService,
    private readonly botService: BotService,
  ) {}

  main() {
    this.socketService.onConnection$.subscribe(() => {
      this.socketService.onReceiveCreateBot(() => this.botService.addBot());
    });
  }

  getUnixNow(): number {
    return Math.floor(Date.now() / 1000);
  }

  private getSignature(timestamp: string, nonce: string, enStr: string) {
    const token = this.configService.get<string>('token')!;
    return SHA1([token, timestamp, nonce, enStr].sort().join(''));
  }

  checkSignature(
    timestamp: string,
    nonce: string,
    enStr: string,
    signature: string,
  ) {
    return this.getSignature(timestamp, nonce, enStr) === signature;
  }

  decryptData(nonce: string, enStr: string) {
    const aesKeyHex = this.configService.get<string>('aesKey')!;
    const aesKey = Buffer.from(aesKeyHex, 'hex');
    const iv = Buffer.from(nonce, 'hex');
    return AesGcm.decrypt(iv, aesKey, enStr);
  }

  encryptData(nonce: string, plaintext: string) {
    const aesKeyHex = this.configService.get<string>('aesKey')!;
    const aesKey = Buffer.from(aesKeyHex, 'hex');
    const iv = Buffer.from(nonce, 'hex');
    return AesGcm.encrypt(iv, aesKey, plaintext);
  }

  encryptMsg(data: object): EncryptedMsg {
    const timestamp = this.getUnixNow().toString();
    const nonce = AesGcm.randomIv();
    const encodeData = this.encryptData(nonce, JSON.stringify(data));
    return {
      timestamp,
      nonce,
      data: encodeData,
      signature: this.getSignature(timestamp, nonce, encodeData),
    };
  }

  safeParse<T>(data: string): T | undefined {
    try {
      return JSON.parse(data) as T;
    } catch {
      return undefined;
    }
  }
}
